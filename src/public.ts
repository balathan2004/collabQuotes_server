import { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";
import {
  PostResponseConfig,
  ProfileResponseCofig,
  QuotesInterfaceWithProfile,
  UserDataInterface,
} from "../utils/interfaces";
import { QuoteInterface } from "../utils/interfaces";
import ShortUniqueId from "short-unique-id";

const PublicRoutes = Router();

PublicRoutes.get(
  "/get_posts",
  async (req: Request, res: Response<PostResponseConfig>) => {
    console.log("Page requested");

    const page = parseInt(req.query.page as string) || 0;
    const limit = parseInt(req.query.limit as string) || 10;
    const startIndex = page * limit;
    const endIndex = startIndex + limit;

    console.log("req for page and limit", page, "   ", limit);

    const usersData = (await supabase.from("users").select("*"))
      .data as UserDataInterface[];
    const data = (await supabase.from("posts").select("*"))
      .data as QuoteInterface[];

    const merged: QuotesInterfaceWithProfile[] = data.map((post) => {
      const currentUserData = usersData.filter(
        (item) => item.userId == post.userId
      );
      return { ...post, profile_url: currentUserData[0].profile_url };
    });

    const paginatedPosts = merged.reverse().slice(startIndex, endIndex);

    res.json({
      status: 200,
      message: "fetch success",
      quotes: paginatedPosts,
    });
  }
);

PublicRoutes.get("/get_one_random", async (req: Request, res: Response) => {
  try {
    const data = (await supabase.from("posts").select("*"))
      .data as QuoteInterface[];

    const randomQuote = data[Math.floor(Math.random() * data.length)];

    res.json({ message: "success", status: 200, quote: randomQuote });
  } catch (e) {
    console.log(e);
    res.status(500).json({ message: "error", status: 300, quote: "" });
  }
});


PublicRoutes.get(
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



export default PublicRoutes;
