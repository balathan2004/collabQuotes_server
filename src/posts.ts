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

PostRoutes.post(
  "/create_tweet",
  async (req: Request, res: Response<ResponseConfig>) => {
    const collabQuotes_uid: string =
      req.cookies?.collabQuotes_uid || req.body.userId || "";

    console.log(req.body);

    const { quote, author, username } = req.body;

    console.log("received ", collabQuotes_uid);

    if (!collabQuotes_uid) {
      res.json({
        status: 400,
        message: "User ID is missing or invalid.",
      });
      return;
    }

    if (!quote || typeof quote !== "string") {
      res.json({
        status: 400,
        message: "Quote is missing or invalid.",
      });
      return;
    }

    if (!author || typeof author !== "string") {
      res.json({
        status: 400,
        message: "Author is missing or invalid.",
      });
      return;
    }

    if (!username || typeof username !== "string") {
      res.json({
        status: 400,
        message: "Username is missing or invalid.",
      });
      return;
    }

    const postData: QuoteInterface = {
      quote: quote,
      author: author,
      quoteId: uid.rnd(),
      createdAt: new Date().getTime(),
      userId: collabQuotes_uid,
      username: username,
    };

    try {
      res.json({
        status: 200,
        message: "Quote sent for processing",
      });

      const { error } = await supabase.from("posts").insert(postData);

      if (error) {
        console.error("Database error:", error);
        res.json({
          status: 300,
          message: "Failed to add the quote. Please try again later.",
        });
        return;
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      res.json({
        status: 300,
        message: "An unexpected error occurred.",
      });
      return;
    }
  }
);

PostRoutes.post(
  "/delete_post",
  async (req: Request, res: Response<ResponseConfig>) => {
    console.log(req.body);
    const collabQuotes_uid: string =
      req.cookies?.collabQuotes_uid || req.body.userId || "";

    const { quoteId } = req.body;

    if (!collabQuotes_uid) {
      res.json({
        status: 400,
        message: "User ID is missing or invalid.",
      });
      return;
    }

    if (!quoteId || typeof quoteId !== "string") {
      res.json({
        status: 400,
        message: "Quote is missing or invalid.",
      });
      return;
    }

    try {
      const { error } = await supabase
        .from("posts")
        .delete()
        .eq("quoteId", quoteId);

      if (error) {
        console.error("Unexpected error:", error);
        res.json({
          status: 300,
          message: "An unexpected error occurred.",
        });
        return;
      }

      res.json({
        status: 200,
        message: "Quote Deleted ",
      });
    } catch (error) {
      console.error("Unexpected error:", error);
      res.json({
        status: 300,
        message: "An unexpected error occurred.",
      });
      return;
    }
  }
);

PostRoutes.get(
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

export default PostRoutes;
