const mongoose = require('mongoose');

const CartItemSchema = new mongoose.Schema({
  productId: { 
    type: String, // Maps to your front-end product ID string (e.g., "V001-P1")
    required: true 
  },
  name: { type: String, required: true },
  vendorName: { type: String, required: true },
  price: { type: Number, required: true },
  image: { type: String },
  quantity: { 
    type: Number, 
    required: true, 
    min: [1, 'Quantity cannot be less than 1.'],
    default: 1 
  }
}, { _id: false }); // Prevents nested IDs from cluttering your document items

const CartSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true,
    unique: true // Ensures every user has exactly one active cart session
  },
  items: [CartItemSchema]
}, { 
  timestamps: true 
});

module.exports = mongoose.model('Cart', CartSchema);
