import cors from "cors";

export const corsMiddleware = cors({
  origin: process.env.ShareA_Frontend_URL || "http://localhost:5173",
  methods: ["GET", "POST", "OPTIONS"],
  credentials: true,
  allowedHeaders: ["Content-Type", "Authorization"],
});
