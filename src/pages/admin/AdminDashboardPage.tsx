import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import type { Opportunity } from '../../types/opportunity';
import { listAllOpportunitiesForAdmin, updateOpportunity, deleteOpportunity } from '../../lib/queries/opportunities';
import { signOutAdmin } from '../../lib/auth/adminAuth';
import Button from '../../components/ui/Button';
import OpportunityTable from '../../components/admin/OpportunityTable';
import EmptyState from '../../components/opportunities/EmptyState';
import ErrorState from '../../components/opportunities/ErrorState';
import Spinner from '../../components/ui/Spinner';

export default function AdminDashboardPage() {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const data = await listAllOpportunitiesForAdmin();
      setOpportunities(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load opportunities.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function handleTogglePublish(opportunity: Opportunity) {
    setActionError(null);
    try {
      await updateOpportunity(opportunity.id, { is_published: !opportunity.is_published });
      setOpportunities((prev) =>
        prev.map((o) => (o.id === opportunity.id ? { ...o, is_published: !o.is_published } : o)),
      );
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to update opportunity.');
    }
  }

  async function handleDelete(opportunity: Opportunity) {
    if (!window.confirm(`Delete "${opportunity.title}"? This cannot be undone.`)) return;
    setActionError(null);
    try {
      await deleteOpportunity(opportunity.id);
      setOpportunities((prev) => prev.filter((o) => o.id !== opportunity.id));
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to delete opportunity.');
    }
  }

  return (
    <div className="mx-auto w-full max-w-6xl flex-1 px-4 py-10 sm:px-6">
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-ink">Admin Dashboard</h1>
          <p className="mt-1 text-sm text-ink-2">
            {loading ? 'Loading...' : `${opportunities.length} total opportunities`}
          </p>
        </div>
        <div className="flex gap-2">
          <Link to="/admin/opportunities/new">
            <Button>New Opportunity</Button>
          </Link>
          <Button variant="secondary" onClick={() => signOutAdmin()}>
            Sign Out
          </Button>
        </div>
      </div>

      {actionError && (
        <p className="mb-4 rounded-lg bg-danger/10 px-4 py-2 text-sm text-danger">
          {actionError}
        </p>
      )}

      {error && <ErrorState message={error} onRetry={load} />}

      {!error && loading && (
        <div className="flex justify-center py-24">
          <Spinner className="h-6 w-6 text-brand" />
        </div>
      )}

      {!error && !loading && opportunities.length === 0 && (
        <EmptyState
          title="No opportunities yet"
          description="Create your first opportunity to see it here."
          action={
            <Link to="/admin/opportunities/new">
              <Button>New Opportunity</Button>
            </Link>
          }
        />
      )}

      {!error && !loading && opportunities.length > 0 && (
        <OpportunityTable
          opportunities={opportunities}
          onTogglePublish={handleTogglePublish}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
