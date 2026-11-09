import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import dns from "dns/promises"

import authRoutes from "./routes/auth.js";
import handoffRoutes from "./routes/handoff.js";

dotenv.config();

dns.setServers(['1.1.1.1']); 

const app = express();


// Middleware
app.use(
  cors({
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
    ],
  })
);

app.use(express.json());


// API Routes
app.use("/api/auth", authRoutes);

app.use("/api/handoff", handoffRoutes);


// Health check
app.get("/", (req, res) => {
  res.json({
    message: "VerifySaaS API is running.",
  });
});


// Connect to MongoDB and start server
const PORT = process.env.PORT || 5002;

const startServer = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("VerifySaaS MongoDB connected successfully.");

    app.listen(PORT, () => {
      console.log(`VerifySaaS server running on port ${PORT}`);
    });

  } catch (error) {
    console.error("Server startup error:", error);

    process.exit(1);
  }
};

startServer();