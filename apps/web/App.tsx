import React from 'react';
import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { Alert } from './types';
import { AuthenticatedLayout } from './src/layouts/AuthenticatedLayout';
import { RequireAuth } from './src/auth/guards';
import { LoginPage } from './src/pages/LoginPage';
import { AcceptInvitePage } from './src/pages/AcceptInvitePage';
import { Placeholder } from './src/pages/Placeholder';
import { ProcurementMISPage } from './src/pages/ProcurementMISPage';
import { InventoryMISPage } from './src/pages/InventoryMISPage';
import { InventoryForecastPage } from './src/pages/InventoryForecastPage';
import { CustomDashboardPage } from './src/pages/CustomDashboardPage';
import { ReportsPage } from './src/pages/ReportsPage';
import { ConnectorsPage } from './src/pages/ConnectorsPage';
import { AdminPage } from './src/pages/AdminPage';
import { SapMappingPage } from './src/pages/SapMappingPage';

import { ChatInterface } from './components/ChatInterface';
import { ScenarioBuilder } from './components/ScenarioBuilder';
import { LiveVoiceAgent } from './components/LiveVoiceAgent';
import { ActionCenter } from './components/ActionCenter';
import { LandingPage } from './components/LandingPage';
import { ForecastDashboard } from './components/ForecastDashboard';

/** Bridge the legacy prop-based navigation to react-router. */
function useActionNav() {
  const navigate = useNavigate();
  return (type: string, alert: Alert) =>
    navigate('/action-center', { state: { type, alert } });
}

const HomeRoute: React.FC = () => {
  const navigate = useNavigate();
  const goAction = useActionNav();
  return (
    <LandingPage
      onNavigateToDashboard={() => navigate('/dashboard')}
      onNavigateToAction={goAction}
    />
  );
};

const ActionCenterRoute: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation() as any;
  const { type = '', alert = null } = location.state || {};
  return (
    <ActionCenter
      actionType={type}
      alert={alert}
      onBack={() => navigate('/dashboard')}
      onComplete={() => navigate('/dashboard')}
    />
  );
};

const App: React.FC = () => {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/accept-invite" element={<AcceptInvitePage />} />

      <Route
        element={
          <RequireAuth>
            <AuthenticatedLayout />
          </RequireAuth>
        }
      >
        <Route path="/home" element={<HomeRoute />} />
        <Route path="/dashboard" element={<Navigate to="/procurement" replace />} />
        <Route path="/procurement" element={<ProcurementMISPage />} />
        <Route path="/my-dashboard" element={<CustomDashboardPage />} />
        <Route path="/inventory" element={<InventoryMISPage />} />
        <Route path="/forecast-inventory" element={<InventoryForecastPage />} />
        <Route path="/reports" element={<ReportsPage />} />
        <Route path="/sap-mapping" element={<SapMappingPage />} />
        <Route path="/forecast" element={<ForecastDashboard />} />
        <Route path="/scenario" element={<ScenarioBuilder />} />
        <Route path="/chat" element={<ChatInterface />} />
        <Route path="/voice" element={<LiveVoiceAgent />} />
        <Route path="/action-center" element={<ActionCenterRoute />} />
        <Route path="/connectors" element={<ConnectorsPage />} />
        <Route path="/admin" element={<AdminPage />} />
        <Route
          path="/onboarding"
          element={
            <Placeholder
              title="Onboarding"
              note="Guided setup wizard for a new organization's first data source."
            />
          }
        />
      </Route>

      <Route path="/" element={<Navigate to="/procurement" replace />} />
      <Route path="*" element={<Navigate to="/procurement" replace />} />
    </Routes>
  );
};

export default App;
