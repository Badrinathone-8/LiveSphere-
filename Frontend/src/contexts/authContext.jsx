// src/contexts/authContext.jsx
import React, { createContext, useState, useEffect } from "react";
import axios from "axios";

export const AuthContext = createContext();

const client = axios.create({
  baseURL: "https://livesphere-backend-1sod.onrender.com/api/v1",
});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  // Persist user on page load
  useEffect(() => {
    const stored = localStorage.getItem("user");
    if (stored) setUser(JSON.parse(stored));
  }, []);

  const handleRegister = async (name, username, password) => {
    try {
      console.log("Sending register request:", name, username, password);

      const result = await client.post("/register", {
        name,
        username,
        password,
      });

      if (result.status === 201) {
        return result.data.message;
      }
    } catch (err) {
      throw err;
    }
  };

  const handleLogin = async (username, password) => {
    try {
      const result = await client.post("/login", { username, password });

      if (result.status === 200) {
        const userData = { username, token: result.data.token };
        setUser(userData);
        localStorage.setItem("user", JSON.stringify(userData));
        return result.data.message;
      }
    } catch (err) {
      if (err.response) throw new Error(err.response.data.message);
      else throw new Error("Network error");
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("user");
  };

  const data = { user, handleRegister, handleLogin, handleLogout };

  return <AuthContext.Provider value={data}>{children}</AuthContext.Provider>;
};
