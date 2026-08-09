import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SentryProvider } from './context/SentryContext';
import Layout from './components/Layout';
import ApprovalQueue from './pages/ApprovalQueue';
import AuditLog from './pages/AuditLog';
import Agents from './pages/Agents';
import BuilderAgents from './pages/BuilderAgents';
import AgentBuilderWizard from './pages/AgentBuilderWizard';
import AgentDetail from './pages/AgentDetail';
import BuilderTools from './pages/BuilderTools';
import BuilderDataSources from './pages/BuilderDataSources';

export default function App() {
  return (
    <BrowserRouter>
      <SentryProvider>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/approval-queue" replace />} />
            <Route path="/approval-queue" element={<ApprovalQueue />} />
            <Route path="/audit-log" element={<AuditLog />} />
            <Route path="/agents" element={<Agents />} />
            {/* Builder routes */}
            <Route path="/builder" element={<Navigate to="/builder/agents" replace />} />
            <Route path="/builder/agents" element={<BuilderAgents />} />
            <Route path="/builder/agents/new" element={<AgentBuilderWizard />} />
            <Route path="/builder/agents/:id" element={<AgentDetail />} />
            <Route path="/builder/tools" element={<BuilderTools />} />
            <Route path="/builder/data-sources" element={<BuilderDataSources />} />
          </Route>
        </Routes>
      </SentryProvider>
    </BrowserRouter>
  );
}