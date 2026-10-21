import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const authService = {
  /**
   * Get current authenticated user session from Supabase client.
   */
  async getSession() {
    if (!isSupabaseConfigured) return null;
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) throw error;
      return session;
    } catch (err) {
      console.warn('authService.getSession error:', err);
      return null;
    }
  },

  /**
   * Sign out using Supabase Auth.
   */
  async signOut() {
    if (!isSupabaseConfigured) return;
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.warn('authService.signOut error:', err);
    }
  },

  /**
   * Validate current session validity.
   */
  async validateSession() {
    const session = await this.getSession();
    return {
      isValid: Boolean(session?.user),
      user: session?.user || null,
    };
  },
};
