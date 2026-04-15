import React, { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  function login(email, password) {
    if (!email || !password) return { error: 'Completa todos los campos.' };
    // Simulación: cualquier credencial válida inicia sesión
    setUser({ email, name: email.split('@')[0] });
    return { error: null };
  }

  function register(name, email, password) {
    if (!name || !email || !password) return { error: 'Completa todos los campos.' };
    if (password.length < 6) return { error: 'La contraseña debe tener al menos 6 caracteres.' };
    setUser({ email, name });
    return { error: null };
  }

  function logout() {
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
