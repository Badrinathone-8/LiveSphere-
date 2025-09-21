import React from 'react'
import { createContext,useState,useContext } from 'react'

import axios from "axios"
export const AuthContext=createContext();
  const client=axios.create({
    baseURL:"https://livesphere-backend-1sod.onrender.com/api/v1"
  })
  export const AuthProvider=({children})=>{
const [user, setUser] = useState(() => {
  const stored = localStorage.getItem("user");
  return stored ? JSON.parse(stored) : null;
}); const handleRegister=async(name,username,password)=> {
  try{
                 console.log("Sending register request:", name, username, password);

    let result=await client.post("/register",{
    name:name,
    username:username,
    password:password,

  })
  if(result.status===201){
     return result.data.message;
  }
  }catch(err){
    throw err;
  }

 }
 const handleLogin=async(username,password)=>{
    try{

       let result=await client.post("/login",{
      username:username,
      password:password,
     })

     if(result.status===201){
      const userData = { username, token: result.data.token };
    setUser(userData);
    localStorage.setItem("user", JSON.stringify(userData)); // Save to localStorage
    return result.data.message;
     }
    }catch(err){
      throw err;
    }
 }

let data={
  user,userData,handleRegister,handleLogin
}

  return (
    <AuthContext.Provider value={data}>
      {children}
    </AuthContext.Provider>
  )
}
