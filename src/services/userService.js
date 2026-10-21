import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

export const userService = {
  /**
   * Fetch user profiles securely from public.profiles
   */
  async getUsersAsync() {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('id, full_name, email, phone, role, initials, avatar_url, created_at')
          .order('created_at', { ascending: false });

        if (!error && Array.isArray(data)) {
          return data.map((p) => ({
            id: p.id,
            fullName: p.full_name,
            email: p.email,
            phone: p.phone,
            role: p.role || 'customer',
            initials: p.initials,
            avatarUrl: p.avatar_url,
            joinedAt: p.created_at,
          }));
        }
      } catch (err) {
        console.warn('userService.getUsersAsync error:', err);
      }
    }
    return [];
  },

  /**
   * Find profile by user ID
   */
  async findUserById(id) {
    if (!id || !isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, phone, role, initials, avatar_url, created_at')
        .eq('id', id)
        .maybeSingle();

      if (error || !data) return null;
      return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        phone: data.phone,
        role: data.role,
        initials: data.initials,
        avatarUrl: data.avatar_url,
        joinedAt: data.created_at,
      };
    } catch {
      return null;
    }
  },

  /**
   * Synchronous fallback getter for local cache
   */
  getUsers() {
    return [];
  },
};
