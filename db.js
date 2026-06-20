const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  "https://kkobghcuswnmtogaslzx.supabase.co",
  "sb_publishable_Ux5fjEE6Ufl7ERePDzc7Mw_m0NuH1vc"
);

module.exports = supabase;
