import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuthStore } from './store/authStore'

// Layouts
import RootLayout from './app/layout/RootLayout'

// Pages
import LoginPage from './app/auth/LoginPage'
import VerifyPage from './app/auth/VerifyPage'
import DashboardPage from './app/dashboard/DashboardPage'
import UploadPage from './app/upload/UploadPage'
import BacktestPage from './app/backtest/BacktestPage'
import ResultPage from './app/backtest/ResultPage'

function App() {
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)

  return (
    <Routes>
      <Route path="/" element={<RootLayout />}>
        {/* Public routes */}
        <Route
          index
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="login"
          element={
            isAuthenticated ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <LoginPage />
            )
          }
        />
        
        <Route path="verify" element={<VerifyPage />} />

        {/* Protected routes */}
        <Route
          path="dashboard"
          element={
            isAuthenticated ? (
              <DashboardPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="upload"
          element={
            isAuthenticated ? (
              <UploadPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="backtest"
          element={
            isAuthenticated ? (
              <BacktestPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        <Route
          path="backtest/result/:id"
          element={
            isAuthenticated ? (
              <ResultPage />
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        
        {/* Catch-all redirect */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  )
}

export default App
