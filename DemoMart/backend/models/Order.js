const mongoose = require('mongoose');

const OrderItemSchema = new mongoose.Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true },
  pricePaid: { type: Number, required: true } // Static snapshot of price at checkout time
}, { _id: false });

const OrderSchema = new mongoose.Schema({
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  orderId: { 
    type: String, 
    required: true, 
    unique: true // Transparent audit tracking format (e.g., DM-394821)
  },
  date: { 
    type: String, 
    required: true 
  },
  items: [OrderItemSchema],
  subtotal: { 
    type: Number, 
    required: true 
  }
}, { 
  timestamps: true // Tracks exactly when the purchase was executed
});

module.exports = mongoose.model('Order', OrderSchema);
