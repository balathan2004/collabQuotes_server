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

const allowedOrigins = ["http://localhost:5173", "https://collab-quotes.vercel.app"];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);


app.use(cookieParser());
// app.use(
//   cors({
//     origin: function (origin, callback) {
//       if (!origin || allowedOrigins.includes(origin)) {
//         callback(null, true);
//       } else {
//         callback(new Error("Not allowed by CORS"));
//       }
//     },
//     credentials: true,
//   })
// );




app.use(express.json());

app.use("/auth", AuthRoutes);
app.use("/admin", AdminRoutes);
app.use("/profile", ProfileRoutes);
app.use("/posts", PostRoutes);

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


const PORT = process.env.PORT || 3000

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}`);
});
