import * as React from 'react';
import { useState } from 'react';
import {
  Avatar,
  Button,
  CssBaseline,
  TextField,
  FormControlLabel,
  Checkbox,
  Link,
  Grid,
  Box,
  Container,
  Snackbar,
} from '@mui/material';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { AuthContext } from '../contexts/authContext';
import {useContext} from "react"
import { useNavigate } from 'react-router-dom';

const theme = createTheme();

export default function Authentication() {

  let [form, setForm] = React.useState(0);
  let [name, setName] = React.useState("");
  let [message, setMessage] = React.useState("");
  let [password,setPassword]=useState("")
  let [username,setUsername]=useState("")
  let [open, setOpen] = React.useState(false);
  let [error, setError] = useState("");
 const {handleRegister,handleLogin}=useContext(AuthContext);

const router=useNavigate();
const handleSubmit=async(e)=>{
  e.preventDefault();
  try{
    if(form==1){
      const msg=await handleRegister(name,username,password);
      setMessage(msg||"Rigisterd succesfully");
      setName("");
      setUsername("");
      setPassword("");
      setOpen(true);
   setForm(0);
    }else{
      const msg=await handleLogin(username,password);
      setMessage(msg||"logged in");
      setMessage(msg||"Login Sucessfull");
      setUsername("");
      setPassword("");
      setOpen(true);
      router("/")
      console.log(message);
    }
  }catch(err){
    setError(err);
    console.log(error);
    
  }
  
}

   
  return (
    <ThemeProvider theme={theme}>
      <Container component="main" maxWidth="xs">
        <CssBaseline />
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'secondary.main' }}>
            <LockOutlinedIcon />
          </Avatar>

          {/* Form Toggle Buttons */}

          <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
            <Button onClick={() => setForm(0)}  variant={form === 0 ? "contained" : ""}>Login</Button>
            <Button onClick={() => setForm(1)} variant={form === 1? "contained" : ""}>Signup</Button>

          </Box>

          <Box component="form" noValidate sx={{ mt: 1 }} onSubmit={handleSubmit}>
            {/* Optional Fullname Field */}

              {form===1 ?
                
             <TextField
              margin="normal"
              required
              fullWidth
              id="fullname"
               onChange={(e)=>setName(e.target.value)}
              label="Full Name"
              name="fullname"
              value={name}
              autoComplete="name"
            />
              
          
              :<></>} 
              <>

            <TextField
              margin="normal"
              required
              fullWidth
              id="username"
               onChange={(e)=>setUsername(e.target.value)}
              label="Username"
              name="username"
              value={username}
              autoComplete="username"
            />

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
                onChange={(e)=>setPassword(e.target.value)}
              label="Password"
              type="password"
              value={password}
              id="password"
              autoComplete="current-password"
            /></>
             
                 

            
            

            <FormControlLabel
              control={<Checkbox value="remember" color="primary" />}
              label="Remember me"
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2 }}
            >
              Submit
            </Button>

            <Grid container>
              <Grid item xs>
                <Link href="#" variant="body2">
                  Forgot password?
                </Link>
              </Grid>
              <Grid item>
                <Link href="#" variant="body2">
                  {"Don't have an account? Sign Up"}
                </Link>
              </Grid>
            </Grid>
            <Snackbar
              open={open}
            autoHideDuration={4000}
              message={message}>
            </Snackbar>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
}
