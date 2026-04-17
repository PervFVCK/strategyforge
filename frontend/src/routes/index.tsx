import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import RegisterPage from '../pages/auth/RegisterPage';
import VerifyOtpPage from '../pages/auth/VerifyOtpPage';
import SetPinPage from '../pages/auth/SetPinPage';
import LoginPage from '../pages/auth/LoginPage';
import ForgotPasswordPage from '../pages/auth/ForgotPasswordPage';
import ResetPasswordPage from '../pages/auth/ResetPasswordPage';
import DashboardPage from '../pages/dashboard/DashboardPage';
import ProfilePage from '../pages/dashboard/ProfilePage';
import SettingsPage from '../pages/dashboard/SettingsPage';
import ChangePasswordPage from '../pages/dashboard/ChangePasswordPage';
import TransactionsPage from '../pages/dashboard/TransactionsPage';
import ProtectedRoute from '../components/layout/ProtectedRoute';
import ChangePinPage from '../pages/dashboard/ChangePinPage';

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Navigate to="/login" replace />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/verify-otp" element={<VerifyOtpPage />} />
        <Route path="/set-pin" element={<SetPinPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        
        {/* Protected Routes */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <DashboardPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/transactions"
          element={
            <ProtectedRoute>
              <TransactionsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <SettingsPage />
            </ProtectedRoute>
          }
        />
        <Route
          path="/change-password"
          element={
            <ProtectedRoute>
              <ChangePasswordPage />
            </ProtectedRoute>
          }
        />
	<Route
           path="/change-pin"
           element={
             <ProtectedRoute>
               <ChangePinPage />
             </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}
