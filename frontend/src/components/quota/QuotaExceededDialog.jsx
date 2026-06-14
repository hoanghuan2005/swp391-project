import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const CONTENT = {
  AI: {
    title: "Daily AI limit reached",
    fallback: "You have reached your daily AI request limit.",
  },
  DOCUMENT: {
    title: "Document limit reached",
    fallback: "You have reached your document upload or storage limit.",
  },
  FILE_SIZE: {
    title: "File is too large",
    fallback: "This file exceeds the maximum size for your current plan.",
  },
};

export default function QuotaExceededDialog({
  open,
  onOpenChange,
  type = "DOCUMENT",
  message,
  onUpgrade,
}) {
  const navigate = useNavigate();
  const content = CONTENT[type] || CONTENT.DOCUMENT;

  const handleUpgrade = () => {
    onUpgrade?.();
    onOpenChange(false);
    navigate("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-xl font-bold text-slate-900">
            {content.title}
          </DialogTitle>
          <DialogDescription className="pt-2 text-sm text-slate-600">
            {message || content.fallback}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe later
          </Button>
          <Button
            className="bg-[#f26522] text-white hover:bg-[#d95316]"
            onClick={handleUpgrade}
          >
            Upgrade to Pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
