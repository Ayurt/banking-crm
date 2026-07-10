import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import LoginPage from '../pages/Login/LoginPage';
import DashboardLayout from '../components/layout/DashboardLayout';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import ConversationsPage from '../pages/Conversations/ConversationsPage';
import MessagesPage from '../pages/Dashboard/MessagesPage';
import AnalyticsPage from '../pages/Analytics/AnalyticsPage';
import RecommendationsPage from '../pages/Recommendations/RecommendationsPage';
import CustomersPage from '../pages/Customers/CustomersPage';
import CampaignsPage from '../pages/Campaigns/CampaignsPage';
import AuditPage from '../pages/Audit/AuditPage';
import SettingsPage from '../pages/Settings/SettingsPage';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated } = useAuth();
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" />;
}

export function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="agent" element={<ConversationsPage />} />
        <Route path="messages" element={<MessagesPage />} />
        <Route path="recommendations" element={<RecommendationsPage />} />
        <Route path="customers" element={<CustomersPage />} />
        <Route path="campaigns" element={<CampaignsPage />} />
        <Route path="audit" element={<AuditPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="settings" element={<SettingsPage />} />
      </Route>
    </Routes>
  );
}
