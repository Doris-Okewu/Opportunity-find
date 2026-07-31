import Select from '../ui/Select';
import TextInput from '../ui/Input';
import Button from '../ui/Button';
import { CAREER_PATHS } from '../../features/careerEngine/careerPaths';
import { OPPORTUNITY_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '../../types/opportunity';
import { DEFAULT_FILTERS, type OpportunityFilters } from './filters';

export default function FilterBar({
  filters,
  onChange,
}: {
  filters: OpportunityFilters;
  onChange: (filters: OpportunityFilters) => void;
}) {
  const hasActiveFilters =
    filters.search !== '' ||
    filters.type !== 'all' ||
    filters.careerTag !== 'all' ||
    filters.experienceLevel !== 'all' ||
    filters.remote !== 'all';

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-4 shadow-sm">
      <TextInput
        type="search"
        placeholder="Search by title, organization, or keyword..."
        value={filters.search}
        onChange={(e) => onChange({ ...filters, search: e.target.value })}
        aria-label="Search opportunities"
      />

      <div>
        <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-3">Filters</p>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Select
          value={filters.type}
          onChange={(e) => onChange({ ...filters, type: e.target.value as OpportunityFilters['type'] })}
          aria-label="Filter by type"
        >
          <option value="all">All types</option>
          {Object.entries(OPPORTUNITY_TYPE_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.careerTag}
          onChange={(e) => onChange({ ...filters, careerTag: e.target.value })}
          aria-label="Filter by career path"
        >
          <option value="all">All career paths</option>
          {CAREER_PATHS.map((path) => (
            <option key={path.slug} value={path.slug}>
              {path.label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.experienceLevel}
          onChange={(e) =>
            onChange({ ...filters, experienceLevel: e.target.value as OpportunityFilters['experienceLevel'] })
          }
          aria-label="Filter by experience level"
        >
          <option value="all">All levels</option>
          {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </Select>

        <Select
          value={filters.remote}
          onChange={(e) => onChange({ ...filters, remote: e.target.value as OpportunityFilters['remote'] })}
          aria-label="Filter by location type"
        >
          <option value="all">Remote & on-site</option>
          <option value="remote">Remote only</option>
          <option value="onsite">On-site only</option>
        </Select>
        </div>
      </div>

      {hasActiveFilters && (
        <div>
          <Button variant="ghost" className="px-2 py-1 text-xs" onClick={() => onChange(DEFAULT_FILTERS)}>
            Clear all filters
          </Button>
        </div>
      )}
    </div>
  );
}
