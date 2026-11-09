import mongoose from "mongoose";

const ReviewSessionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    source: {
      type: String,
      default: "demomart",
    },

    sourceOrderId: {
      type: String,
      required: true,
    },

    sourceProductId: {
      type: String,
      required: true,
    },

    demomartCustomerId: {
      type: String,
      required: true,
    },

    vendorId: {
      type: String,
      required: true,
    },

    vendorName: {
      type: String,
      required: true,
    },

    productName: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "",
    },

    listingImage: {
      type: String,
      required: true,
    },

    quantity: {
      type: Number,
      default: 1,
    },

    handoffTokenHash: {
      type: String,
      required: true,
      unique: true,
    },

    status: {
      type: String,
      enum: ["pending", "completed"],
      default: "pending",
    },
  },
  {
    timestamps: true,
  }
);

// One review session per purchased product in an order.
ReviewSessionSchema.index(
  {
    sourceOrderId: 1,
    sourceProductId: 1,
  },
  {
    unique: true,
  }
);

const ReviewSession = mongoose.model(
  "ReviewSession",
  ReviewSessionSchema
);

export default ReviewSession;