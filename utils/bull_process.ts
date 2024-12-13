import { PostJobData, QuoteFileDataType } from "./bull_queue";
import { Job } from "bull";
import { QuoteInterface } from "./interfaces";
import ShortUniqueId from "short-unique-id";
const uid = new ShortUniqueId({ length: 10 });
import supabase from "../utils/supabase_client";

export const processPostProcess = async (job: Job<PostJobData>) => {
  if (job.data.postData && job.data.postData) {
    await post(job.data.postData);
  }
};

const post = async (postData:QuoteFileDataType) => {
  const quotes = postData.quotes;

  console.log(quotes)

  quotes.forEach(async (single) => {
    try {
        console.log(single)
        const postData: QuoteInterface = {
          quote: single.quote,
          author: single.author,
          quoteId: uid.rnd(),
          createdAt: new Date().getTime(),
          userId: "b596c7ac-9a93-4a5d-a8c3-d1897e0f4248",
          username: "lightUzumaki2406",
        };
  
        await supabase.from("posts").insert(postData);
      } catch (error) {
        console.error("Error inserting quote:", single.quote, error);
      }
  });
};
