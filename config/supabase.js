import { createClient } from "@supabase/supabase-js";
import { config } from "dotenv";
config();

console.log("URL RAW:", process.env.SUPABASE_URL);
console.log("URL LENGTH:", process.env.SUPABASE_URL.length);
console.log("LAST CHAR:", process.env.SUPABASE_URL.slice(-1));

export const supabase = createClient(
  process.env.SUPABASE_URL.trim().replace(/\/$/, ""),
  process.env.SUPABASE_KEY.trim()
);