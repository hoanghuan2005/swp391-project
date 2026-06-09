import {
  Save,
  Globe,
  PlayCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";

import StatusBadge from "./StatusBadge";

export default function MaterialToolbar({
  title,
  status,
  onSave,
  onPublish,
  onStudy,
}) {
  return (
    <div className="flex items-center justify-between border-b pb-4">
      <div>
        <h2 className="text-2xl font-bold">
          {title}
        </h2>

        <StatusBadge status={status} />
      </div>

      <div className="flex gap-2">
        <Button
          variant="outline"
          onClick={onSave}
        >
          <Save className="w-4 h-4 mr-2" />
          Save Draft
        </Button>

        <Button
          variant="outline"
          onClick={onPublish}
        >
          <Globe className="w-4 h-4 mr-2" />
          Publish
        </Button>

        <Button onClick={onStudy}>
          <PlayCircle className="w-4 h-4 mr-2" />
          Study
        </Button>
      </div>
    </div>
  );
}