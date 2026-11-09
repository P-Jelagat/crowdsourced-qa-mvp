import mongoose from "mongoose";

const ClaimedRewardSchema = new mongoose.Schema(
  {
    milestone: {
      type: Number,
      required: true,
    },

    couponCode: {
      type: String,
      required: true,
    },

    discountPercent: {
      type: Number,
      required: true,
    },

    claimedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    _id: false,
  }
);

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      required: true,
    },

    claimedRewards: {
      type: [ClaimedRewardSchema],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

const User = mongoose.model("User", UserSchema);

export default User;