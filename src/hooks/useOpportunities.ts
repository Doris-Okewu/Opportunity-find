import { useCallback, useEffect, useState } from 'react';
import type { Opportunity } from '../types/opportunity';
import { listPublishedOpportunities } from '../lib/queries/opportunities';
import { isExpired } from '../utils/date';

interface UseOpportunitiesResult {
  opportunities: Opportunity[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useOpportunities(): UseOpportunitiesResult {
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      try {
        const data = await listPublishedOpportunities();
        if (!cancelled) {
          setOpportunities(data.filter((opp) => !isExpired(opp.deadline)));
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Failed to load opportunities.');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [reloadToken]);

  const refetch = useCallback(() => setReloadToken((t) => t + 1), []);

  return { opportunities, loading, error, refetch };
}
