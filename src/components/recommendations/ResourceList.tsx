import type { LearningResource } from '../../features/careerEngine/types';

export default function ResourceList({ resources }: { resources: LearningResource[] }) {
  return (
    <ul className="divide-y divide-border rounded-xl border border-border">
      {resources.map((resource) => (
        <li key={resource.url}>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between gap-3 px-4 py-3 transition-colors hover:bg-surface-2"
          >
            <span className="min-w-0">
              <span className="block whitespace-normal break-normal text-sm font-medium text-ink">{resource.title}</span>
              <span className="block whitespace-normal break-normal text-xs text-ink-3">{resource.provider}</span>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4 shrink-0 text-ink-3">
              <path
                fillRule="evenodd"
                d="M5.22 14.78a.75.75 0 0 0 1.06 0l7.22-7.22v5.69a.75.75 0 0 0 1.5 0v-7.5a.75.75 0 0 0-.75-.75h-7.5a.75.75 0 0 0 0 1.5h5.69l-7.22 7.22a.75.75 0 0 0 0 1.06Z"
                clipRule="evenodd"
              />
            </svg>
          </a>
        </li>
      ))}
    </ul>
  );
}
