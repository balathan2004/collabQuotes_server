import { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";

import {
  QuoteInterface,
  ProfileResponseCofig,
  UserDataInterface,
} from "../utils/interfaces";

// Create a router instance
const ProfileRoutes = Router();

ProfileRoutes.get(
  "/my_profile",
  async (req: Request, res: Response<ProfileResponseCofig>) => {
    console.log(req.jwt.user);

    const uid = req.jwt?.user?.userId || null;

    if (!uid) {
      res.status(401).json({
        message: "error caught",
        status: 300,
        userData: null,
        userPosts: [],
      });
      return;
    }

    const userPosts = (
      await supabase.from("posts").select("*", {}).eq("userId", uid)
    ).data as QuoteInterface[];

    res.json({
      status: 200,
      message: "fetched",
      userData: req.jwt.user as any,
      userPosts: userPosts,
    });
  }
);

export default ProfileRoutes;
