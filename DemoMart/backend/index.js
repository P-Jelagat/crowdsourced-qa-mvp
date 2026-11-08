import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.js';
import orderRoutes from './routes/orders.js';
import dns from 'node:dns';

dotenv.config();

dns.setServers([
  '1.1.1.1',     // Cloudflare Primary
//   '8.8.8.8',     // Google Primary
//   '208.67.222.222' // OpenDNS Secondary
]);

const app = express();

app.use(cors());
app.use(express.json());

// Attach API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/orders', orderRoutes);

const PORT = process.env.PORT || 5000;

mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected securely to MongoDB Atlas Cluster.");
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
  })
  .catch(err => console.error("Database connection failure:", err));
