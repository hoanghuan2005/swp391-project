import { Badge } from "@/components/ui/badge";

export default function StatusBadge({ status }) {
  const config = {
    DRAFT: {
      label: "Draft",
      className:
        "bg-yellow-100 text-yellow-700 border-yellow-200",
    },
    PUBLISHED: {
      label: "Published",
      className:
        "bg-green-100 text-green-700 border-green-200",
    },
    ARCHIVED: {
      label: "Archived",
      className:
        "bg-slate-100 text-slate-700 border-slate-200",
    },
  };

  const current = config[status];

  return (
    <Badge variant="outline" className={current.className}>
      {current.label}
    </Badge>
  );
}