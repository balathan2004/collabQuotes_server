import { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";

import {
  AuthResponseConfig,
  ResponseConfig,
  UserDataInterface,
} from "../utils/interfaces";
import jwt from "jsonwebtoken";

import { generateUsername } from "unique-username-generator";
import { AvatarGenerator } from "random-avatar-generator";
import supabaseAdmin from "../utils/supabase_admin";
const generator = new AvatarGenerator();
const AuthRoutes = Router();

interface Props {
  email: string;
  password: string;
}

const JWT_TOKEN = process.env.JWT_SECRET || "";

function generateAccessToken(user: UserDataInterface) {
  return jwt.sign(user, JWT_TOKEN, { expiresIn: "60M" });
}

// Generate Refresh Token
function generateRefreshToken(user: UserDataInterface) {
  return jwt.sign(user, JWT_TOKEN, { expiresIn: "15D" });
}

AuthRoutes.post(
  "/login",
  async (req: Request, res: Response<AuthResponseConfig>) => {
    const { email, password }: Props = req.body;
    console.log("email: ", email);

    if (!email || !password) {
      res.status(400).json({
        status: 300,
        message: "Invalid Authentication",
        credentials: null,
        accessToken: "",
      });
      return;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      res.status(400).json({
        status: 200,
        message: error.message,
        credentials: null,
        accessToken: "",
      });
      return;
    }

    if (!data || !data.user) {
      res.status(400).json({
        status: 200,
        message: "user not found",
        credentials: null,
        accessToken: "",
      });
      return;
    }

    const userData =
      ((
        await supabase
          .from("users")
          .select("*")
          .eq("email", email)
          .maybeSingle()
      ).data as UserDataInterface) || null;

    if (!userData) {
      res.json({
        status: 300,
        message: "Invalid Authentication",
        credentials: null,
        accessToken: "",
      });
      return;
    }

    const accessToken = generateAccessToken(userData);
    const refreshToken = generateRefreshToken(userData);

    res.cookie("collabQuotes_refreshToken", refreshToken, {
      maxAge: 2592000000,
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });
    res.json({
      status: 200,
      message: "Logged In",
      credentials: { ...userData },
      accessToken: accessToken,
    });
  }
);

AuthRoutes.post(
  "/register",
  async (req: Request, res: Response<ResponseConfig>) => {
    const { email, password }: Props = req.body;

    const { data: userList, error: listError } =
      await supabaseAdmin.auth.admin.listUsers();

    if (listError) {
      console.error("Error fetching users:", listError);
      res.status(500).json({ status: 300, message: "Failed to fetch users." });
      return;
    }

    // Check if the user with the provided email exists
    const existingUser = userList?.users.find((user) => user.email === email);

    if (existingUser) {
      res.json({
        status: 300,
        message: "Email already exists, login with password",
      });
      return;
    }

    let response = await supabase.auth.signUp({
      email: email,
      password: password,
      options: {
        emailRedirectTo: `https://collab-quotes.vercel.app/auth/verify?email=${email}`,
      },
    });
    const { data, error } = response;

    if (error) {
      console.log(error);
      res.json({ status: 300, message: error.message });
      return;
    }

    const userData: UserDataInterface = {
      username: generateUsername("-", 4, 20, "user"),
      userId: data.user?.id || "",
      profile_url: generator.generateRandomAvatar(),
      email: email || "",
      createdAt: new Date().getTime(),
    };

    const { error: insertError } = await supabase
      .from("users")
      .insert(userData);

    console.log(insertError);

    res.json({
      status: 200,
      message: "verification code sent to email, verify email and login",
    });
  }
);

AuthRoutes.post(
  "/reset-password",
  async (req: Request, res: Response<ResponseConfig>) => {
    const { email }: Props = req.body;

    let response = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://collab-quotes.vercel.app/auth/change-password?email=${email}`,
    });
    const { error } = response;

    if (error) {
      console.log(error);
      res.json({ status: 300, message: error.message });
      return;
    }

    res.json({
      status: 200,
      message: "Password Reset Mail sent to inbox",
    });
  }
);

AuthRoutes.post(
  "/change-password",
  async (req: Request, res: Response<ResponseConfig>) => {
    const { accessToken, password }: { accessToken: string; password: string } =
      req.body;

    // Log incoming data for debugging
    console.log("Request Body:", req.body);

    // Validate input
    if (!accessToken || !password) {
      res.status(400).json({
        status: 400,
        message: "Access token and password are required.",
      });
      return;
    }

    // Retrieve the user using the access token
    const { data: userData, error: getUserError } = await supabase.auth.getUser(
      accessToken
    );

    if (getUserError) {
      console.error("Error fetching user:", getUserError);
      res
        .status(401)
        .json({ status: 300, message: "Invalid or expired access token." });
      return;
    }

    if (!userData?.user) {
      res.status(404).json({ status: 300, message: "User not found." });
      return;
    }

    const userId = userData.user.id;

    // Update the user's password using the Admin SDK
    const { data: updateData, error: updateError } =
      await supabaseAdmin.auth.admin.updateUserById(userId, { password });

    if (updateError) {
      console.error("Error updating password:", updateError);
      res
        .status(500)
        .json({ status: 300, message: "Failed to update password." });
      return;
    }

    console.log("Password updated successfully for user:", updateData);

    res.status(200).json({
      status: 200,
      message: "Password successfully updated.",
    });
  }
);

AuthRoutes.get(
  "/refresh",
  async (req: Request, res: Response<AuthResponseConfig>) => {
    const refreshToken = req.cookies?.collabQuotes_refreshToken;
    // console.log("refreshToken: ", refreshToken);

    if (!refreshToken) {
      console.log("token not found");

      res.status(401).json({
        message: "unauthorized",
        credentials: null,
        status: 300,
        accessToken: "",
      });
      return;
    }

    jwt.verify(refreshToken, JWT_TOKEN, (err: any, user: any) => {
      if (err) {
        console.log("err: ", err);

        return res.sendStatus(403);
      }

      const newAccessToken = jwt.sign({ user }, JWT_TOKEN, {
        expiresIn: "15m",
      });
      res.json({
        accessToken: newAccessToken,
        credentials: user,
        status: 200,
        message: "success",
      });
    });
  }
);

AuthRoutes.get(
  "/logout",
  async (req: Request, res: Response<ResponseConfig>) => {
    const token = req.cookies.collabQuotes_refreshToken;

    console.log("logout reached");

    res.clearCookie("collabQuotes_refreshToken", {
      httpOnly: true,
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      secure: process.env.NODE_ENV === "production",
    });

    res.json({ status: 200, message: "Logged out" });
  }
);

// AuthRoutes.get(
//   "/verify_account/:id",
//   async (req: Request, res: Response<ResponseConfig>) => {
//     const email = req.params.id;

//     if (!email) {
//       res.json({ status: 400, message: "Invalid ID" });
//       return;
//     }

//     console.log(`verification for ${email}`);

//     const response = (
//       await supabase.from("pending_verification").select("*").eq("email", email)
//     ).data as { email: string; userId: string }[];
//     const responseAdmin = (
//       await supabaseAdmin.auth.admin.getUserById(response[0].userId)
//     ).data;
//     if (!response[0]?.email && !responseAdmin.user) {
//       res.json({ status: 400, message: "User not found" });
//       return;
//     }

//     const userData: UserDataInterface = {
//       username: generateUsername("-", 4, 20, "user"),
//       userId: responseAdmin.user?.id || "",
//       profile_url: generator.generateRandomAvatar(),
//       email: responseAdmin.user?.email || "",
//       createdAt: new Date().getTime(),
//     };

//     const { error: insertError } = await supabase
//       .from("users")
//       .insert(userData);

//     console.log(insertError);

//     if (insertError) {
//       res.status(500).json({ status: 300, message: "Error creating account" });
//       return;
//     }

//     res.json({
//       status: 200,
//       message: "Account Verified Successfully",
//     });
//   }
// );

export default AuthRoutes;
