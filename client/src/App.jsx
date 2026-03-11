import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './components/common/ProtectedRoute';
import AdminLayout from './components/layout/AdminLayout';
import VoterLayout from './components/layout/VoterLayout';

// Public pages
import LandingPage from './pages/public/LandingPage';
import PublicResults from './pages/public/PublicResults';
import ContestantLookup from './pages/public/ContestantLookup';
import VerifyVote from './pages/public/VerifyVote';

// Auth pages
import AdminLogin from './pages/auth/AdminLogin';
import VoterLogin from './pages/auth/VoterLogin';

// Voter pages
import BallotPage from './pages/voter/BallotPage';
import ReviewPage from './pages/voter/ReviewPage';
import PaidVotePage from './pages/voter/PaidVotePage';
import ThankYouPage from './pages/voter/ThankYouPage';

// Admin pages
import Dashboard from './pages/admin/Dashboard';
import ElectionList from './pages/admin/ElectionList';
import ElectionCreate from './pages/admin/ElectionCreate';
import ElectionEdit from './pages/admin/ElectionEdit';
import ElectionDetail from './pages/admin/ElectionDetail';
import CandidateManage from './pages/admin/CandidateManage';
import PositionManage from './pages/admin/PositionManage';
import VoterManage from './pages/admin/VoterManage';
import LiveResults from './pages/admin/LiveResults';
import PaymentManage from './pages/admin/PaymentManage';
import StudentManage from './pages/admin/StudentManage';
import AuditLog from './pages/admin/AuditLog';
import Analytics from './pages/admin/Analytics';
import Templates from './pages/admin/Templates';
import Messages from './pages/admin/Messages';
import AdminManage from './pages/admin/AdminManage';
import NotFoundPage from './pages/public/NotFoundPage';

export default function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/election/:id/results" element={<PublicResults />} />
      <Route path="/lookup" element={<ContestantLookup />} />
      <Route path="/lookup/:electionId" element={<ContestantLookup />} />
      <Route path="/verify" element={<VerifyVote />} />
      <Route path="/verify/:hash" element={<VerifyVote />} />

      {/* Voter Auth + Voting */}
      <Route path="/vote/:electionId" element={<VoterLayout />}>
        <Route index element={<VoterLogin />} />
        <Route path="ballot" element={<ProtectedRoute role="voter"><BallotPage /></ProtectedRoute>} />
        <Route path="review" element={<ProtectedRoute role="voter"><ReviewPage /></ProtectedRoute>} />
        <Route path="thank-you" element={<ThankYouPage />} />
      </Route>
      <Route path="/vote/:electionId/paid" element={<PaidVotePage />} />

      {/* Admin Auth */}
      <Route path="/admin/login" element={<AdminLogin />} />

      {/* Admin Panel */}
      <Route path="/admin" element={<ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="elections" element={<ElectionList />} />
        <Route path="elections/create" element={<ElectionCreate />} />
        <Route path="elections/:id" element={<ElectionDetail />} />
        <Route path="elections/:id/edit" element={<ElectionEdit />} />
        <Route path="elections/:id/candidates" element={<CandidateManage />} />
        <Route path="elections/:id/positions" element={<PositionManage />} />
        <Route path="elections/:id/voters" element={<VoterManage />} />
        <Route path="elections/:id/results" element={<LiveResults />} />
        <Route path="elections/:id/payments" element={<PaymentManage />} />
        <Route path="elections/:id/analytics" element={<Analytics />} />
        <Route path="students" element={<StudentManage />} />
        <Route path="templates" element={<Templates />} />
        <Route path="announcements" element={<Messages />} />
        <Route path="elections/:id/messages" element={<Messages />} />
        <Route path="audit" element={<AuditLog />} />
        <Route path="users" element={<AdminManage />} />
      </Route>

      {/* 404 catch-all */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  );
}
