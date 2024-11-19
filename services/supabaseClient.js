import { createClient } from "@supabase/supabase-js";
import Constants from "expo-constants";

const SUPABASE_URL = Constants.manifest.extra.SUPABASE_URL;
const SUPABASE_KEY = Constants.manifest.extra.SUPABASE_KEY;

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

export const getSupabaseClient = () => supabase;
