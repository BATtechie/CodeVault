import React from 'react'
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import SignIn from './pages/SignIn';
const App = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Navigate to="/sign-in" replace />} />
        <Route path="/sign-in" element={<SignIn/>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App