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
  "/get_profile/:id",
  async (req: Request, res: Response<ProfileResponseCofig>) => {
    if (req.params && req.params.id) {
      const id = req.params.id;

      const userData = (
        await supabase.from("users").select("*").eq("userId", id)
      ).data;
      const checked = userData ? (userData[0] as UserDataInterface) : null;

      const userPosts = (
        await supabase.from("posts").select("*", {}).eq("userId", id)
      ).data as QuoteInterface[];



      if (checked) {
        res.json({
          status: 200,
          message: "fetched",
          userData: checked,
          userPosts: userPosts,
        });
      } else {
        res.json({
          message: "dijej",
          status: 300,
          userData: null,
          userPosts: [],
        });
      }
    }
  }
);

ProfileRoutes.get(
  "/my_profile",
  async (req: Request, res: Response<ProfileResponseCofig>) => {
    const collabQuotes_uid: string = req.cookies?.collabQuotes_uid || "";

    // console.log({req})

    const authHeader = req.headers.authorization || "";

  const token = authHeader.split(" ")[1];
  console.log('token: ', token);


    if (collabQuotes_uid) {
      const id = collabQuotes_uid;

      const userData = (
        await supabase.from("users").select("*").eq("userId", id)
      ).data;
      const checked = userData ? (userData[0] as UserDataInterface) : null;

      const userPosts = (
        await supabase.from("posts").select("*", {}).eq("userId", id)
      ).data as QuoteInterface[];

      console.log(userData, userPosts);

      if (checked) {
        res.json({
          status: 200,
          message: "fetched",
          userData: checked,
          userPosts: userPosts,
        });
      } else {
        res.json({
          message: "dijej",
          status: 300,
          userData: null,
          userPosts: [],
        });
      }
    }
  }
);





export default ProfileRoutes;
