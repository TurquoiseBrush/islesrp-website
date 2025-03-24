const SUPABASE_URL = "https://lxgzuvqejayrhdnznhrh.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx4Z3p1dnFlamF5cmhkbnpuaHJoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDE4NzI4MzgsImV4cCI6MjA1NzQ0ODgzOH0.wvr9ne9LLFBILSbO7KjCbqoM92FtB1qStW0vWujizF8";

const supabase = window.supabase?.createClient
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY)
  : null;

if (!supabase) {
  console.error("❌ Supabase client failed to initialize.");
}