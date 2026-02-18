import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Search from './pages/Search';
import Ranking from './pages/Ranking';
import ServiceDetail from './pages/ServiceDetail';
import Settings from './pages/Settings';
import MyReviews from './pages/MyReviews';
import UserProfile from './pages/UserProfile';
import { SettingsProvider } from './contexts/SettingsContext';

import { AuthProvider } from './contexts/AuthContext';
import Login from './pages/Login';
import Onboarding from './pages/Onboarding';

// Simple component to handle onboarding check
const OnboardingGuard = ({ children }: { children: React.ReactNode }) => {
  const hasVisited = localStorage.getItem('hasVisited');
  if (!hasVisited) {
    return <Navigate to="/onboarding" replace />;
  }
  return children;
};

function App() {
  return (
    <SettingsProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-background text-foreground transition-colors duration-300">
            <Routes>
              <Route path="/onboarding" element={<Onboarding />} />
              <Route path="/auth" element={<Login />} />
              <Route path="/login" element={<Login />} />
              <Route path="/" element={
                <OnboardingGuard>
                  <Layout />
                </OnboardingGuard>
              }>
                <Route index element={<Dashboard />} />
                <Route path="search" element={<Search />} />
                <Route path="ranking" element={<Ranking />} />
                <Route path="service/:id" element={<ServiceDetail />} />
                <Route path="settings" element={<Settings />} />
                <Route path="settings/reviews" element={<MyReviews />} /> {/* Added MyReviews route */}
              </Route>

              {/* Public Routes with Layout but NO Onboarding Guard */}
              <Route element={<Layout />}>
                <Route path="user/:id" element={<UserProfile />} /> {/* Added UserProfile route */}
              </Route>
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </SettingsProvider>
  );
}

export default App;
