import { createContext, useContext, useState, useEffect } from "react";
import * as authService from "../services/authService";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On first load, if a token exists, verify it's still valid by fetching the user
  useEffect(() => {
    const token = localStorage.getItem("smartstay_token");
    if (!token) {
      setLoading(false);
      return;
    }

    authService
      .getMe()
      .then((data) => setUser(data.user))
      .catch(() => {
        localStorage.removeItem("smartstay_token");
        localStorage.removeItem("smartstay_user");
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const data = await authService.login({ email, password });
    localStorage.setItem("smartstay_token", data.token);
    localStorage.setItem("smartstay_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const signup = async (payload) => {
    const data = await authService.signup(payload);
    localStorage.setItem("smartstay_token", data.token);
    localStorage.setItem("smartstay_user", JSON.stringify(data.user));
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    localStorage.removeItem("smartstay_token");
    localStorage.removeItem("smartstay_user");
    setUser(null);
  };

  // Called after a successful profile update (PUT /auth/me) so the rest of
  // the app (name in the topbar, etc.) reflects the change immediately.
  const updateUser = (updatedUser) => {
    localStorage.setItem("smartstay_user", JSON.stringify(updatedUser));
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, signup, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within an AuthProvider");
  return ctx;
}
