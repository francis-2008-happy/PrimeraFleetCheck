import { AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// The address of our Supabase project and its public "publishable" key.
// The real values live in the file ".env.local", which is NOT committed to GitHub.
// Expo copies any variable starting with EXPO_PUBLIC_ into the app when it builds.
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL ?? '';
const supabaseKey = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY ?? '';

// The Supabase client: every database read, write and live update goes through it.
// We save the login session in AsyncStorage so the phone stays signed in after
// the app is closed, instead of signing in again every time.
export const supabase = createClient(supabaseUrl || 'https://not-configured.supabase.co', supabaseKey || 'missing', {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // only needed on websites, not in a mobile app
  },
});

// Keeps the login fresh only while the app is open on screen. When the app goes
// to the background we pause the timer that renews the login, to save battery.
AppState.addEventListener('change', (state) => {
  if (state === 'active') {
    supabase.auth.startAutoRefresh();
  } else {
    supabase.auth.stopAutoRefresh();
  }
});

// Signs this phone in "anonymously": Supabase gives it a private user id
// without asking for an email or password. Our security policies only let
// signed-in users read or write, so strangers on the internet cannot.
export async function ensureSignedIn(): Promise<void> {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase is not set up. Add your settings to .env.local and restart Expo.');
  }
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) throw error;
  }
}
