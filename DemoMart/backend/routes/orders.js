import express from "express";
import jwt from "jsonwebtoken";
import Order from "../models/Order.js";
import User from "../models/User.js";

const router = express.Router();


// ==========================================
// DEMOMART CUSTOMER AUTHENTICATION
// ==========================================

const authGuard = (req, res, next) => {
  const token = req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    return res.status(401).json({
      message: "Access denied. Please sign in first.",
    });
  }

  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || "pottery_secret_key"
    );

    req.userId = decoded.id;

    next();
  } catch (error) {
    return res.status(401).json({
      message: "Your session has expired. Please sign in again.",
    });
  }
};


// ==========================================
// RECEIVE VERIFYSAAS REVIEW COMPLETION
// ==========================================

router.post("/verify-review-completed", async (req, res) => {
  try {
    const handoffSecret = process.env.VERIFYSAAS_HANDOFF_SECRET;

    if (!handoffSecret) {
      return res.status(500).json({
        message: "Review integration is not configured.",
      });
    }

    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res.status(401).json({
        message: "Verification token is missing.",
      });
    }

    let payload;

    try {
      payload = jwt.verify(token, handoffSecret, {
        issuer: "verifysaas",
        audience: "demomart",
      });
    } catch (error) {
      return res.status(401).json({
        message: "Invalid review completion notification.",
      });
    }

    if (
      !payload.orderId ||
      !payload.productId ||
      !payload.customerId
    ) {
      return res.status(400).json({
        message: "Review completion information is incomplete.",
      });
    }

    // Find the original order belonging to the customer.
    const order = await Order.findOne({
      orderId: payload.orderId,
      userId: payload.customerId,
    });

    if (!order) {
      return res.status(404).json({
        message: "The original DemoMart order could not be found.",
      });
    }

    // Find the specific purchased product.
    const purchasedItem = order.items.find(
      (item) => item.productId === payload.productId
    );

    if (!purchasedItem) {
      return res.status(404).json({
        message: "The purchased product could not be found.",
      });
    }

    // Mark this product as reviewed.
    purchasedItem.reviewed = true;
    purchasedItem.reviewedAt = new Date();

    await order.save();

    return res.status(200).json({
      message: "DemoMart review status successfully updated.",
    });

  } catch (error) {
    console.error("Review completion notification error:", error);

    return res.status(500).json({
      message: "Unable to update the DemoMart review status.",
    });
  }
});


// ==========================================
// GET ORDER HISTORY
// ==========================================

router.get("/", authGuard, async (req, res) => {
  try {
    const orders = await Order.find({
      userId: req.userId,
    }).sort({ createdAt: -1 });

    res.status(200).json(orders);

  } catch (error) {
    console.error("Order history error:", error);

    res.status(500).json({
      message: "Unable to retrieve order history.",
    });
  }
});


// ==========================================
// CREATE NEW ORDER
// ==========================================

router.post("/", authGuard, async (req, res) => {
  try {
    const { items, total } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        message: "Your order must contain at least one product.",
      });
    }

    const validItems = items.every((item) =>
      item.productId &&
      item.vendorId &&
      item.name &&
      item.vendorName &&
      item.image &&
      Number(item.quantity) > 0 &&
      Number.isFinite(Number(item.price)) &&
      Number(item.price) >= 0
    );

    if (!validItems) {
      return res.status(400).json({
        message: "One or more order items are missing product information.",
      });
    }

    if (!Number.isFinite(Number(total)) || Number(total) < 0) {
      return res.status(400).json({
        message: "Invalid order total.",
      });
    }

    const orderItems = items.map((item) => ({
      productId: item.productId,
      vendorId: item.vendorId,
      vendorName: item.vendorName,
      name: item.name,
      category: item.category || "",
      image: item.image,
      quantity: Number(item.quantity),
      pricePaid: Number(item.price),

      reviewed: false,
      reviewedAt: null,
    }));

    const newOrder = new Order({
      userId: req.userId,

      orderId: `DM-${Date.now()}-${Math.floor(
        100 + Math.random() * 900
      )}`,

      date: new Date().toLocaleDateString("en-KE"),

      items: orderItems,

      subtotal: Number(total),
    });

    await newOrder.save();

    res.status(201).json({
      message: "Order successfully placed.",
      orderId: newOrder.orderId,
      order: newOrder,
    });

  } catch (error) {
    console.error("Checkout error:", error);

    res.status(500).json({
      message: "Unable to process your order.",
    });
  }
});


// ==========================================
// CREATE VERIFYSAAS REVIEW SESSION
// ==========================================

router.post("/:orderId/review-session", authGuard, async (req, res) => {
  try {
    const { orderId } = req.params;
    const { productId } = req.body;

    const handoffSecret = process.env.VERIFYSAAS_HANDOFF_SECRET;

    if (!handoffSecret) {
      return res.status(500).json({
        message: "Review integration has not been configured.",
      });
    }

    if (!productId) {
      return res.status(400).json({
        message: "Product information is missing.",
      });
    }

    // Find the customer's order.
    const order = await Order.findOne({
      orderId,
      userId: req.userId,
    });

    if (!order) {
      return res.status(404).json({
        message: "Order not found.",
      });
    }

    // Find the purchased product.
    const purchasedItem = order.items.find(
      (item) => item.productId === productId
    );

    if (!purchasedItem) {
      return res.status(403).json({
        message: "This product does not belong to the selected order.",
      });
    }

    // Prevent another review if one has already been completed.
    if (purchasedItem.reviewed === true) {
      return res.status(409).json({
        message: "You have already reviewed this purchased product.",
      });
    }

    if (
      !purchasedItem.vendorId ||
      !purchasedItem.image ||
      !purchasedItem.name
    ) {
      return res.status(400).json({
        message: "This order does not contain the information required for a product review. Please use a newer order.",
      });
    }

    // Get the DemoMart customer.
    const customer = await User.findById(req.userId);

    if (!customer) {
      return res.status(404).json({
        message: "Customer account not found.",
      });
    }

    // Create the short-lived signed handoff token.
    const handoffToken = jwt.sign(
      {
        source: "demomart",

        orderId: order.orderId,

        productId: purchasedItem.productId,

        vendorId: purchasedItem.vendorId,

        vendorName: purchasedItem.vendorName,

        productName: purchasedItem.name,

        category: purchasedItem.category,

        listingImage: purchasedItem.image,

        quantity: purchasedItem.quantity,

        customerId: String(req.userId),

        customerEmail: customer.email,
      },
      handoffSecret,
      {
        expiresIn: "5m",
        issuer: "demomart",
        audience: "verifysaas",
      }
    );

    res.status(200).json({
      message: "Review session created successfully.",
      handoffToken,
    });

  } catch (error) {
    console.error("Review session error:", error);

    res.status(500).json({
      message: "Unable to start the product review.",
    });
  }
});


export default router;