import express, { Request, Response, Router } from "express";
import supabase from "../utils/supabase_client";
import supabaseAdmin from "../utils/supabase_admin";
import { AuthResponseConfig } from "../utils/interfaces";
import { QuoteInterface } from "../utils/interfaces";
import ShortUniqueId from "short-unique-id";
import { PostUploadQueue } from "../utils/bull_queue";
import formidable, { IncomingForm } from "formidable";
import { QuoteFileDataType } from "../utils/bull_queue";
import fs from "fs";
// Create a router instance
const AdminRoutes = Router();
const uid = new ShortUniqueId({ length: 10 });

AdminRoutes.post("/create_bulk_tweet", async (req: Request, res: Response) => {
  console.log("requested");
  const form = new IncomingForm();

  try {
    form.parse(req, async (err, fields, files) => {
      if (err) {
        throw new Error(err);

      }

      if (fields && files) {
        const apiKey = fields.apiKey ? fields.apiKey[0] : "";
        const file = files.file ? files.file[0] : null;

        if (apiKey && file) {
            const jsonData: QuoteFileDataType = JSON.parse(
                fs.readFileSync(file.filepath, "utf-8")
            );
          if (jsonData) {
            await PostUploadQueue.add({ postData: jsonData });
          }
        }
      }

      res.json({ status: 200, message: "success" });
    });
  } catch (err) {
    res.json({ status: 300, message: "unsuccessful" });
  }
});

export default AdminRoutes;
