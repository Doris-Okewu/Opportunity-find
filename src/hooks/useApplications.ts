import { useEffect, useState } from 'react';
import { readApplications, subscribeApplications } from '../features/applications/applicationsStore';
import type { ApplicationRecord } from '../features/applications/applicationsStore';

export function useApplications(): ApplicationRecord[] {
  const [records, setRecords] = useState<ApplicationRecord[]>(() => readApplications());

  useEffect(() => subscribeApplications(() => setRecords(readApplications())), []);

  return records;
}
