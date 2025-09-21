import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../contexts/authContext";
import { Button, TextField } from "@mui/material";

export default function Authentication() {
  const { user, handleRegister, handleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState(0); // 0=login, 1=signup
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // If user is already logged in, redirect automatically
  useEffect(() => {
    if (user) navigate("/videomeet");
  }, [user]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form === 0) {
        await handleLogin(username, password);
      } else {
        await handleRegister(name, username, password);
        setForm(0); // after signup go to login
      }
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div style={{ padding: 16 }}>
      <h2>{form === 0 ? "Login" : "Signup"}</h2>
      {form === 1 && (
        <TextField label="Full Name" value={name} onChange={(e) => setName(e.target.value)} />
      )}
      <TextField label="Username" value={username} onChange={(e) => setUsername(e.target.value)} />
      <TextField label="Password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
      <Button onClick={handleSubmit}>{form === 0 ? "Login" : "Signup"}</Button>
      <Button onClick={() => setForm(form === 0 ? 1 : 0)}>
        {form === 0 ? "Go to Signup" : "Go to Login"}
      </Button>
    </div>
  );
}
