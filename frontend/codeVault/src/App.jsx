import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import { AuthProvider } from './context/AuthContext';
import Dashboard from './pages/Dashboard';
import Home from './pages/Home';
import Profile from './pages/Profile';
import SignIn from './pages/SignIn';
import Snippets from './pages/Snippets';
import './App.css';

const AppLayout = () => {
  const location = useLocation();
  const isAuthPage = location.pathname === '/sign-in';
  const hideFooter = ['/dashboard', '/profile'].includes(location.pathname);

  return (
    <div className="app-shell">
      {!isAuthPage ? <Navbar /> : null}
      <main className={`app-main ${hideFooter ? 'app-main--workspace' : ''}`}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/home" element={<Home />} />
          <Route path="/sign-in" element={<SignIn />} />
          <Route path="/snippets" element={<Snippets />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <Profile />
              </ProtectedRoute>
            }
          />
        </Routes>
      </main>
      {!isAuthPage && !hideFooter ? <Footer /> : null}
    </div>
  );
};

const App = () => (
  <BrowserRouter>
    <AuthProvider>
      <AppLayout />
    </AuthProvider>
  </BrowserRouter>
);

export default App;
