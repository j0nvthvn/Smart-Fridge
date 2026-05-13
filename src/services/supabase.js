import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mvpskwximpvlkovxeoxm.supabase.co';
const SUPABASE_ANON_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im12cHNrd3hpbXB2bGtvdnhlb3htIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg2MzAxNDgsImV4cCI6MjA5NDIwNjE0OH0.TEtPNbghjkmZosLTp3-r85b-hif616yRVYV2S16iVkY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});
