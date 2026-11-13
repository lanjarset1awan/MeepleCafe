import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load .env from backend folder specifically or cwd
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config(); // fallback

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.warn("WARNING: SUPABASE_URL or SUPABASE_KEY is missing in environment variables!");
}

export const supabase = createClient(supabaseUrl, supabaseKey);
