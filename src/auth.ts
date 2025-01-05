import { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";
import { User } from "@supabase/supabase-js";

import {
  AuthResponseConfig,
  ResponseConfig,
  UserDataInterface,
} from "../utils/interfaces";
import { generateUsername } from "unique-username-generator";
import { AvatarGenerator } from "random-avatar-generator";
import supabaseAdmin from "../utils/supabase_admin";

const generator = new AvatarGenerator();

// Simply get a random avatar

// Create a router instance
const AuthRoutes = Router();

interface Props {
  email: string;
  password: string;
}

AuthRoutes.post(
  "/login",
  async (req: Request, res: Response<AuthResponseConfig>) => {
    const { email, password }: Props = req.body;

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (error) {
      res.json({
        status: 300,
        message: error.message,
        credentials: null,
      });
      return;
    }

    const userData = (
      await supabase.from("users").select("*").eq("email", email)
    ).data;
    const checked = userData ? (userData[0] as UserDataInterface) : null;

    if (checked) {
      res.cookie("collabQuotes_uid", checked.userId, {
        maxAge: 2592000000,
        sameSite: "none",
        httpOnly: true,
        secure: process.env.NODE_ENV === "production" ? true : false,
      });
      res.json({
        status: 200,
        message: "Logged In",
        credentials: checked,
      });
    }
  }
);

AuthRoutes.post(
  "/register",
  async (req: Request, res: Response<ResponseConfig>) => {
    const { email, password }: Props = req.body;

    const checkUserRecord = await supabaseAdmin.auth.admin.listUsers();

    if (checkUserRecord.error) {
      console.log(checkUserRecord.error.message);
      res.json({ status: 300, message: checkUserRecord.error.message });
      return;
    }

    const recordData = checkUserRecord.data.users.find(
      (user) => user.email == email
    );

    if (recordData) {
      if (recordData.email_confirmed_at) {
        console.log(recordData.email_confirmed_at);
        res.json({ status: 300, message: "You already have an account login" });
        return;
      } else {
        console.log(recordData);
        res.json({
          status: 200,
          message: "youre not verified yet , verify email and login",
        });
        return;
      }
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

    await supabase
      .from("pending_verification")
      .insert({ email: email, userId: data.user?.id });

    res.json({
      status: 200,
      message: "verification code sent to email, verify email and login",
    });
  }
);

AuthRoutes.post(
  "/request-verification",
  async (req: Request, res: Response<ResponseConfig>) => {
    const { email }: Props = req.body;

    if (!email) {
      res.json({ status: 300, message: "invalid email" });
      return;
    }

    const checkUserRecord = await supabaseAdmin.auth.admin.listUsers();

    if (checkUserRecord.error) {
      console.log(checkUserRecord.error.message);
      res.json({ status: 300, message: checkUserRecord.error.message });
      return;
    }

    const recordData = checkUserRecord.data.users.find(
      (user) => user.email == email
    );

    if (recordData?.email_confirmed_at) {
      res.json({ status: 200, message: "your email already verified" });
      return;
    }

    const response = await supabaseAdmin.auth.resend({
      type: "signup",
      email,
      options: {
        emailRedirectTo: `https://collab-quotes.vercel.app/auth/verify?email=${email}`,
      },
    });

    if (response.error) {
      console.log(response.error.message);
      res.json({ status: 300, message: response.error.message });
      return;
    }
    res.json({ status: 200, message: "verification email sent" });
  }
);

AuthRoutes.post(
  "/reset-password",
  async (req: Request, res: Response<ResponseConfig>) => {
    const { email }: Props = req.body;

    let response = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `https://collab-quotes.vercel.app/auth/change-password?email=${email}`,
    });
    const { data, error } = response;

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
  "/verify_account/:id",
  async (req: Request, res: Response<ResponseConfig>) => {
    const email = req.params.id;

    if (!email) {
      res.json({ status: 400, message: "Invalid ID" });
      return;
    }

    console.log(`verification for ${email}`);

    const response = (
      await supabase.from("pending_verification").select("*").eq("email", email)
    ).data as { email: string; userId: string }[];
    const responseAdmin = (
      await supabaseAdmin.auth.admin.getUserById(response[0].userId)
    ).data;
    if (!response[0]?.email && !responseAdmin.user) {
      res.json({ status: 400, message: "User not found" });
      return;
    }

    const userData: UserDataInterface = {
      username: generateUsername("-", 4, 20, "user"),
      userId: responseAdmin.user?.id || "",
      profile_url: generator.generateRandomAvatar(),
      email: responseAdmin.user?.email || "",
      createdAt: new Date().getTime(),
    };

    const { error: insertError } = await supabase
      .from("users")
      .insert(userData);

    console.log(insertError);

    if (insertError) {
      res.status(500).json({ status: 300, message: "Error creating account" });
      return;
    }

    res.json({
      status: 200,
      message: "Account Verified Successfully",
    });
  }
);

AuthRoutes.get(
  "/login_cred",
  async (req: Request, res: Response<AuthResponseConfig>) => {
    const collabQuotes_uid: string = req.cookies?.collabQuotes_uid || "";

    console.log("login cred req", collabQuotes_uid);

    if (collabQuotes_uid) {
      const userData = (
        await supabase.from("users").select("*").eq("userId", collabQuotes_uid)
      ).data;
      const checked = userData ? (userData[0] as UserDataInterface) : null;

      if (checked) {
        res.json({
          status: 200,
          message: "Logged In",
          credentials: checked,
        });
      } else {
        res.json({
          status: 300,
          message: "Invalid Authentication",
          credentials: null,
        });
      }
    } else {
      res.json({
        status: 300,
        message: "No Uid Found",
        credentials: null,
      });
    }
  }
);

export default AuthRoutes;
