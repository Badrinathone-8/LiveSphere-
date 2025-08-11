import { useState } from 'react'
import {BrowserRouter as Router ,Routes,Route} from 'react-router-dom'
import Landing from "./pages/landing"
import Authentication from './pages/authentication'
import './App.css'
import axios from "axios"
import { useContext } from 'react'
import { AuthProvider } from './contexts/authContext';
import VedioComponent from './pages/vediomeet'
function App() {
//  const [count, setCount] = useState(0)

  return (
  
     <>
<Router>
  <AuthProvider>
  <Routes>
    <Route path="/" element={<Landing/>} />
    <Route path="/auth" element={<Authentication />}></Route>
    <Route path="/:url" element={<VedioComponent />}></Route>
  </Routes>
  </AuthProvider>
</Router>
     </>
  )
}

export default App
