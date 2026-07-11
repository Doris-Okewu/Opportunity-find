import { Navigate, Outlet } from 'react-router-dom';
import { useAdminSession } from '../../lib/auth/adminAuth';
import Spinner from '../ui/Spinner';

export default function AdminGuard() {
  const { session, isAdmin, loading } = useAdminSession();

  if (loading) {
    return (
      <div className="flex flex-1 items-center justify-center py-24">
        <Spinner className="h-6 w-6 text-indigo-600" />
      </div>
    );
  }

  if (!session || !isAdmin) {
    return <Navigate to="/admin/login" replace />;
  }

  return <Outlet />;
}
