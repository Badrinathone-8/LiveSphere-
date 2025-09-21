import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const client = axios.create({
  baseURL: "https://livesphere-backend-1sod.onrender.com/api/v1",
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null; // load saved user on app start
  });

  // Persist user across reloads
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleRegister = async (name, username, password) => {
    const result = await client.post("/register", { name, username, password });
    if (result.status === 201) return result.data.message;
  };

  const handleLogin = async (username, password) => {
    const result = await client.post("/login", { username, password });
    if (result.status === 200) {
      const userData = { username, token: result.data.token };
      setUser(userData);
      localStorage.setItem("user", JSON.stringify(userData)); // save in localStorage
      return result.data.message;
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user"); // clear login details
  };

  return (
    <AuthContext.Provider value={{ user, handleRegister, handleLogin, handleLogout }}>
      {children}
    </AuthContext.Provider>
  );
};
