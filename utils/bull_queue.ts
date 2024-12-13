import Queue, { Queue as QueueType, Job } from "bull";
import { processPostProcess } from "./bull_process";

export type QuoteFileDataType={quotes:{quote:string,author:string}[]}


export interface PostJobData {
    postData: QuoteFileDataType
  }


export const PostUploadQueue: QueueType<PostJobData> = new Queue<PostJobData>(
    "collabQuotesPostUploadQueue",
    {
      redis: {
        host: "redis-19787.c330.asia-south1-1.gce.redns.redis-cloud.com", // Replace with your Redis host
        port: 19787, // Replace with your Redis port
        password: "d6d41JQtMDens12w7hiMvZhBv78a3kyl", // Replace with your Redis password (if required)
        connectTimeout: 0,
      },
    }
  );

  PostUploadQueue.on("waiting", (jobId) => {
    console.log(`Job ${jobId} is waiting`);
  });
  
  PostUploadQueue.on("active", (job) => {
    console.log(`Job ${job.id} is active`);
  });
  
  PostUploadQueue.on("completed", (job, result) => {
    console.log(`Job ${job.id} completed with result:`, result);
  });
  
  PostUploadQueue.on("failed", (job, err) => {
    console.error(`Job ${job.id} failed with error:`, err);
  });

  PostUploadQueue.process(processPostProcess)