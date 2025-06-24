import cors from "cors";

export const corsMiddleware = cors({
  origin: process.env.FRONTEND_URL || "http://localhost:3000",
  credentials: true,
});
