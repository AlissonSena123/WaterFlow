const { createClient } = require("@supabase/supabase-js");
require("dotenv").config();

console.log("URL RAW:", process.env.SUPABASE_URL);
console.log("URL LENGTH:", process.env.SUPABASE_URL.length);
console.log("LAST CHAR:", process.env.SUPABASE_URL.slice(-1));

const supabase = createClient(
  process.env.SUPABASE_URL.trim().replace(/\/$/, ""),
  process.env.SUPABASE_KEY.trim()
);

module.exports = { supabase };