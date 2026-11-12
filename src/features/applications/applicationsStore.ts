// Locally stored application records ("My Applications"). Lives only in this
// browser's localStorage — never sent to the server. Statuses are reported by
// the user; "opened" means the Apply link was opened but the user has not
// yet confirmed they submitted an application.

export type ApplicationStatus = 'opened' | 'applied' | 'interviewing' | 'offer' | 'not_selected' | 'withdrawn';

export const APPLICATION_STATUSES: ApplicationStatus[] = [
  'opened',
  'applied',
  'interviewing',
  'offer',
  'not_selected',
  'withdrawn',
];

export const APPLICATION_STATUS_LABELS: Record<ApplicationStatus, string> = {
  opened: 'Link opened (not confirmed)',
  applied: 'Applied',
  interviewing: 'Interviewing',
  offer: 'Offer received',
  not_selected: 'Not selected',
  withdrawn: 'Withdrawn',
};

export interface ApplicationRecord {
  opportunityId: string;
  title: string;
  organization: string;
  applicationUrl: string;
  deadline: string | null;
  status: ApplicationStatus;
  notes: string;
  firstOpenedAt: string;
  updatedAt: string;
}

const STORAGE_KEY = 'opportunity-find-applications';
const CHANGE_EVENT = 'opportunity-find-applications-change';

function isRecord(value: unknown): value is ApplicationRecord {
  if (!value || typeof value !== 'object') return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.opportunityId === 'string' &&
    typeof v.title === 'string' &&
    typeof v.organization === 'string' &&
    typeof v.applicationUrl === 'string' &&
    typeof v.status === 'string' &&
    (APPLICATION_STATUSES as string[]).includes(v.status) &&
    typeof v.firstOpenedAt === 'string' &&
    typeof v.updatedAt === 'string'
  );
}

export function readApplications(): ApplicationRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(isRecord).map((r) => ({
      ...r,
      deadline: typeof r.deadline === 'string' ? r.deadline : null,
      notes: typeof r.notes === 'string' ? r.notes : '',
    }));
  } catch {
    return [];
  }
}

function writeApplications(records: ApplicationRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage full/unavailable — nothing more we can do locally.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

export interface OpportunitySnapshot {
  id: string;
  title: string;
  organization: string;
  application_url: string;
  deadline: string | null;
}

/**
 * Records that the Apply link was opened. Never downgrades an existing status.
 * Returns true when a new tracker entry was created.
 */
export function recordApplyOpened(opportunity: OpportunitySnapshot): boolean {
  const now = new Date().toISOString();
  const records = readApplications();
  const existing = records.find((r) => r.opportunityId === opportunity.id);
  if (existing) {
    // Refresh listing details in case the admin edited them.
    existing.title = opportunity.title;
    existing.organization = opportunity.organization;
    existing.applicationUrl = opportunity.application_url;
    existing.deadline = opportunity.deadline;
    writeApplications(records);
    return false;
  }
  writeApplications([
    {
      opportunityId: opportunity.id,
      title: opportunity.title,
      organization: opportunity.organization,
      applicationUrl: opportunity.application_url,
      deadline: opportunity.deadline,
      status: 'opened',
      notes: '',
      firstOpenedAt: now,
      updatedAt: now,
    },
    ...records,
  ]);
  return true;
}

export function updateApplication(
  opportunityId: string,
  changes: Partial<Pick<ApplicationRecord, 'status' | 'notes'>>,
): void {
  const records = readApplications();
  const target = records.find((r) => r.opportunityId === opportunityId);
  if (!target) return;
  Object.assign(target, changes, { updatedAt: new Date().toISOString() });
  writeApplications(records);
}

export function removeApplication(opportunityId: string): void {
  writeApplications(readApplications().filter((r) => r.opportunityId !== opportunityId));
}

/** Subscribe to changes from this tab and other tabs. Returns an unsubscribe fn. */
export function subscribeApplications(listener: () => void): () => void {
  const onStorage = (e: StorageEvent) => {
    if (e.key === STORAGE_KEY || e.key === null) listener();
  };
  window.addEventListener(CHANGE_EVENT, listener);
  window.addEventListener('storage', onStorage);
  return () => {
    window.removeEventListener(CHANGE_EVENT, listener);
    window.removeEventListener('storage', onStorage);
  };
}
