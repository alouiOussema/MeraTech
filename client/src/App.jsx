import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { AccessibilityProvider } from './context/AccessibilityContext';
import { VoiceProvider } from './context/VoiceContext';
import Layout from './layout/Layout';
import { setupAxiosInterceptors } from './lib/api';
import VoiceAssistant from './components/VoiceAssistant';
import VoiceOperator from './assistant/VoiceOperator';
import AccessibleControls from './components/AccessibleControls';

// Pages
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import Banque from './pages/Banque';
import Courses from './pages/Courses';
import Settings from './pages/Settings';

// Axios Interceptor Setup Component
function AxiosSetup() {
  const { getToken } = useAuth();
  React.useEffect(() => {
    setupAxiosInterceptors(getToken);
  }, [getToken]);
  return null;
}

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

            {/* Protected/App Routes */}
            <Route path="/" element={
              <Layout>
                <Landing />
              </Layout>
            } />
            
            <Route path="/banque" element={
              <Layout>
                <Banque />
              </Layout>
            } />
            
            <Route path="/courses" element={
              <Layout>
                <Courses />
              </Layout>
            } />
            
            <Route path="/settings" element={
              <Layout>
                <Settings />
              </Layout>
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