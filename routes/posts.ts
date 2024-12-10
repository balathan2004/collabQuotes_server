import express, { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";
import supabaseAdmin from "../utils/supabase_admin";
import { AuthResponseConfig } from "../utils/interfaces";
import { QuoteInterface } from "../utils/interfaces";
import ShortUniqueId from "short-unique-id";
// Create a router instance
const app = Router();
const uid = new ShortUniqueId({ length: 10 });

app.post("/create_tweet", async (req: Request, res: Response) => {
  const collabQuotes_uid: string = req.cookies?.collabQuotes_uid || "";

  const { quote, author } = req.body;

  console.log("received ", collabQuotes_uid);

  if (collabQuotes_uid && quote && author) {
    const postData: QuoteInterface = {
      quote: quote,
      author: author,
      quoteId: uid.rnd(),
      createdAt: new Date().getTime(),
      userId: collabQuotes_uid,
    };

    const { data, error } = await supabase.from("posts").insert(postData);

    console.log(data, error);
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


app.get('/get_posts',async(req:Request,res:Response)=>{

  const data = (await supabase.from("posts").select("*")).data as QuoteInterface[]

  if(data){
    console.log(data)
    res.json({status:200,message:"",quotes:data})
  }



})



export default app;
