import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import dotenv from 'dotenv';
import dns from 'dns/promises';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import sharp from 'sharp';

dotenv.config();

dns.setServers(['1.1.1.1', '1.0.0.1']);

const app = express();

app.use(cors({ origin: 'http://localhost:5173' }));
app.use(express.json({ limit: '25mb' }));

const JWT_SECRET = process.env.JWT_SECRET;

if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is missing from your .env file.');
}

// ---------------- DATABASE CONNECTION ----------------

mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('Database connection error:', err));

// ---------------- DATABASE SCHEMAS ----------------

// Each buyer has one permanent account.
const User = mongoose.model('User', new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true
  },
  passwordHash: {
    type: String,
    required: true
  },
  buyerId: {
    type: String,
    required: true,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
}));

// Generates sequential buyer identifiers.
const Counter = mongoose.model('Counter', new mongoose.Schema({
  _id: String,
  seq: {
    type: Number,
    default: 0
  }
}));

// Stores every verification submission.
// Order IDs must be unique.
// Product references are deliberately NOT unique.
const Submission = mongoose.model('Submission', new mongoose.Schema({
  orderId: {
    type: String,
    required: true,
    unique: true
  },
  vendorId: {
    type: String,
    required: true
  },
  productRef: {
    type: String,
    required: true
  },
  buyerId: {
    type: String,
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  confidenceScore: Number,
  status: String,
  createdAt: {
    type: Date,
    default: Date.now
  }
}));

// ---------------- AUTHENTICATION ----------------

function createToken(user) {
  return jwt.sign(
    {
      userId: user._id,
      buyerId: user.buyerId
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
}

async function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        message: 'Please log in to continue.'
      });
    }

    const token = authHeader.split(' ')[1];

    const decoded = jwt.verify(token, JWT_SECRET);

    const user = await User.findById(decoded.userId)
      .select('_id email buyerId');

    if (!user) {
      return res.status(401).json({
        message: 'Account not found. Please log in again.'
      });
    }

    req.user = user;

    next();

  } catch (error) {
    return res.status(401).json({
      message: 'Your session has expired. Please log in again.'
    });
  }
}

// ---------------- REGISTER ----------------

app.post('/api/auth/register', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    if (!email || !password) {
      return res.status(400).json({
        message: 'Email and password are required.'
      });
    }

    if (password.length < 8) {
      return res.status(400).json({
        message: 'Your password must contain at least 8 characters.'
      });
    }

    const existingUser = await User.findOne({ email });

    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email already exists. Please log in.'
      });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const counter = await Counter.findOneAndUpdate(
      { _id: 'buyer' },
      { $inc: { seq: 1 } },
      { new: true, upsert: true }
    );

    const buyerId = `BYR-${String(counter.seq).padStart(6, '0')}`;

    const user = await User.create({
      email,
      passwordHash,
      buyerId
    });

    const token = createToken(user);

    res.status(201).json({
      message: 'Account created successfully.',
      token,
      user: {
        email: user.email,
        buyerId: user.buyerId
      }
    });

  } catch (error) {
    console.error(error);

    res.status(500).json({
      message: 'Unable to create your account.'
    });
  }
});

// ---------------- LOGIN ----------------

app.post('/api/auth/login', async (req, res) => {
  try {
    const email = req.body.email?.trim().toLowerCase();
    const password = req.body.password;

    const user = await User.findOne({ email });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const passwordMatches = await bcrypt.compare(
      password,
      user.passwordHash
    );

    if (!passwordMatches) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const token = createToken(user);

    res.json({
      message: 'Login successful.',
      token,
      user: {
        email: user.email,
        buyerId: user.buyerId
      }
    });

  } catch (error) {
    res.status(500).json({
      message: 'Unable to log in.'
    });
  }
});

// ---------------- RESTORE EXISTING SESSION ----------------

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({
    user: {
      email: req.user.email,
      buyerId: req.user.buyerId
    }
  });
});

// ---------------- IMAGE COMPARISON ----------------

async function compareImages(listingImage, deliveryImage) {

  function decodeImage(dataUrl) {
    if (
      typeof dataUrl !== 'string' ||
      !dataUrl.startsWith('data:image/')
    ) {
      throw new Error('Invalid image format.');
    }

    const base64 = dataUrl.split(',')[1];

    if (!base64) {
      throw new Error('Image data is missing.');
    }

    return Buffer.from(base64, 'base64');
  }

  const listingBuffer = decodeImage(listingImage);
  const deliveryBuffer = decodeImage(deliveryImage);

  const listingPixels = await sharp(listingBuffer)
    .resize(96, 96, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer();

  const deliveryPixels = await sharp(deliveryBuffer)
    .resize(96, 96, { fit: 'fill' })
    .greyscale()
    .raw()
    .toBuffer();

  let totalDifference = 0;

  for (let i = 0; i < listingPixels.length; i++) {
    totalDifference += Math.abs(
      listingPixels[i] - deliveryPixels[i]
    );
  }

  const averageDifference =
    totalDifference / listingPixels.length;

  const similarity = 100 - (averageDifference / 255) * 100;

  return Math.round(similarity);
}

// ---------------- VENDOR TRUST SCORE ----------------

async function calculateVendorMetrics(vendorId) {

  const results = await Submission.aggregate([
    { $match: { vendorId } },
    {
      $group: {
        _id: null,
        totalInspections: { $sum: 1 },
        mismatchCount: {
          $sum: {
            $cond: [
              { $eq: ['$status', 'MISMATCH'] },
              1,
              0
            ]
          }
        }
      }
    }
  ]);

  if (!results.length) {
    return {
      vendorId,
      totalInspections: 0,
      mismatchCount: 0,
      trustScore: 0
    };
  }

  const totalInspections = results[0].totalInspections;
  const mismatchCount = results[0].mismatchCount;

  const successfulMatches = totalInspections - mismatchCount;

  const trustScore = Math.round(
    (successfulMatches / totalInspections) * 100
  );

  return {
    vendorId,
    totalInspections,
    mismatchCount,
    trustScore
  };
}

// ---------------- VERIFY SUBMISSION ----------------

app.post('/api/verify', authenticate, async (req, res) => {

  try {

    const {
      vendorNumber,
      orderNumber,
      productRef,
      listingImg,
      deliveryImg
    } = req.body;

    // Validate numeric identifiers.

    if (!/^\d+$/.test(vendorNumber || '')) {
      return res.status(400).json({
        message: 'Vendor identifier must contain numbers only.'
      });
    }

    if (!/^\d+$/.test(orderNumber || '')) {
      return res.status(400).json({
        message: 'Order reference must contain numbers only.'
      });
    }

    if (!productRef?.trim()) {
      return res.status(400).json({
        message: 'Product reference is required.'
      });
    }

    if (!listingImg || !deliveryImg) {
      return res.status(400).json({
        message: 'Both images are required.'
      });
    }

    const vendorId = `VNDR-${vendorNumber}`;
    const orderId = `ORD-${orderNumber}`;

    // Check whether this order has already been submitted.

    const existingOrder = await Submission.findOne({ orderId });

    if (existingOrder) {
      return res.status(409).json({
        message: 'This order reference has already been submitted.'
      });
    }

    // Perform actual image comparison.

    const similarityScore = await compareImages(
      listingImg,
      deliveryImg
    );

    const status = similarityScore >= 70
      ? 'MATCH'
      : 'MISMATCH';

    // Save the submission using the authenticated buyer's identity.

    const submission = await Submission.create({
      orderId,
      vendorId,
      productRef: productRef.trim(),
      buyerId: req.user.buyerId,
      userId: req.user._id,
      confidenceScore: similarityScore,
      status
    });

    // Calculate trust using submissions from ALL buyers.

    const vendorMetrics = await calculateVendorMetrics(vendorId);

    res.status(201).json({
      success: true,
      submission,
      vendorMetrics
    });

  } catch (error) {

    // Handles simultaneous attempts to submit the same order.

    if (error.code === 11000) {
      return res.status(409).json({
        message: 'This order reference has already been submitted.'
      });
    }

    console.error(error);

    res.status(500).json({
      message: error.message || 'Verification failed.'
    });
  }
});

// ---------------- GET VENDOR METRICS ----------------

app.get('/api/vendor/:vendorNumber', authenticate, async (req, res) => {

  try {

    if (!/^\d+$/.test(req.params.vendorNumber)) {
      return res.status(400).json({
        message: 'Invalid vendor identifier.'
      });
    }

    const vendorId = `VNDR-${req.params.vendorNumber}`;

    const metrics = await calculateVendorMetrics(vendorId);

    res.json(metrics);

  } catch (error) {

    res.status(500).json({
      message: 'Unable to retrieve vendor metrics.'
    });

  }
});

// ---------------- START SERVER ----------------

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`VerifySaaS API running on port ${PORT}`);
});