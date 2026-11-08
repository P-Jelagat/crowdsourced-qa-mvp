import express from 'express';
import jwt from 'jsonwebtoken';
import Order from '../models/Order.js';

const router = express.Router();

// Active Session Gate Middleware
const authGuard = (req, res, next) => {
  const token = req.header('Authorization')?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ message: "Access denied. Sign-in session required." });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'pottery_secret_key');
    req.userId = decoded.id;
    next();
  } catch (err) {
    res.status(401).json({ message: "Session expired. Please log in again." });
  }
};

// ACQUIRE HISTORY
router.get('/', authGuard, async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.userId }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST RECEIPT SNAPSHOT
router.post('/', authGuard, async (req, res) => {
  try {
    const { items, total } = req.body;
    
    const newOrder = new Order({
      userId: req.userId,
      orderId: `DM-${Math.floor(100000 + Math.random() * 900000)}`,
      date: new Date().toLocaleDateString("en-KE"),
      items: items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        pricePaid: item.price
      })),
      subtotal: total
    });

    await newOrder.save();
    res.status(201).json(newOrder);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
