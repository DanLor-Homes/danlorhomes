import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import UserNotRegisteredError from '@/components/UserNotRegisteredError';
import ScrollToTop from './components/ScrollToTop';
import { Navigate } from 'react-router-dom';
import ProtectedRoute from '@/components/ProtectedRoute';
import Layout from '@/components/Layout';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';
import Dashboard from '@/pages/Dashboard';
import Pipeline from '@/pages/Pipeline';
import Properties from '@/pages/Properties';
import Tasks from '@/pages/Tasks';
import Leads from '@/pages/Leads';
import CalendarPage from '@/pages/Calendar';
import VideoCalls from '@/pages/VideoCalls';
import Reports from '@/pages/Reports';
import Channels from '@/pages/Channels';
import Archive from '@/pages/Archive';
import Ajustes from '@/pages/Ajustes';
import Portales from '@/pages/Portales';
import Particulares from '@/pages/Particulares';
import Owners from '@/pages/Owners';
import Captacion from '@/pages/Captacion';
import WebListings from '@/pages/WebListings';
import Contracts from '@/pages/Contracts';
import PropertySheet from '@/pages/PropertySheet';
import PropertyPanel from '@/pages/Panel';
import Valuation from '@/pages/Valuation';
import Mail from '@/pages/Mail';
import Mortgages from '@/pages/Mortgages';

const AuthenticatedApp = () => {
  const { isLoadingAuth, isLoadingPublicSettings, authError, navigateToLogin } = useAuth();

  // Show loading spinner while checking app public settings or auth
  if (isLoadingPublicSettings || isLoadingAuth) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-border border-t-primary"></div>
      </div>
    );
  }

  // Handle authentication errors
  if (authError) {
    if (authError.type === 'user_not_registered') {
      return <UserNotRegisteredError />;
    } else if (authError.type === 'auth_required') {
      // Redirect to login automatically
      navigateToLogin();
      return null;
    }
  }

  // Render the main app
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/captacion" element={<Captacion />} />
      <Route path="/web" element={<WebListings />} />
      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/panel" element={<PropertyPanel />} />
        <Route path="/inmuebles/:id/ficha" element={<PropertySheet />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/pipeline" element={<Pipeline />} />
          <Route path="/inmuebles" element={<Properties />} />
          <Route path="/tasacion" element={<Valuation />} />
          <Route path="/hipotecas" element={<Mortgages />} />
          <Route path="/correo" element={<Mail />} />
          <Route path="/contratos" element={<Contracts />} />
          <Route path="/propietarios" element={<Owners />} />
          <Route path="/portales" element={<Portales />} />
          <Route path="/particulares" element={<Particulares />} />
          <Route path="/tareas" element={<Tasks />} />
          <Route path="/leads" element={<Leads />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/videollamadas" element={<VideoCalls />} />
          <Route path="/informes" element={<Reports />} />
          <Route path="/canales" element={<Channels />} />
          <Route path="/archivo" element={<Archive />} />
          <Route path="/ajustes" element={<Ajustes />} />
        </Route>
      </Route>
      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};


function App() {

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <ScrollToTop />
          <AuthenticatedApp />
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App