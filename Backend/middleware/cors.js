import cors from "cors";

export const corsMiddleware = cors({
  origin: process.env.ShareA_Frontend_URL || "http://localhost:5173",
  methods: ["GET", "POST"],
  credentials: true,
});
