import mongoose from "mongoose";

const OrderItemSchema = new mongoose.Schema(
  {
    productId: {
      type: String,
      default: "",
    },

    vendorId: {
      type: String,
      default: "",
    },

    vendorName: {
      type: String,
      default: "",
    },

    name: {
      type: String,
      required: true,
    },

    category: {
      type: String,
      default: "",
    },

    image: {
      type: String,
      default: "",
    },

    quantity: {
      type: Number,
      required: true,
    },

    pricePaid: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
);

const OrderSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    orderId: {
      type: String,
      required: true,
      unique: true,
    },

    date: {
      type: String,
      required: true,
    },

    items: [OrderItemSchema],

    subtotal: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.model("Order", OrderSchema);