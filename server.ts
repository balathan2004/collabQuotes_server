import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import AdminRoutes from "./src/admin";
import PostRoutes from "./src/posts";
import AuthRoutes from "./src/auth";
import ProfileRoutes from "./src/profile";
import jwt from "jsonwebtoken";
dotenv.config();

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "https://collab-quotes.vercel.app",
  "http://localhost:8081",
];
app.use(cookieParser());
app.use(express.json());

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);





async function authenticateToken(req: Request, res: Response, next: any) {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.split(" ")[1];

  jwt.verify(token, process.env.JWT_SECRET || "", (err, user: any) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: "Auth Token Not found",
      });
    } else {
      next();
    }

    // userId and username from JWT payload
    return;
  });
}

app.use("/auth", AuthRoutes);
app.use("/admin", AdminRoutes);
app.use("/profile", ProfileRoutes);
app.use("/posts", PostRoutes);

app.get("/hello", async (req: Request, res: Response) => {
  res.json({
    status: 200,
    message: "youre requesting hello api route",
  });
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
