import express, { Request, Response, Router } from "express";
import cors from "cors";
import dotenv from "dotenv";
import AuthRoutes from "./routes/auth";
import PostRoutes from "./routes/posts";
import ProfileRoutes from "./routes/profile";
import cookieParser from "cookie-parser";
const app = express();

dotenv.config();
app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());
app.use("/auth", AuthRoutes);
app.use("/posts", PostRoutes);
app.use("/profile", ProfileRoutes);

app.listen(3000, () => {
  console.log("server listen on 3000");
});
