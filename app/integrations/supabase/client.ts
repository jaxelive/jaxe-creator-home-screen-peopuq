
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Database } from './types';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://gksbjmanxukirwrbbnes.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imdrc2JqbWFueHVraXJ3cmJibmVzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIxMDg1MDAsImV4cCI6MjA3NzY4NDUwMH0.9rWeQGIeJNX96bIsn-4VugxuY_7-4wGSnx9Hmz-gjFU";

console.log('[Supabase Client] Initializing with URL:', SUPABASE_URL);

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

console.log('[Supabase Client] Client initialized successfully');
