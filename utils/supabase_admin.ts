import { createClient, SupabaseClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

// Load environment variables from .env file
dotenv.config();

const url = process.env.PRO_URL;
const apiKey = process.env.SUPABASE_ADMIN_APIKEY;

// Check for missing environment variables
if (!url || !apiKey) {
  console.error("Supabase URL or API key is missing!");
  throw new Error("Missing environment variables for Supabase.");
}

// Initialize and export the Supabase client
const supabaseAdmin: SupabaseClient = createClient(url, apiKey);

export default supabaseAdmin;
