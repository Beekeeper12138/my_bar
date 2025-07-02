
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  role: 'USER' | 'ADMIN';
  updated_at: string;
}

interface UserContextType {
  user: User | null;
  session: Session | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  refreshProfile: () => Promise<void>;
  forceRefreshProfile: () => Promise<void>;
  debugUpdateRole: (newRole: 'USER' | 'ADMIN') => Promise<boolean>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const useUser = () => {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (userId: string, forceRefresh: boolean = false): Promise<UserProfile | null> => {
    try {
      console.log(`UserContext - Fetching profile for user: ${userId}, forceRefresh: ${forceRefresh}`);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('UserContext - Error fetching profile:', error);
        return null;
      }
      
      console.log('UserContext - Profile fetched successfully:', data);
      
      return {
        ...data,
        role: data.role as 'USER' | 'ADMIN'
      };
    } catch (error) {
      console.error('UserContext - Exception fetching profile:', error);
      return null;
    }
  };

  const debugUpdateRole = async (newRole: 'USER' | 'ADMIN'): Promise<boolean> => {
    if (!user) {
      console.error('debugUpdateRole - No user found');
      return false;
    }

    console.log(`debugUpdateRole - Starting role update to ${newRole} for user ${user.id}`);

    try {
      // 1. 首先检查当前用户是否存在于profiles表中
      const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (fetchError) {
        console.error('debugUpdateRole - Error fetching current profile:', fetchError);
        return false;
      }

      console.log('debugUpdateRole - Current profile:', currentProfile);

      // 2. 尝试更新角色
      const { data: updateData, error: updateError } = await supabase
        .from('profiles')
        .update({ 
          role: newRole, 
          updated_at: new Date().toISOString() 
        })
        .eq('id', user.id)
        .select();

      if (updateError) {
        console.error('debugUpdateRole - Update error:', updateError);
        return false;
      }

      console.log('debugUpdateRole - Update result:', updateData);

      // 3. 立即获取更新后的数据
      const { data: verifyData, error: verifyError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (verifyError) {
        console.error('debugUpdateRole - Verify error:', verifyError);
        return false;
      }

      console.log('debugUpdateRole - Verification result:', verifyData);
      
      if (verifyData.role === newRole) {
        console.log('debugUpdateRole - Role update successful');
        // 立即更新本地状态
        setProfile({
          id: verifyData.id,
          role: verifyData.role as 'USER' | 'ADMIN',
          updated_at: verifyData.updated_at
        });
        return true;
      } else {
        console.error('debugUpdateRole - Role mismatch after update:', {
          expected: newRole,
          actual: verifyData.role
        });
        return false;
      }
    } catch (error) {
      console.error('debugUpdateRole - Exception:', error);
      return false;
    }
  };

  const refreshProfile = async () => {
    console.log('UserContext - Refreshing profile...');
    if (user) {
      const profileData = await fetchProfile(user.id, false);
      console.log('UserContext - Profile refreshed:', profileData);
      if (profileData) {
        setProfile(profileData);
        console.log('UserContext - Profile state updated to:', profileData);
      }
    } else {
      console.log('UserContext - No user found, cannot refresh profile');
    }
  };

  const forceRefreshProfile = async () => {
    console.log('UserContext - Force refreshing profile...');
    if (user) {
      const profileData = await fetchProfile(user.id, true);
      console.log('UserContext - Force refresh result:', profileData);
      if (profileData) {
        setProfile(profileData);
      }
    } else {
      console.log('UserContext - No user found, cannot force refresh profile');
    }
  };

  useEffect(() => {
    let mounted = true;

    const initializeAuth = async () => {
      try {
        console.log('UserContext - Initializing auth...');
        
        // Get initial session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('UserContext - Error getting session:', error);
        }

        if (mounted) {
          console.log('UserContext - Session obtained:', session?.user?.id);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            const profileData = await fetchProfile(session.user.id);
            setProfile(profileData);
          }
          setLoading(false);
        }
      } catch (error) {
        console.error('UserContext - Error initializing auth:', error);
        if (mounted) {
          setLoading(false);
        }
      }
    };

    // Initialize auth
    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;

        console.log('UserContext - Auth state change:', event, session?.user?.id);
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          // 小延迟确保数据库更新完成
          setTimeout(async () => {
            if (mounted) {
              const profileData = await fetchProfile(session.user.id);
              setProfile(profileData);
            }
          }, 100);
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const isAdmin = profile?.role === 'ADMIN';

  // Debug logging
  useEffect(() => {
    console.log('UserContext - State updated:', {
      userId: user?.id,
      profileRole: profile?.role,
      isAdmin,
      profileUpdatedAt: profile?.updated_at
    });
  }, [user, profile, isAdmin]);

  return (
    <UserContext.Provider value={{
      user,
      session,
      profile,
      loading,
      isAdmin,
      refreshProfile,
      forceRefreshProfile,
      debugUpdateRole
    }}>
      {children}
    </UserContext.Provider>
  );
};
