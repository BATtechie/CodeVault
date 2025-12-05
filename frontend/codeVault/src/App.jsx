import React from 'react'
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import SignIn from './pages/SignIn';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import Footer from './components/Footer';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import Snippets from './pages/Snippets';

const AppContent = () => {
  const location = useLocation();
  const isSignInPage = location.pathname === '/sign-in';

  return (
    <>
      {!isSignInPage && <Navbar />}
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/sign-in" element={<SignIn/>} />
        <Route path="/home" element={<Home />} />
        <Route path="/snippets" element={<Snippets />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/profile" element={<Profile />} />
      </Routes>
      {!isSignInPage && <Footer />}
    </>
  );
};

const App = () => {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App