import express, { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";
import supabaseAdmin from "../utils/supabase_admin";
import {
  AuthResponseConfig,
  PostResponseConfig,
  QuotesInterfaceWithProfile,
  ResponseConfig,
  UserDataInterface,
} from "../utils/interfaces";
import { QuoteInterface } from "../utils/interfaces";
import ShortUniqueId from "short-unique-id";
const uid = new ShortUniqueId({ length: 10 });
// Create a router instance
const PostRoutes = Router();

PostRoutes.post("/create_tweet", async (req: Request, res: Response<ResponseConfig>) => {
  const collabQuotes_uid: string = req.cookies?.collabQuotes_uid || "";

  const { quote, author, username } = req.body;

  console.log("received ", collabQuotes_uid);

  if (collabQuotes_uid && quote && author) {
    const postData: QuoteInterface = {
      quote: quote,
      author: author,
      quoteId: uid.rnd(),
      createdAt: new Date().getTime(),
      userId: collabQuotes_uid,
      username: username,
    };

    const { data, error } = await supabase.from("posts").insert(postData);

    if (data) {
      res.json({
        status: 200,
        message: "Quote Added",
      });
    } else {
      res.json({
        status: 300,
        message: "Post failed",
      });
    }
  } else {
    res.json({
      status: 300,
      message: "Post failed",
    });
  }
});

PostRoutes.get(
  "/get_posts",
  async (req: Request, res: Response<PostResponseConfig>) => {
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

    if (merged) {
      console.log(data);
      res.json({ status: 200, message: "", quotes: merged });
    }
  }
);

export default PostRoutes;
