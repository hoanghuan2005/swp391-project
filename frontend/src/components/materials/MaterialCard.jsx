import {
  Layers3,
  FileQuestion,
} from "lucide-react";

import StatusBadge from "./StatusBadge";
import VisibilityBadge from "./VisibilityBadge";

export default function MaterialCard({
  material,
  onClick,
}) {
  const Icon =
    material.type === "FLASHCARD"
      ? Layers3
      : FileQuestion;

  return (
    <div
      onClick={() => onClick(material)}
      className="border rounded-xl bg-white p-4 hover:shadow-md cursor-pointer"
    >
      <div className="flex justify-between">
        <Icon className="w-5 h-5 text-[#f26522]" />

        <StatusBadge
          status={material.status}
        />
      </div>

      <h3 className="font-semibold mt-3">
        {material.title}
      </h3>

      <p className="text-sm text-slate-500 mt-1">
        {material.itemCount} items
      </p>

      <div className="mt-3">
        <VisibilityBadge
          visibility={material.visibility}
        />
      </div>
    </div>
  );
}