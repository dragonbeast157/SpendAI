import { BrowserRouter as Router, Routes, Route } from "react-router-dom"
import { ThemeProvider } from "./components/ui/theme-provider"
import { Toaster } from "./components/ui/toaster"
import { AuthProvider } from "./contexts/AuthContext"
import { Login } from "./pages/Login"
import { Register } from "./pages/Register"
import { ProtectedRoute } from "./components/ProtectedRoute"
import { Layout } from "./components/Layout"
import { BlankPage } from "./pages/BlankPage"
import { Dashboard } from "./pages/Dashboard"
import { Onboarding } from "./pages/Onboarding"
import { TransactionManagement } from "./pages/TransactionManagement"
import { TransactionDetail } from "./pages/TransactionDetail"
import { PolicyManagement } from "./pages/PolicyManagement"
import { AnomalyDetection } from "./pages/AnomalyDetection"
import { AICoach } from "./pages/AICoach"
import { Analytics } from "./pages/Analytics"
import { Settings } from "./pages/Settings"

function App() {
  return (
  <AuthProvider>
    <ThemeProvider defaultTheme="light" storageKey="ui-theme">
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
          <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
            <Route index element={<Dashboard />} />
            <Route path="transactions" element={<TransactionManagement />} />
            <Route path="transactions/:id" element={<TransactionDetail />} />
            <Route path="policy" element={<PolicyManagement />} />
            <Route path="anomalies" element={<AnomalyDetection />} />
            <Route path="ai-coach" element={<AICoach />} />
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
          </Route>
          <Route path="*" element={<BlankPage />} />
        </Routes>
      </Router>
      <Toaster />
    </ThemeProvider>
  </AuthProvider>
  )
}

export default App