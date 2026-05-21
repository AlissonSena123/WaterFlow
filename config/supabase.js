import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

export const supabase = createClient(
  process.env.SUPABASE_URL.trim().replace(/\/$/, ""),
  process.env.SUPABASE_KEY.trim()
);