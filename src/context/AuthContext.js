import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar sesión existente
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadProfile(session.user);
      } else {
        setLoading(false);
      }
    });

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        if (session?.user) {
          loadProfile(session.user);
        } else {
          setUser(null);
          setLoading(false);
        }
      },
    );

    return () => subscription.unsubscribe();
  }, []);

  async function loadProfile(authUser) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('name')
        .eq('id', authUser.id)
        .single();

      if (error) throw error;

      setUser({
        id: authUser.id,
        email: authUser.email,
        name: data?.name || authUser.user_metadata?.name || authUser.email.split('@')[0],
      });
    } catch {
      setUser({
        id: authUser.id,
        email: authUser.email,
        name: authUser.user_metadata?.name || authUser.email.split('@')[0],
      });
    } finally {
      setLoading(false);
    }
  }

  async function login(email, password) {
    if (!email || !password) return { error: 'Completa todos los campos.' };

    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function register(name, email, password) {
    if (!name || !email || !password) return { error: 'Completa todos los campos.' };
    if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { name } },
    });
    if (error) return { error: error.message };
    return { error: null };
  }

  async function logout() {
    await supabase.auth.signOut();
  }

  async function updateProfile(name) {
    const trimmed = name?.trim();
    if (!trimmed) return { error: 'El nombre no puede estar vacío.' };
    if (!user) return { error: 'No hay sesión activa.' };

    const { error } = await supabase
      .from('profiles')
      .update({ name: trimmed })
      .eq('id', user.id);

    if (error) return { error: error.message };

    setUser(prev => ({ ...prev, name: trimmed }));
    return { error: null };
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, logout, register, updateProfile }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
