import express from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";

import ReviewSession from "../models/ReviewSession.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();


// REDEEM DEMOMART HANDOFF TOKEN
router.post("/redeem", authMiddleware, async (req, res) => {
  try {
    const { handoffToken } = req.body;

    if (!handoffToken) {
      return res.status(400).json({
        message: "Handoff token is required.",
      });
    }

    if (!process.env.VERIFYSAAS_HANDOFF_SECRET) {
      return res.status(500).json({
        message: "Handoff verification is not configured.",
      });
    }

    // VERIFY THE DEMOMART TOKEN
    let payload;

    try {
      payload = jwt.verify(
        handoffToken,
        process.env.VERIFYSAAS_HANDOFF_SECRET,
        {
          issuer: "demomart",
          audience: "verifysaas",
        }
      );

    } catch (error) {
      return res.status(401).json({
        message: "Invalid or expired DemoMart handoff token.",
      });
    }

    // VALIDATE TOKEN INFORMATION
    if (
      payload.source !== "demomart" ||
      !payload.orderId ||
      !payload.productId ||
      !payload.vendorId ||
      !payload.vendorName ||
      !payload.productName ||
      !payload.listingImage ||
      !payload.customerId ||
      !payload.customerEmail
    ) {
      return res.status(400).json({
        message: "The handoff token contains incomplete product information.",
      });
    }

    // GET THE LOGGED-IN VERIFYSaaS USER
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "VerifySaaS account not found.",
      });
    }

    // COMPARE CUSTOMER EMAILS
    const demomartEmail = payload.customerEmail
      .trim()
      .toLowerCase();

    const verifySaaSEmail = user.email
      .trim()
      .toLowerCase();

    if (demomartEmail !== verifySaaSEmail) {
      return res.status(403).json({
        message: "Your VerifySaaS account must use the same email address as your DemoMart account.",
      });
    }

    // HASH THE HANDOFF TOKEN
    const handoffTokenHash = crypto
      .createHash("sha256")
      .update(handoffToken)
      .digest("hex");

    // CREATE REVIEW SESSION
    const reviewSession = await ReviewSession.create({
      userId: req.userId,

      source: "demomart",

      sourceOrderId: payload.orderId,
      sourceProductId: payload.productId,

      demomartCustomerId: payload.customerId,

      vendorId: payload.vendorId,
      vendorName: payload.vendorName,

      productName: payload.productName,
      category: payload.category || "",

      listingImage: payload.listingImage,

      quantity: payload.quantity || 1,

      handoffTokenHash,

      status: "pending",
    });

    return res.status(201).json({
      message: "DemoMart purchase verified successfully.",

      reviewSession: {
        id: reviewSession._id,
        orderId: reviewSession.sourceOrderId,
        productId: reviewSession.sourceProductId,
        vendorId: reviewSession.vendorId,
        vendorName: reviewSession.vendorName,
        productName: reviewSession.productName,
        category: reviewSession.category,
        listingImage: reviewSession.listingImage,
        quantity: reviewSession.quantity,
        status: reviewSession.status,
      },
    });

  } catch (error) {
    console.error("Handoff redemption error:", error);

    if (error.code === 11000) {
      return res.status(409).json({
        message: "This purchased product has already been registered for review.",
      });
    }

    return res.status(500).json({
      message: "Unable to verify this purchase.",
    });
  }
});


// GET A REVIEW SESSION
router.get("/:sessionId", authMiddleware, async (req, res) => {
  try {
    const reviewSession = await ReviewSession.findOne({
      _id: req.params.sessionId,
      userId: req.userId,
    });

    if (!reviewSession) {
      return res.status(404).json({
        message: "Review session not found.",
      });
    }

    return res.status(200).json({
      reviewSession,
    });

  } catch (error) {
    console.error("Get review session error:", error);

    return res.status(500).json({
      message: "Unable to retrieve review session.",
    });
  }
});

export default router;