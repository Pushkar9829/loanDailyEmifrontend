import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from './lib/auth';
import Layout from './components/Layout';
import { Loading } from './components/ui';
import Login from './pages/Login';
import AdminDashboard from './pages/admin/Dashboard';
import SfDashboard from './pages/sf/Dashboard';
import AgentHome from './pages/agent/Home';
import CustomerHome from './pages/customer/Home';
import Users from './pages/common/Users';
import Properties from './pages/admin/Properties';
import Tiers from './pages/admin/Tiers';
import Settings from './pages/admin/Settings';
import Audit from './pages/admin/Audit';
import Draws from './pages/admin/Draws';
import Plans from './pages/common/Plans';
import NewPlan from './pages/common/NewPlan';
import PlanDetail from './pages/common/PlanDetail';
import Installments from './pages/common/Installments';
import Wallet from './pages/common/Wallet';
import Ledger from './pages/common/Ledger';
import Reports from './pages/common/Reports';
import Complaints from './pages/common/Complaints';
import Notifications from './pages/common/Notifications';
import Profile from './pages/common/Profile';
import Coupons from './pages/customer/Coupons';
import Messages from './pages/admin/Messages';
import Reconciliation from './pages/admin/Reconciliation';
import Lenders from './pages/admin/Lenders';
import Remittance from './pages/admin/Remittance';
import Receipt from './pages/print/Receipt';
import Statement from './pages/print/Statement';
import Kfs from './pages/print/Kfs';

const HOME = { admin: AdminDashboard, sf: SfDashboard, agent: AgentHome, customer: CustomerHome };

function Only({ roles, children }) {
  const { user } = useAuth();
  return roles.includes(user.role) ? children : <Navigate to="/" replace />;
}

export default function App() {
  const { user, ready } = useAuth();
  if (!ready) return <Loading />;
  if (!user) {
    return (
      <Routes>
        <Route path="*" element={<Login />} />
      </Routes>
    );
  }
  const Home = HOME[user.role];
  const staff = ['admin', 'sf', 'agent'];
  return (
    <Routes>
      {/* Printable pages, without the app chrome */}
      <Route path="receipts/:id" element={<Receipt />} />
      <Route path="plans/:id/statement" element={<Statement />} />
      <Route path="plans/:id/kfs" element={<Kfs />} />
      <Route element={<Layout />}>
        <Route index element={<Home />} />
        <Route path="users/:role" element={<Only roles={staff}><Users /></Only>} />
        <Route path="properties" element={<Only roles={['admin']}><Properties /></Only>} />
        <Route path="tiers" element={<Only roles={['admin']}><Tiers /></Only>} />
        <Route path="settings" element={<Only roles={['admin']}><Settings /></Only>} />
        <Route path="audit" element={<Only roles={['admin']}><Audit /></Only>} />
        <Route path="draws" element={<Only roles={['admin']}><Draws /></Only>} />
        <Route path="ledger" element={<Only roles={['admin']}><Ledger /></Only>} />
        <Route path="messages" element={<Only roles={['admin']}><Messages /></Only>} />
        <Route path="reconciliation" element={<Only roles={['admin']}><Reconciliation /></Only>} />
        <Route path="lenders" element={<Only roles={['admin']}><Lenders /></Only>} />
        <Route path="remittance" element={<Only roles={['admin']}><Remittance /></Only>} />
        <Route path="plans" element={<Only roles={staff}><Plans /></Only>} />
        <Route path="plans/new" element={<Only roles={staff}><NewPlan /></Only>} />
        <Route path="plans/:id" element={<PlanDetail />} />
        <Route path="installments" element={<Installments />} />
        <Route path="wallet" element={<Only roles={['sf', 'agent']}><Wallet /></Only>} />
        <Route path="reports" element={<Only roles={staff}><Reports /></Only>} />
        <Route path="coupons" element={<Coupons />} />
        <Route path="complaints" element={<Complaints />} />
        <Route path="notifications" element={<Notifications />} />
        <Route path="profile" element={<Profile />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Route>
    </Routes>
  );
}
