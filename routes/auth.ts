import express, { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";
import supabaseAdmin from "../utils/supabase_admin";
import {
  AuthResponseConfig,
  ResponseConfig,
  UserDataInterface,
} from "../utils/interfaces";
import { generateFromEmail, generateUsername } from "unique-username-generator";
import { AvatarGenerator } from "random-avatar-generator";

const generator = new AvatarGenerator();

// Simply get a random avatar

// Create a router instance
const app = Router();

interface Props {
  email: string;
  password: string;
}

app.post("/login", async (req: Request, res: Response<AuthResponseConfig>) => {
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
        secure: true,
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
});

app.post("/register", async (req: Request, res: Response<ResponseConfig>) => {
  const { email, password }: Props = req.body;

  let response = await supabase.auth.signUp({ email: email, password });
  if (response) {
    const { data, error } = response;
    if (data && data.user) {
      const username = generateUsername("-", 4, 20, "user");

      const userData: UserDataInterface = {
        username: username,
        userId: data.user.id,
        profile_url: generator.generateRandomAvatar(),
        email: email,
        createdAt: new Date().getTime(),
      };

      const responseData = (await supabase.from("users").insert(userData)).data;

      if (responseData) {
        res.json({
          status: 200,
          message: "Account Created",
        });
      }
    } else {
    }
  } else {
    res.json({
      status: 300,
      message: "Try again later",
    });
  }
});

app.get(
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

export default app;
