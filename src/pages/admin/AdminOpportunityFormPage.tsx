import { useEffect, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import type { OpportunityInput } from '../../types/opportunity';
import { createOpportunity, getOpportunityById, updateOpportunity } from '../../lib/queries/opportunities';
import OpportunityForm, { BLANK_OPPORTUNITY } from '../../components/admin/OpportunityForm';
import Spinner from '../../components/ui/Spinner';
import Card from '../../components/ui/Card';

export default function AdminOpportunityFormPage() {
  const { id } = useParams<{ id: string }>();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [initialValues, setInitialValues] = useState<OpportunityInput | null>(isEdit ? null : BLANK_OPPORTUNITY);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!isEdit || !id) return;
    getOpportunityById(id)
      .then((data) => {
        if (!data) {
          setLoadError('Opportunity not found.');
          return;
        }
        const { id: _id, created_at: _createdAt, updated_at: _updatedAt, ...rest } = data;
        setInitialValues(rest);
      })
      .catch((err) => setLoadError(err instanceof Error ? err.message : 'Failed to load opportunity.'));
  }, [id, isEdit]);

  async function handleSubmit(values: OpportunityInput) {
    setSubmitError(null);
    setSubmitting(true);
    try {
      if (isEdit && id) {
        await updateOpportunity(id, values);
      } else {
        await createOpportunity(values);
      }
      navigate('/admin');
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save opportunity.');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-4 py-10 sm:px-6">
      <Link to="/admin" className="mb-6 inline-block text-sm font-medium text-brand">
        &larr; Back to Dashboard
      </Link>

      <h1 className="mb-8 text-2xl font-bold text-ink">
        {isEdit ? 'Edit Opportunity' : 'New Opportunity'}
      </h1>

      {loadError && <p className="text-sm text-danger">{loadError}</p>}

      {!loadError && !initialValues && (
        <div className="flex justify-center py-16">
          <Spinner className="h-6 w-6 text-brand" />
        </div>
      )}

      {!loadError && initialValues && (
        <Card>
          <OpportunityForm
            initialValues={initialValues}
            onSubmit={handleSubmit}
            submitLabel={isEdit ? 'Save Changes' : 'Create Opportunity'}
            submitting={submitting}
            error={submitError}
          />
        </Card>
      )}
    </div>
  );
}
