import express from "express";
import jwt from "jsonwebtoken";
import crypto from "node:crypto";
import multer from "multer";
import { GoogleGenAI } from "@google/genai";

import ReviewSession from "../models/ReviewSession.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

// ==========================================
// IMAGE UPLOAD CONFIGURATION
// ==========================================

const upload = multer({
  storage: multer.memoryStorage(),

  limits: {
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter: (req, file, callback) => {
    const allowedTypes = [
      "image/jpeg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.mimetype)) {
      return callback(
        new Error("Please upload a JPG, PNG, or WEBP image.")
      );
    }

    callback(null, true);
  },
});

// Handle customer image upload errors.
const handleCustomerImageUpload = (req, res, next) => {
  upload.single("customerImage")(req, res, (error) => {
    if (error) {
      const message =
        error.code === "LIMIT_FILE_SIZE"
          ? "Image must be smaller than 5MB."
          : error.message;

      return res.status(400).json({
        message,
      });
    }

    next();
  });
};


// ==========================================
// REDEEM DEMOMART HANDOFF TOKEN
// ==========================================

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

    // Validate token information.
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

    // Get the logged-in VerifySaaS user.
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "VerifySaaS account not found.",
      });
    }

    // Compare customer emails.
    const demomartEmail = payload.customerEmail
      .trim()
      .toLowerCase();

    const verifySaaSEmail = user.email
      .trim()
      .toLowerCase();

    if (demomartEmail !== verifySaaSEmail) {
      return res.status(403).json({
        message:
          "Your VerifySaaS account must use the same email address as your DemoMart account.",
      });
    }

    // Hash the handoff token.
    const handoffTokenHash = crypto
      .createHash("sha256")
      .update(handoffToken)
      .digest("hex");

    // Create review session.
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
        message:
          "This purchased product has already been registered for review.",
      });
    }

    return res.status(500).json({
      message: "Unable to verify this purchase.",
    });
  }
});


// ==========================================
// GET A REVIEW SESSION
// ==========================================

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


// ==========================================
// COMPARE CUSTOMER PHOTO WITH LISTING IMAGE
// ==========================================

router.post(
  "/:sessionId/compare",
  authMiddleware,
  handleCustomerImageUpload,
  async (req, res) => {
    try {

      // Check uploaded image.
      if (!req.file) {
        return res.status(400).json({
          message: "Please upload a product photograph.",
        });
      }

      // Check Gemini API configuration.
      if (!process.env.GEMINI_API_KEY) {
        return res.status(500).json({
          message:
            "AI comparison is not configured. Add GEMINI_API_KEY to the VerifySaaS backend .env file.",
        });
      }

      // Find the review session belonging to this user.
      const reviewSession = await ReviewSession.findOne({
        _id: req.params.sessionId,
        userId: req.userId,
      });

      if (!reviewSession) {
        return res.status(404).json({
          message: "Review session not found.",
        });
      }

      // Prevent duplicate submissions.
      if (reviewSession.status === "completed") {
        return res.status(409).json({
          message: "This purchased product has already been reviewed.",
          reviewResult: reviewSession.reviewResult,
        });
      }

      // Retrieve the original DemoMart listing image.
      const demomartBaseUrl =
        process.env.DEMOMART_BASE_URL ||
        "http://localhost:5173";

      const listingUrl = new URL(
        reviewSession.listingImage,
        demomartBaseUrl
      );

      const allowedOrigin = new URL(
        demomartBaseUrl
      ).origin;

      if (listingUrl.origin !== allowedOrigin) {
        return res.status(400).json({
          message:
            "The original listing image URL is not valid for comparison.",
        });
      }

      const listingResponse = await fetch(listingUrl);

      if (!listingResponse.ok) {
        return res.status(502).json({
          message:
            "VerifySaaS could not retrieve the original product image from DemoMart.",
        });
      }

      const listingMimeType = listingResponse.headers
        .get("content-type")
        ?.split(";")[0];

      const supportedImageTypes = [
        "image/jpeg",
        "image/png",
        "image/webp",
      ];

      if (!supportedImageTypes.includes(listingMimeType)) {
        return res.status(400).json({
          message:
            "The original listing image must be JPG, PNG, or WEBP.",
        });
      }

      const listingBuffer = Buffer.from(
        await listingResponse.arrayBuffer()
      );

      if (listingBuffer.length > 10 * 1024 * 1024) {
        return res.status(400).json({
          message:
            "The original listing image is too large to compare.",
        });
      }

      // Initialize Gemini.
      const ai = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
      });

      // Instructions for the AI.
      const prompt = `You are comparing two photographs for a customer product-review platform.

IMAGE 1 is the seller's original product listing photograph.
IMAGE 2 is the customer's photograph of the item they received.

Product: ${reviewSession.productName}
Category: ${reviewSession.category || "Not specified"}
Vendor: ${reviewSession.vendorName}

Compare only what is visibly shown: product type, overall shape, structure, colour, pattern, material appearance, and distinctive design details.

Allow for normal differences caused by camera angle, lighting, background, and photograph quality.

Do not claim to prove authenticity, material composition, product quality, or seller intent.

If the photos do not clearly show the same type of product, treat the match as very low.

Choose exactly one tier:

- "very_low": major visible differences or the item does not appear to match the listing.
- "somewhat_similar": some important features match, but there are noticeable design, colour, shape, or detail differences, or the photos do not provide enough clarity for a strong match.
- "almost_identical": the main visible design, shape, colours, patterns, and distinctive details appear highly consistent, allowing for photo conditions.

Return ONLY valid JSON with this exact structure:

{
  "tier": "very_low" | "somewhat_similar" | "almost_identical",
  "summary": "A short plain-language explanation of the comparison.",
  "differences": [
    "A visible difference or limitation",
    "Another visible difference"
  ]
}

Keep the summary concise.
Include up to three differences.
If no clear differences are visible, return an empty differences array.
Do not include markdown fences.`;

      // Send both images to Gemini.
      const aiResponse = await ai.models.generateContent({
        model: "gemini-3.5-flash-lite",

        contents: [
          {
            text: prompt,
          },

          {
            inlineData: {
              mimeType: listingMimeType,
              data: listingBuffer.toString("base64"),
            },
          },

          {
            inlineData: {
              mimeType: req.file.mimetype,
              data: req.file.buffer.toString("base64"),
            },
          },
        ],

        config: {
          responseMimeType: "application/json",
        },
      });

      // Parse Gemini's response.
      let result;

      try {
        result = JSON.parse(aiResponse.text);

      } catch (parseError) {
        console.error(
          "Gemini returned an unreadable response:",
          aiResponse.text
        );

        return res.status(502).json({
          message:
            "The AI comparison returned an unexpected response. Please try again.",
        });
      }

      // Validate the AI result.
      const allowedTiers = [
        "very_low",
        "somewhat_similar",
        "almost_identical",
      ];

      if (
        !allowedTiers.includes(result.tier) ||
        !result.summary
      ) {
        return res.status(502).json({
          message:
            "The AI comparison could not produce a valid result. Please try again.",
        });
      }

      // Prepare the result for MongoDB.
      const reviewResult = {
        tier: result.tier,

        summary: String(result.summary).slice(0, 700),

        differences: Array.isArray(result.differences)
          ? result.differences
              .slice(0, 3)
              .map((item) => String(item).slice(0, 250))
          : [],

        model: "gemini-3.5-flash-lite",

        comparedAt: new Date(),
      };

      // Only the first successful comparison can complete this session.
      const updatedSession = await ReviewSession.findOneAndUpdate(
        {
          _id: reviewSession._id,
          userId: req.userId,
          status: "pending",
        },

        {
          $set: {
            status: "completed",
            reviewResult,
          },
        },

        {
          returnDocument: "after",
        }
      );

if (!updatedSession) {
  return res.status(409).json({
    message: "This purchased product has already been reviewed.",
  });
}


// ==========================================
// NOTIFY DEMOMART THAT THE REVIEW IS COMPLETE
// ==========================================

try {
  const handoffSecret = process.env.VERIFYSAAS_HANDOFF_SECRET;

  const notificationToken = jwt.sign(
    {
      orderId: updatedSession.sourceOrderId,

      productId: updatedSession.sourceProductId,

      customerId: updatedSession.demomartCustomerId,
    },
    handoffSecret,
    {
      expiresIn: "2m",
      issuer: "verifysaas",
      audience: "demomart",
    }
  );

  const demomartApiUrl =
    process.env.DEMOMART_API_URL ||
    "http://localhost:5001";

  const notificationResponse = await fetch(
    `${demomartApiUrl}/api/orders/verify-review-completed`,
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        Authorization: `Bearer ${notificationToken}`,
      },

      body: JSON.stringify({
        orderId: updatedSession.sourceOrderId,
        productId: updatedSession.sourceProductId,
      }),
    }
  );

  if (!notificationResponse.ok) {
    const notificationError = await notificationResponse.text();

    console.error(
      "DemoMart review status notification failed:",
      notificationError
    );
  } else {
    console.log(
      "DemoMart successfully notified about completed review."
    );
  }

} catch (notificationError) {
  console.error(
    "Could not notify DemoMart about the completed review:",
    notificationError
  );
}


// Return the successful comparison result.
return res.status(200).json({
  message: "Product comparison completed.",

  reviewResult: updatedSession.reviewResult,
});

    } catch (error) {
      console.error("AI comparison error:", error);

      if (error.code === "LIMIT_FILE_SIZE") {
        return res.status(400).json({
          message: "Image must be smaller than 5MB.",
        });
      }

      if (error.message?.includes("Please upload")) {
        return res.status(400).json({
          message: error.message,
        });
      }

      return res.status(500).json({
        message:
          "The product comparison could not be completed. Please try again.",
      });
    }
  }
);

export default router;