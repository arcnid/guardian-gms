import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

// const SUPABASE_URL = Constants.manifest.extra.SUPABASE_URL;
// const SUPABASE_KEY = Constants.manifest.extra.SUPABASE_KEY;
const SUPABASE_URL = "https://gekhbjzsclrrfojpvjqr.supabase.co";
const SUPABASE_KEY =
	"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdla2hianpzY2xycmZvanB2anFyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzE1OTk4NzgsImV4cCI6MjA0NzE3NTg3OH0.GW-aKMNhx092k-DpTBgSTMqjxjKMBTy9UqmNjWGYmy4";

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const getSupabaseClient = () => supabase;
