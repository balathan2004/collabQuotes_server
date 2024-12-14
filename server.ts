import express, { Request, Response } from "express";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import AdminRoutes from "./src/admin";
import PostRoutes from "./src/posts";
import AuthRoutes from "./src/auth";
import ProfileRoutes from "./src/profile";
dotenv.config();
const app = express();

app.use(cookieParser());
app.use(
  cors({
    origin: "http://localhost:5173",
    credentials: true,
  })
);

app.use(express.json());

app.use('/auth',AuthRoutes)
app.use("/admin",AdminRoutes)
app.use("/profile",ProfileRoutes)
app.use('/posts',PostRoutes)



app.get("/hello", async (req: Request, res: Response) => {
  res.cookie("testcollab_id", "leomessi", {
    maxAge: 2592000000,
    sameSite: "none",
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" ? true : false,
  });
  res.json({
    status: 200,
    message: "Logged In",
  });
});




app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
