import { supabase } from './supabase-client';

/**
 * Get the current authenticated user
 * @returns {Promise<{user: object | null, session: object | null}>}
 */
export const getCurrentUser = async () => {
  const {
    data: { user, session },
  } = await supabase.auth.getUser();
  return { user, session };
};

/**
 * Sign out the current user
 * @returns {Promise<{error: object | null}>}
 */
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  return { error };
};

/**
 * Sign in with Google OAuth
 * @returns {Promise<{data: object, error: object | null}>}
 */
export const signInWithGoogle = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: `${window.location.origin}/auth/callback`,
    },
  });
  return { data, error };
};

/**
 * Get auth session
 * @returns {Promise<{session: object | null, error: object | null}>}
 */
export const getSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  return { session, error };
};

/**
 * Listen to auth state changes
 * @param {function} callback - Callback function to handle auth state changes
 * @returns {function} - Unsubscribe function
 */
export const onAuthStateChange = (callback) => {
  const { data } = supabase.auth.onAuthStateChange((event, session) => {
    callback(session);
  });

  return data.subscription.unsubscribe;
};
