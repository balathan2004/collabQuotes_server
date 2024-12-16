import { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";

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

    console.log("requested", email);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: email,
      password: password,
    });

    if (data && data.user) {
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
    } else {
      console.log(error);

      res.json({
        status: 300,
        message: "Invalid Authentication",
        credentials: null,
      });
    }
  }
);

AuthRoutes.post(
  "/register",
  async (req: Request, res: Response<ResponseConfig>) => {
    const { email, password }: Props = req.body;

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
      message: "SignUp Success",
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

    console.log(`verification for ${email}`)

    const response = (await supabase.from("pending_verification").select("*"))
      .data as { email: string; userId: string }[];
    const responseAdmin =  (
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
