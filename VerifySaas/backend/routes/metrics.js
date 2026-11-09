import express from "express";
import crypto from "node:crypto";

import ReviewSession from "../models/ReviewSession.js";
import User from "../models/User.js";
import authMiddleware from "../middleware/auth.js";

const router = express.Router();

router.use(authMiddleware);

// ==========================================
// REWARD MILESTONES
// ==========================================

const rewardMilestones = [
  {
    milestone: 3,
    discountPercent: 5,
    title: "First Steps",
    description: "Complete 3 product reviews.",
  },
  {
    milestone: 5,
    discountPercent: 10,
    title: "Trusted Contributor",
    description: "Complete 5 product reviews.",
  },
  {
    milestone: 10,
    discountPercent: 15,
    title: "Verification Champion",
    description: "Complete 10 product reviews.",
  },
];

// ==========================================
// COMPARISON SCORE
// ==========================================

const getComparisonScore = (tier) => {
  const scores = {
    very_low: 1,
    somewhat_similar: 2,
    almost_identical: 3,
  };

  return scores[tier] || 0;
};


// ==========================================
// GET ALL METRICS
// ==========================================

router.get("/overview", async (req, res) => {
  try {
    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    const completedReviews = await ReviewSession.find({
      status: "completed",
    }).lean();

    // ======================================
    // PRODUCT METRICS
    // Group similar products across vendors.
    // ======================================

    const productGroups = {};

    completedReviews.forEach((review) => {
      const normalizedName = review.productName
        .trim()
        .toLowerCase();

      const normalizedCategory = (review.category || "")
        .trim()
        .toLowerCase();

      const key = `${normalizedName}_${normalizedCategory}`;

      if (!productGroups[key]) {
        productGroups[key] = {
          productName: review.productName,
          category: review.category,
          listingImage: review.listingImage,
          totalReviews: 0,
          totalScore: 0,
          vendors: [],
        };
      }

      const product = productGroups[key];

      product.totalReviews += 1;

      product.totalScore += getComparisonScore(
        review.reviewResult?.tier
      );

      if (!product.vendors.includes(review.vendorName)) {
        product.vendors.push(review.vendorName);
      }
    });

    const products = Object.values(productGroups)
      .map((product) => ({
        ...product,

        averageScore: Number(
          (product.totalScore / product.totalReviews).toFixed(2)
        ),

        totalScore: undefined,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((product, index) => ({
        ...product,
        rank: index + 1,
      }));


    // ======================================
    // VENDOR METRICS
    // ======================================

    const vendorGroups = {};

    completedReviews.forEach((review) => {
      const key = review.vendorId;

      if (!vendorGroups[key]) {
        vendorGroups[key] = {
          vendorId: review.vendorId,
          vendorName: review.vendorName,
          totalReviews: 0,
          totalScore: 0,
          products: [],
        };
      }

      const vendor = vendorGroups[key];

      vendor.totalReviews += 1;

      vendor.totalScore += getComparisonScore(
        review.reviewResult?.tier
      );

      if (!vendor.products.includes(review.sourceProductId)) {
        vendor.products.push(review.sourceProductId);
      }
    });

    const vendors = Object.values(vendorGroups)
      .map((vendor) => ({
        ...vendor,

        totalProducts: vendor.products.length,

        averageScore: Number(
          (vendor.totalScore / vendor.totalReviews).toFixed(2)
        ),

        products: undefined,
        totalScore: undefined,
      }))
      .sort((a, b) => b.averageScore - a.averageScore)
      .map((vendor, index) => ({
        ...vendor,
        rank: index + 1,
      }));


    // ======================================
    // USER CONTRIBUTION METRICS
    // ======================================

    const myReviews = completedReviews.filter(
      (review) => String(review.userId) === String(req.userId)
    );

    const totalReviews = myReviews.length;

    const contributionPoints = totalReviews * 10;

    const averageScore = totalReviews
      ? Number(
          (
            myReviews.reduce(
              (total, review) =>
                total + getComparisonScore(review.reviewResult?.tier),
              0
            ) / totalReviews
          ).toFixed(2)
        )
      : 0;


    // ======================================
    // REWARD STATUS
    // ======================================

    const claimedRewards = user.claimedRewards || [];

    const rewards = rewardMilestones.map((reward) => {
      const claimedReward = claimedRewards.find(
        (claimed) => claimed.milestone === reward.milestone
      );

      return {
        ...reward,

        unlocked: totalReviews >= reward.milestone,

        claimed: Boolean(claimedReward),

        couponCode: claimedReward?.couponCode || null,

        claimedAt: claimedReward?.claimedAt || null,
      };
    });


    return res.status(200).json({
      products,
      vendors,

      contributions: {
        totalReviews,
        contributionPoints,
        averageScore,
        reviews: myReviews.map((review) => ({
          id: review._id,
          productName: review.productName,
          vendorName: review.vendorName,
          tier: review.reviewResult?.tier,
          comparedAt: review.reviewResult?.comparedAt,
        })),
      },

      rewards,
    });

  } catch (error) {
    console.error("Metrics retrieval error:", error);

    return res.status(500).json({
      message: "Unable to retrieve platform metrics.",
    });
  }
});


// ==========================================
// CLAIM A REWARD
// ==========================================

router.post("/rewards/:milestone/claim", async (req, res) => {
  try {
    const milestone = Number(req.params.milestone);

    const reward = rewardMilestones.find(
      (item) => item.milestone === milestone
    );

    if (!reward) {
      return res.status(404).json({
        message: "Reward milestone not found.",
      });
    }

    const user = await User.findById(req.userId);

    if (!user) {
      return res.status(404).json({
        message: "User account not found.",
      });
    }

    // Prevent claiming the same reward twice.
    const alreadyClaimed = user.claimedRewards.some(
      (item) => item.milestone === milestone
    );

    if (alreadyClaimed) {
      return res.status(409).json({
        message: "You have already claimed this reward.",
      });
    }

    // Check the user's completed reviews.
    const totalReviews = await ReviewSession.countDocuments({
      userId: req.userId,
      status: "completed",
    });

    if (totalReviews < milestone) {
      return res.status(403).json({
        message: "You have not reached this reward milestone yet.",
      });
    }

    // Generate a demonstration coupon.
    const couponCode =
      `VERIFY-${milestone}-${crypto.randomBytes(4).toString("hex").toUpperCase()}`;

    user.claimedRewards.push({
      milestone,
      couponCode,
      discountPercent: reward.discountPercent,
      claimedAt: new Date(),
    });

    await user.save();

    return res.status(200).json({
      message: "Your reward has been claimed successfully.",

      reward: {
        milestone,
        title: reward.title,
        discountPercent: reward.discountPercent,
        couponCode,
      },
    });

  } catch (error) {
    console.error("Reward claim error:", error);

    return res.status(500).json({
      message: "Unable to claim your reward.",
    });
  }
});

export default router;