import { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext(null);

// ─── Route Helpers ──────────────────────────────────────────────────────────
export function getRedirectPathForRole(role) {
  if (role === 'admin') return '/admin/dashboard';
  if (role === 'hotel_manager') return '/manager/dashboard';
  return '/dashboard';
}

// ─── Utility Helpers ────────────────────────────────────────────────────────
function deriveInitials(name) {
  if (!name) return 'U';
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function formatAuthError(error) {
  if (!error) return 'An error occurred during authentication.';
  const msg = error.message || String(error);
  if (msg.includes('Invalid login credentials')) {
    return 'Invalid email or password. Please verify your credentials.';
  }
  if (msg.includes('User already registered') || msg.includes('already exists')) {
    return 'An account with this email already exists. Please sign in instead.';
  }
  if (msg.includes('Password should be at least 6 characters')) {
    return 'Password must be at least 6 characters long.';
  }
  if (msg.includes('Email not confirmed')) {
    return 'Please confirm your email address before signing in (or disable "Confirm email" in Supabase Auth settings).';
  }
  if (msg.includes('rate limit')) {
    return 'Too many login attempts. Please wait a moment and try again.';
  }
  return msg;
}

const STORAGE_KEY_SAVED_HOTELS = 'lodgekeys_saved_hotels';

function getLocalSavedHotels() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY_SAVED_HOTELS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function saveLocalSavedHotels(saved) {
  try {
    localStorage.setItem(STORAGE_KEY_SAVED_HOTELS, JSON.stringify(saved));
  } catch { /* noop */ }
}

// ─── Authoritative Profile & Property Fetcher ───────────────────────────────
async function fetchUserProfileAndHotel(authUser) {
  if (!authUser) return null;

  try {
    // 1. Authoritative query from public.profiles
    const { data: profile, error } = await supabase
      .from('profiles')
      .select('id, full_name, email, phone, role, initials, avatar_url, created_at')
      .eq('id', authUser.id)
      .maybeSingle();

    if (error) {
      console.warn('Notice: public.profiles query warning:', error.message);
    }

    const email = profile?.email || authUser.email;
    const fullName = profile?.full_name || authUser.user_metadata?.full_name || authUser.user_metadata?.name || email?.split('@')[0] || 'User';
    const phone = profile?.phone || authUser.user_metadata?.phone || '';
    // Role is server-authoritative from database profile
    const role = profile?.role || 'customer';
    const initials = profile?.initials || deriveInitials(fullName);

    let assignedHotel = null;
    let hotelName = null;

    // 2. If role is 'hotel_manager', fetch assigned hotel from public.hotel_managers
    if (role === 'hotel_manager') {
      const { data: managerData, error: mgrError } = await supabase
        .from('hotel_managers')
        .select(`
          hotel_id,
          is_primary,
          hotels:hotel_id (
            id,
            slug,
            name
          )
        `)
        .eq('user_id', authUser.id)
        .maybeSingle();

      if (!mgrError && managerData) {
        assignedHotel = managerData.hotels?.slug || managerData.hotel_id;
        hotelName = managerData.hotels?.name;
      }
    }

    // 3. Fetch user's saved hotels from public.saved_hotels
    let savedHotels = getLocalSavedHotels();
    try {
      const { data: savedRows, error: savedErr } = await supabase
        .from('saved_hotels')
        .select(`
          hotel_id,
          hotels:hotel_id ( slug )
        `)
        .eq('user_id', authUser.id);

      if (!savedErr && savedRows) {
        const dbSaved = savedRows.map((r) => r.hotels?.slug || r.hotel_id);
        savedHotels = Array.from(new Set([...savedHotels, ...dbSaved]));
      }
    } catch { /* non-critical */ }

    return {
      id: authUser.id,
      email,
      fullName,
      phone,
      role,
      initials,
      avatarUrl: profile?.avatar_url || null,
      assignedHotel,
      hotelSlug: assignedHotel,
      hotelName,
      createdAt: profile?.created_at || authUser.created_at,
      savedHotels,
      bookings: [],
    };
  } catch (err) {
    console.error('Failed to fetch user profile:', err);
    return {
      id: authUser.id,
      email: authUser.email,
      fullName: authUser.user_metadata?.full_name || 'User',
      phone: authUser.user_metadata?.phone || '',
      role: 'customer',
      initials: 'U',
      savedHotels: getLocalSavedHotels(),
      bookings: [],
    };
  }
}

// ─── Provider Component ─────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [authMode, setAuthMode] = useState('signin');
  const [isLoadingSession, setIsLoadingSession] = useState(true);

  const [guestSavedHotels, setGuestSavedHotels] = useState(() => getLocalSavedHotels());
  const [currentUser, setCurrentUser] = useState(null);

  const isAuthenticated = Boolean(currentUser);
  const userRole = currentUser?.role || null;

  // 1. Initial Session Check & Realtime Auth State Listener
  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        if (isSupabaseConfigured) {
          const { data: { session }, error } = await supabase.auth.getSession();
          if (error) throw error;

          if (session?.user && isMounted) {
            const profile = await fetchUserProfileAndHotel(session.user);
            if (isMounted) {
              setCurrentUser(profile);
            }
          }
        }
      } catch (err) {
        console.warn('Error verifying Supabase auth session:', err);
      } finally {
        if (isMounted) setIsLoadingSession(false);
      }
    };

    initializeAuth();

    // Subscribe to Supabase Auth state changes across tabs/windows
    let authListener = null;
    if (isSupabaseConfigured) {
      const { data } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (!isMounted) return;

        if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
          if (session?.user) {
            const profile = await fetchUserProfileAndHotel(session.user);
            if (isMounted) {
              setCurrentUser(profile);
            }
          }
        } else if (event === 'SIGNED_OUT') {
          if (isMounted) {
            setCurrentUser(null);
          }
        }
      });
      authListener = data.subscription;
    }

    return () => {
      isMounted = false;
      authListener?.unsubscribe();
    };
  }, []);

  const openAuth = useCallback((mode = 'signin') => {
    setAuthMode(mode);
    setIsAuthOpen(true);
  }, []);

  const closeAuth = useCallback(() => {
    setIsAuthOpen(false);
  }, []);

  // 2. Real Supabase Sign In With Password
  const signIn = useCallback(async (email, password) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail) return { success: false, error: 'Email address is required.' };
    if (!cleanPassword) return { success: false, error: 'Password is required.' };

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password: cleanPassword,
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }

      if (data?.user) {
        const profile = await fetchUserProfileAndHotel(data.user);
        setCurrentUser(profile);
        return {
          success: true,
          user: profile,
          redirectTo: getRedirectPathForRole(profile.role),
        };
      }

      return { success: false, error: 'No user session returned.' };
    } catch (err) {
      return { success: false, error: formatAuthError(err) };
    }
  }, []);

  // 3. Real Supabase Registration
  const register = useCallback(async (fullName, email, password, phone = '') => {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanName = (fullName || '').trim();
    const cleanPhone = (phone || '').trim();

    if (!cleanName) return { success: false, error: 'Please enter your full name.' };
    if (!cleanEmail) return { success: false, error: 'Please enter a valid email address.' };
    if (!password || password.length < 6) return { success: false, error: 'Password must be at least 6 characters long.' };

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email: cleanEmail,
        password,
        options: {
          data: {
            full_name: cleanName,
            phone: cleanPhone,
          },
        },
      });

      if (error) {
        return { success: false, error: formatAuthError(error) };
      }

      if (data?.user) {
        if (data.session) {
          const profile = await fetchUserProfileAndHotel(data.user);
          setCurrentUser(profile);
          return {
            success: true,
            user: profile,
            redirectTo: '/dashboard',
          };
        } else {
          // Confirmation email pending
          const initialUser = {
            id: data.user.id,
            email: cleanEmail,
            fullName: cleanName,
            role: 'customer',
            initials: deriveInitials(cleanName),
          };
          return {
            success: true,
            user: initialUser,
            redirectTo: '/dashboard',
            message: 'Account created! Please check your email for confirmation.',
          };
        }
      }

      return { success: false, error: 'Registration could not be completed.' };
    } catch (err) {
      return { success: false, error: formatAuthError(err) };
    }
  }, []);

  // 4. Real Supabase Sign Out
  const signOut = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut();
      }
    } catch (err) {
      console.warn('Supabase sign out error:', err);
    } finally {
      setCurrentUser(null);
    }
  }, []);

  // 5. Password Reset Recovery Link
  const resetPassword = useCallback(async (email) => {
    const cleanEmail = (email || '').trim().toLowerCase();
    if (!cleanEmail) return { success: false, error: 'Please enter your email address.' };

    if (!isSupabaseConfigured) {
      return {
        success: false,
        error: 'Supabase authentication is not configured. Please define VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY.',
      };
    }

    try {
      const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: `${window.location.origin}/`,
      });
      if (error) return { success: false, error: formatAuthError(error) };
      return { success: true };
    } catch (err) {
      return { success: false, error: formatAuthError(err) };
    }
  }, []);

  // 6. Profile Editing (updates public.profiles and auth user metadata)
  const updateProfile = useCallback(async ({ fullName, phone }) => {
    if (!currentUser) return { success: false, error: 'Not authenticated.' };

    const cleanName = (fullName !== undefined ? fullName : currentUser.fullName).trim();
    const cleanPhone = (phone !== undefined ? phone : currentUser.phone || '').trim();

    if (isSupabaseConfigured) {
      try {
        const updates = {
          full_name: cleanName,
          phone: cleanPhone,
          initials: deriveInitials(cleanName),
          updated_at: new Date().toISOString(),
        };

        const { error: profileErr } = await supabase
          .from('profiles')
          .update(updates)
          .eq('id', currentUser.id);

        if (profileErr) throw profileErr;

        // Also update auth user metadata
        await supabase.auth.updateUser({
          data: { full_name: cleanName, phone: cleanPhone },
        });

        const updated = {
          ...currentUser,
          fullName: cleanName,
          phone: cleanPhone,
          initials: updates.initials,
        };
        setCurrentUser(updated);
        return { success: true, user: updated };
      } catch (err) {
        return { success: false, error: formatAuthError(err) };
      }
    }

    return { success: false, error: 'Supabase is not configured.' };
  }, [currentUser]);

  // 7. Password Update
  const updatePassword = useCallback(async (currentPassword, newPassword) => {
    if (!currentUser) return { success: false, error: 'Not authenticated.' };
    if (!newPassword || newPassword.length < 6) {
      return { success: false, error: 'New password must be at least 6 characters long.' };
    }

    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.auth.updateUser({
          password: newPassword,
        });
        if (error) return { success: false, error: formatAuthError(error) };
        return { success: true };
      } catch (err) {
        return { success: false, error: formatAuthError(err) };
      }
    }

    return { success: false, error: 'Supabase is not configured.' };
  }, [currentUser]);

  // 8. Refresh Current User
  const refreshUser = useCallback(async () => {
    if (!currentUser) return;
    if (isSupabaseConfigured) {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const profile = await fetchUserProfileAndHotel(user);
          setCurrentUser(profile);
        }
      } catch (err) {
        console.warn('Failed to refresh user:', err);
      }
    }
  }, [currentUser]);

  // 9. Delete Account
  const deleteAccount = useCallback(async () => {
    if (!currentUser) return { success: false, error: 'Not authenticated.' };

    if (isSupabaseConfigured) {
      try {
        await supabase.from('profiles').delete().eq('id', currentUser.id);
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Error deleting profile:', err);
      }
    }

    setCurrentUser(null);
    return { success: true };
  }, [currentUser]);

  // 10. Bookings Integration Helper
  const addBookingToUser = useCallback((booking) => {
    if (!currentUser) return;
    setCurrentUser((prev) => ({
      ...prev,
      bookings: [booking, ...(prev?.bookings || [])],
    }));
  }, [currentUser]);

  // 11. Saved Hotels (Favorites) with Database Sync
  const savedHotelIds = useMemo(() => {
    return currentUser ? (currentUser.savedHotels || []) : guestSavedHotels;
  }, [currentUser, guestSavedHotels]);

  const isFavorite = useCallback((hotelOrId) => {
    if (hotelOrId == null) return false;
    const targetId = typeof hotelOrId === 'object' ? hotelOrId.id : hotelOrId;
    const targetSlug = typeof hotelOrId === 'object' ? hotelOrId.slug : null;

    return savedHotelIds.some((item) =>
      String(item) === String(targetId) || (targetSlug && String(item) === String(targetSlug))
    );
  }, [savedHotelIds]);

  const toggleFavorite = useCallback(async (hotelOrId) => {
    if (hotelOrId == null) return;
    const targetId = typeof hotelOrId === 'object' ? (hotelOrId.id ?? hotelOrId.slug) : hotelOrId;
    const targetSlug = typeof hotelOrId === 'object' ? hotelOrId.slug : null;

    const matches = (item) => String(item) === String(targetId) || (targetSlug && String(item) === String(targetSlug));

    if (currentUser) {
      const currentList = currentUser.savedHotels || [];
      const exists = currentList.some(matches);
      const nextList = exists
        ? currentList.filter((item) => !matches(item))
        : [...currentList, targetId];

      setCurrentUser((prev) => (prev ? { ...prev, savedHotels: nextList } : null));

      if (isSupabaseConfigured) {
        try {
          if (exists) {
            await supabase
              .from('saved_hotels')
              .delete()
              .eq('user_id', currentUser.id)
              .eq('hotel_id', targetId);
          } else {
            await supabase
              .from('saved_hotels')
              .insert({ user_id: currentUser.id, hotel_id: targetId })
              .maybeSingle();
          }
        } catch { /* non-critical */ }
      }
    } else {
      setGuestSavedHotels((prev) => {
        const exists = prev.some(matches);
        const nextList = exists
          ? prev.filter((item) => !matches(item))
          : [...prev, targetId];
        saveLocalSavedHotels(nextList);
        return nextList;
      });
    }
  }, [currentUser]);

  const value = useMemo(
    () => ({
      currentUser,
      isAuthenticated,
      userRole,
      isAuthOpen,
      authMode,
      isLoadingSession,
      openAuth,
      closeAuth,
      setAuthMode,
      signIn,
      register,
      signOut,
      resetPassword,
      updateProfile,
      updatePassword,
      refreshUser,
      deleteAccount,
      addBookingToUser,
      savedHotelIds,
      isFavorite,
      toggleFavorite,
    }),
    [
      currentUser,
      isAuthenticated,
      userRole,
      isAuthOpen,
      authMode,
      isLoadingSession,
      openAuth,
      closeAuth,
      signIn,
      register,
      signOut,
      resetPassword,
      updateProfile,
      updatePassword,
      refreshUser,
      deleteAccount,
      addBookingToUser,
      savedHotelIds,
      isFavorite,
      toggleFavorite,
    ]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
