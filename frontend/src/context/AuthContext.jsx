import { createContext, useContext, useEffect, useState } from 'react';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('careerforge_user');
    const token = localStorage.getItem('careerforge_token');

    if (storedUser && token) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (error) {
        console.error('Failed to restore user session:', error);

        localStorage.removeItem('careerforge_user');
        localStorage.removeItem('careerforge_token');
      }
    }

    setLoading(false);
  }, []);

  function login(userData, token) {
    localStorage.setItem(
      'careerforge_token',
      token
    );

    localStorage.setItem(
      'careerforge_user',
      JSON.stringify(userData)
    );

    setUser(userData);
  }

  function logout() {
    localStorage.removeItem('careerforge_token');
    localStorage.removeItem('careerforge_user');

    setUser(null);
  }

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    login,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}