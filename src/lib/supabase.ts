import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    flowType: 'pkce',
  },
  db: {
    schema: 'public',
  },
  global: {
    headers: {
      'X-Client-Info': 'time-lords-network',
    },
  },
});

// Add a connection check function
export const checkSupabaseConnection = async () => {
  try {
    // Try to access the storage API
    const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets();
    if (bucketsError) throw bucketsError;
    
    // Check if avatars bucket exists
    const avatarsBucket = buckets?.find(b => b.name === 'avatars');
    if (!avatarsBucket) {
      console.warn('Avatars bucket not found');
    }

    // Try to get storage policies
    const { data: policies, error: policiesError } = await supabase
      .rpc('get_policies')
      .eq('table_name', 'storage.objects');
    
    if (policiesError) {
      console.warn('Could not fetch storage policies:', policiesError);
    } else {
      console.log('Storage policies:', policies);
    }

    return true;
  } catch (error) {
    console.error('Supabase connection error:', error);
    return false;
  }
};

// Run the connection check immediately
checkSupabaseConnection().then(connected => {
  if (!connected) {
    console.error('Failed to connect to Supabase');
  }
});