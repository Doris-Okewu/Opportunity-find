import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AdminGuard from './components/admin/AdminGuard';
import LandingPage from './pages/LandingPage';
import OpportunitiesPage from './pages/OpportunitiesPage';
import OpportunityDetailPage from './pages/OpportunityDetailPage';
import OnboardingPage from './pages/OnboardingPage';
import RecommendationsPage from './pages/RecommendationsPage';
import AdminLoginPage from './pages/admin/AdminLoginPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import AdminOpportunityFormPage from './pages/admin/AdminOpportunityFormPage';
import NotFoundPage from './pages/NotFoundPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<LandingPage />} />
          <Route path="opportunities" element={<OpportunitiesPage />} />
          <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
          <Route path="onboarding" element={<OnboardingPage />} />
          <Route path="recommendations" element={<RecommendationsPage />} />
          <Route path="admin/login" element={<AdminLoginPage />} />
          <Route element={<AdminGuard />}>
            <Route path="admin" element={<AdminDashboardPage />} />
            <Route path="admin/opportunities/new" element={<AdminOpportunityFormPage />} />
            <Route path="admin/opportunities/:id/edit" element={<AdminOpportunityFormPage />} />
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
