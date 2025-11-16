import React from 'react'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SignIn from './pages/SignIn';
import LandingPage from './pages/LandingPage';

const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/dashboard" element={<LandingPage />} />
        <Route path="/sign-in" element={<SignIn/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App