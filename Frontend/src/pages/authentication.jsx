// src/components/Authentication.jsx
import React, { useState, useContext } from "react";
import { useNavigate } from "react-router-dom";
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  Box,
  Container,
  Snackbar,
} from "@mui/material";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { AuthContext } from "../contexts/authContext";

const theme = createTheme();

export default function Authentication() {
  const { handleRegister, handleLogin } = useContext(AuthContext);
  const navigate = useNavigate();

  const [form, setForm] = useState(0); // 0 = login, 1 = signup
  const [name, setName] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [open, setOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (form === 1) {
        const msg = await handleRegister(name, username, password);
        setMessage(msg || "Registered successfully");
        setName("");
        setUsername("");
        setPassword("");
        setOpen(true);
        setForm(0);
      } else {
        const msg = await handleLogin(username, password);
        setMessage(msg || "Login successful");
        setUsername("");
        setPassword("");
        setOpen(true);
        navigate("/videomeet"); // redirect to video page
      }
    } catch (err) {
      setMessage(err.message);
      setOpen(true);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: "secondary.main" }}>
            <LockOutlinedIcon />
          </Avatar>

          <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
            <Button
              onClick={() => setForm(0)}
              variant={form === 0 ? "contained" : "outlined"}
            >
              Login
            </Button>
            <Button
              onClick={() => setForm(1)}
              variant={form === 1 ? "contained" : "outlined"}
            >
              Signup
            </Button>
          </Box>

          <Box component="form" noValidate sx={{ mt: 1 }} onSubmit={handleSubmit}>
            {form === 1 && (
              <TextField
                margin="normal"
                required
                fullWidth
                label="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" fullWidth variant="contained" sx={{ mt: 3, mb: 2 }}>
              Submit
            </Button>

            <Snackbar
              open={open}
              autoHideDuration={4000}
              onClose={() => setOpen(false)}
              message={message}
            />
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
