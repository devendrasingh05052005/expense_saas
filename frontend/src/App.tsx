import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import { NetworkProvider } from './context/NetworkContext';
import { AuthProvider } from './context/AuthContext';
import { GroupProvider } from './context/GroupContext';
import { ToastProvider } from './context/ToastContext';
import { ProtectedRoute } from './components/common/ProtectedRoute';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { PWAInstallModal } from './components/common/PWAInstallModal';

import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { VerifyOTP } from './pages/VerifyOTP';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import { Dashboard } from './pages/Dashboard';
import { IndividualExpensesPage } from './pages/IndividualExpensesPage';
import { CommonFundPage } from './pages/CommonFundPage';
import { SettlementsPage } from './pages/SettlementsPage';
import { MembersPage } from './pages/MembersPage';
import { SettingsPage } from './pages/SettingsPage';

export const App: React.FC = () => {
  return (
    <ThemeProvider>
      <NetworkProvider>
        <ToastProvider>
          <AuthProvider>
            <GroupProvider>
              <PWAInstallModal />
              <BrowserRouter>
                <Routes>
                  {/* Public Auth Routes */}
                  <Route path="/login" element={<Login />} />
                  <Route path="/register" element={<Register />} />
                  <Route path="/verify-otp" element={<VerifyOTP />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password" element={<ResetPassword />} />

                  {/* Protected SaaS App Routes */}
                  <Route
                    path="/"
                    element={
                      <ProtectedRoute>
                        <DashboardLayout />
                      </ProtectedRoute>
                    }
                  >
                    <Route index element={<Dashboard />} />
                    <Route path="expenses" element={<IndividualExpensesPage />} />
                    <Route path="fund" element={<CommonFundPage />} />
                    <Route path="settlements" element={<SettlementsPage />} />
                    <Route path="members" element={<MembersPage />} />
                    <Route path="settings" element={<SettingsPage />} />
                  </Route>

                  {/* Catch-all redirect */}
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </BrowserRouter>
            </GroupProvider>
          </AuthProvider>
        </ToastProvider>
      </NetworkProvider>
    </ThemeProvider>
  );
};

export default App;
