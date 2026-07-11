import { useState } from 'react';
import type { FormEvent } from 'react';
import type { ExperienceLevel, OpportunityInput, OpportunityType } from '../../types/opportunity';
import { OPPORTUNITY_TYPE_LABELS, EXPERIENCE_LEVEL_LABELS } from '../../types/opportunity';
import { CAREER_PATHS } from '../../features/careerEngine/careerPaths';
import Input from '../ui/Input';
import Select from '../ui/Select';
import Textarea from '../ui/Textarea';
import Button from '../ui/Button';

export const BLANK_OPPORTUNITY: OpportunityInput = {
  title: '',
  organization: '',
  type: 'job',
  career_tags: [],
  required_skills: [],
  experience_level: 'entry',
  location: '',
  remote: false,
  description: '',
  application_url: '',
  deadline: null,
  is_published: true,
};

function toDateInputValue(deadline: string | null): string {
  if (!deadline) return '';
  return new Date(deadline).toISOString().slice(0, 10);
}

export default function OpportunityForm({
  initialValues,
  onSubmit,
  submitLabel,
  submitting,
  error,
}: {
  initialValues: OpportunityInput;
  onSubmit: (values: OpportunityInput) => void;
  submitLabel: string;
  submitting: boolean;
  error: string | null;
}) {
  const [values, setValues] = useState<OpportunityInput>(initialValues);
  const [skillsText, setSkillsText] = useState(initialValues.required_skills.join(', '));

  function update<K extends keyof OpportunityInput>(key: K, value: OpportunityInput[K]) {
    setValues((prev) => ({ ...prev, [key]: value }));
  }

  function toggleCareerTag(slug: string) {
    setValues((prev) => ({
      ...prev,
      career_tags: prev.career_tags.includes(slug)
        ? prev.career_tags.filter((t) => t !== slug)
        : [...prev.career_tags, slug],
    }));
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    onSubmit({
      ...values,
      required_skills: skillsText
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean),
      location: values.location?.trim() || null,
    });
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Title</label>
          <Input required value={values.title} onChange={(e) => update('title', e.target.value)} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Organization</label>
          <Input required value={values.organization} onChange={(e) => update('organization', e.target.value)} />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Type</label>
          <Select value={values.type} onChange={(e) => update('type', e.target.value as OpportunityType)}>
            {Object.entries(OPPORTUNITY_TYPE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Experience Level</label>
          <Select
            value={values.experience_level}
            onChange={(e) => update('experience_level', e.target.value as ExperienceLevel)}
          >
            {Object.entries(EXPERIENCE_LEVEL_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div>
        <label className="mb-2 block text-sm font-medium text-slate-900 dark:text-white">
          Career Paths <span className="font-normal text-slate-500">(select all that apply)</span>
        </label>
        <div className="flex flex-wrap gap-2">
          {CAREER_PATHS.map((path) => {
            const selected = values.career_tags.includes(path.slug);
            return (
              <button
                type="button"
                key={path.slug}
                onClick={() => toggleCareerTag(path.slug)}
                className={`rounded-full border px-3 py-1 text-xs font-medium transition ${
                  selected
                    ? 'border-indigo-600 bg-indigo-600 text-white'
                    : 'border-slate-300 text-slate-600 hover:border-slate-400 dark:border-slate-700 dark:text-slate-300'
                }`}
              >
                {path.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
          Required Skills <span className="font-normal text-slate-500">(comma-separated)</span>
        </label>
        <Input
          value={skillsText}
          onChange={(e) => setSkillsText(e.target.value)}
          placeholder="e.g. React, TypeScript, Git"
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Location</label>
          <Input
            value={values.location ?? ''}
            onChange={(e) => update('location', e.target.value)}
            placeholder="e.g. Lagos, Nigeria"
            disabled={values.remote}
          />
        </div>
        <div className="flex items-end gap-2 pb-2">
          <input
            id="remote"
            type="checkbox"
            checked={values.remote}
            onChange={(e) => update('remote', e.target.checked)}
            className="h-4 w-4 rounded border-slate-300"
          />
          <label htmlFor="remote" className="text-sm font-medium text-slate-900 dark:text-white">
            This is a remote opportunity
          </label>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">Description</label>
        <Textarea
          required
          rows={5}
          value={values.description}
          onChange={(e) => update('description', e.target.value)}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
            Official Application URL
          </label>
          <Input
            type="url"
            required
            value={values.application_url}
            onChange={(e) => update('application_url', e.target.value)}
            placeholder="https://..."
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-900 dark:text-white">
            Deadline <span className="font-normal text-slate-500">(leave blank for rolling)</span>
          </label>
          <Input
            type="date"
            value={toDateInputValue(values.deadline)}
            onChange={(e) => update('deadline', e.target.value ? new Date(e.target.value).toISOString() : null)}
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <input
          id="is_published"
          type="checkbox"
          checked={values.is_published}
          onChange={(e) => update('is_published', e.target.checked)}
          className="h-4 w-4 rounded border-slate-300"
        />
        <label htmlFor="is_published" className="text-sm font-medium text-slate-900 dark:text-white">
          Published (visible to the public)
        </label>
      </div>

      {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

      <Button type="submit" disabled={submitting}>
        {submitting ? 'Saving...' : submitLabel}
      </Button>
    </form>
  );
}
