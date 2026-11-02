import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns/promises';

dns.setServers(['1.1.1.1', '1.0.0.1']);

dotenv.config();
const app = express();

// Enable Cross-Origin Resource Sharing for your Vite Frontend Port (default: 5173)
app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '10mb' }));

// MongoDB Atlas Connection
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/crowdsource_qa";
mongoose.connect(mongoURI)
  .then(() => console.log("📦 Connected to MongoDB Atlas Cluster"))
  .catch(err => console.error("Database Connection Failure:", err));

// MongoDB Schemas
const Submission = mongoose.model('Submission', new mongoose.Schema({
  orderId: String,
  vendorId: String,
  buyerId: String,
  confidenceScore: Number,
  status: String, 
  createdAt: { type: Date, default: Date.now }
}));

const VendorMetric = mongoose.model('VendorMetric', new mongoose.Schema({
  vendorId: String,
  totalInspections: { type: Number, default: 0 },
  mismatchCount: { type: Number, default: 0 },
  trustScore: { type: Number, default: 100 }
}));

// API Routes
app.post('/api/verify', async (req, res) => {
  try {
    const { orderId, vendorId, buyerId, similarityScore } = req.body;
    
    // Core structural check logic based on SaaS architecture requirements
    const status = similarityScore >= 70 ? 'MATCH' : 'MISMATCH';

    const submission = new Submission({ orderId, vendorId, buyerId, confidenceScore: similarityScore, status });
    await submission.save();

    let vendor = await VendorMetric.findOne({ vendorId });
    if (!vendor) vendor = new VendorMetric({ vendorId });

    vendor.totalInspections += 1;
    if (status === 'MISMATCH') vendor.mismatchCount += 1;
    vendor.trustScore = Math.round(((vendor.totalInspections - vendor.mismatchCount) / vendor.totalInspections) * 100);
    await vendor.save();

    res.status(201).json({ success: true, submission, vendorMetrics: vendor });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/vendor/:vendorId', async (req, res) => {
  try {
    const vendor = await VendorMetric.findOne({ vendorId: req.params.vendorId });
    if (!vendor) return res.status(404).json({ message: "Vendor profile initialization pending." });
    res.json(vendor);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Dedicated QA-SaaS API spinning on port ${PORT}`));
