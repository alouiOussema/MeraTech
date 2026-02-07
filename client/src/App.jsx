import React from 'react';
import { Route, BrowserRouter as Router, Routes, Navigate } from 'react-router-dom';
import VoiceOperator from './assistant/VoiceOperator';
import AccessibleControls from './components/AccessibleControls';
import VoiceAssistant from './components/VoiceAssistant';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { useAuth } from './context/AuthContext';
import { VoiceProvider } from './context/VoiceContext';
import Layout from './layout/Layout';
import { setupAxiosInterceptors } from './lib/api';

// Pages
import Banque from './pages/Banque';

import Landing from './pages/Landing';
import Login from './pages/Login';
import Products from './pages/Products';
import Profile from './pages/Profile';
import Register from './pages/Register';
import Settings from './pages/Settings';

// Axios Interceptor Setup Component
function AxiosSetup() {
  const { getToken } = useAuth();
  React.useEffect(() => {
    setupAxiosInterceptors(getToken);
  }, [getToken]);
  return null;
}

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoaded } = useAuth();
  
  if (!isLoaded) {
    return <div className="min-h-screen flex items-center justify-center">تحميل...</div>;
  }
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

function App() {
  return (
    <AccessibilityProvider>
      <AxiosSetup />
      <Router>
        <VoiceProvider>
          <Routes>
            {/* Public Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/" element={
              <Layout>
                <Landing />
              </Layout>
            } />
            <Route path="/products" element={
              <Layout>
                <Products />
              </Layout>
            } />

            {/* Protected/App Routes */}
            <Route path="/banque" element={
              <ProtectedRoute>
                <Layout>
                  <Banque />
                </Layout>
              </ProtectedRoute>
            } />
            
            <Route path="/settings" element={
              <ProtectedRoute>
                <Layout>
                  <Settings />
                </Layout>
              </ProtectedRoute>
            } />

            <Route path="/profile" element={
              <ProtectedRoute>
                <Layout>
                  <Profile />
                </Layout>
              </ProtectedRoute>
            } />
          </Routes>
          
          {/* Global Voice Assistant UI */}
          <VoiceOperator />
          <VoiceAssistant />
          <AccessibleControls />
          
        </VoiceProvider>
      </Router>
    </AccessibilityProvider>
  );
}

export default App;
