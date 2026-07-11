import Badge from '../ui/Badge';

export default function SkillList({ skills }: { skills: string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {skills.map((skill) => (
        <Badge key={skill} tone="indigo">
          {skill}
        </Badge>
      ))}
    </div>
  );
}
