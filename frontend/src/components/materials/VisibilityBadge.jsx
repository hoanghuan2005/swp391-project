import { Globe, Lock, Users } from "lucide-react";

export default function VisibilityBadge({ visibility }) {
  const map = {
    PRIVATE: {
      icon: Lock,
      label: "Private",
    },
    COURSE: {
      icon: Users,
      label: "Course",
    },
    PUBLIC: {
      icon: Globe,
      label: "Public",
    },
  };

  const config = map[visibility];

  const Icon = config.icon;

  return (
    <div className="flex items-center gap-1 text-sm text-slate-500">
      <Icon className="w-4 h-4" />
      {config.label}
    </div>
  );
}
