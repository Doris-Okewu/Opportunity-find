import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/layout/Layout';
import AdminGuard from './components/admin/AdminGuard';
import PasswordRecoveryListener from './components/auth/PasswordRecoveryListener';
import Spinner from './components/ui/Spinner';
import LandingPage from './pages/LandingPage';

// Landing is the most common entry point, so it stays eagerly bundled —
// lazy-loading it would only add a loading flash to the single most common
// page load. Every other route is code-split: each becomes its own chunk
// fetched on navigation, which is what actually reduces the initial bundle
// (Supabase admin queries, the AI insight flow, etc. no longer need to be
// downloaded before the landing page can render). Route paths and nesting
// are unchanged — only how the JS is loaded.
const OpportunitiesPage = lazy(() => import('./pages/OpportunitiesPage'));
const OpportunityDetailPage = lazy(() => import('./pages/OpportunityDetailPage'));
const OnboardingPage = lazy(() => import('./pages/OnboardingPage'));
const RecommendationsPage = lazy(() => import('./pages/RecommendationsPage'));
const AdminLoginPage = lazy(() => import('./pages/admin/AdminLoginPage'));
const AdminResetPasswordPage = lazy(() => import('./pages/admin/AdminResetPasswordPage'));
const AdminDashboardPage = lazy(() => import('./pages/admin/AdminDashboardPage'));
const AdminOpportunityFormPage = lazy(() => import('./pages/admin/AdminOpportunityFormPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));

function RouteFallback() {
  return (
    <div className="flex flex-1 items-center justify-center py-24">
      <Spinner className="h-6 w-6 text-brand" />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <PasswordRecoveryListener />
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route element={<Layout />}>
            <Route index element={<LandingPage />} />
            <Route path="opportunities" element={<OpportunitiesPage />} />
            <Route path="opportunities/:id" element={<OpportunityDetailPage />} />
            <Route path="onboarding" element={<OnboardingPage />} />
            <Route path="recommendations" element={<RecommendationsPage />} />
            <Route path="admin/login" element={<AdminLoginPage />} />
            <Route path="admin/reset-password" element={<AdminResetPasswordPage />} />
            <Route element={<AdminGuard />}>
              <Route path="admin" element={<AdminDashboardPage />} />
              <Route path="admin/opportunities/new" element={<AdminOpportunityFormPage />} />
              <Route path="admin/opportunities/:id/edit" element={<AdminOpportunityFormPage />} />
            </Route>
            <Route path="*" element={<NotFoundPage />} />
          </Route>
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
