import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FolderPlus, Loader2 } from "lucide-react";
import { toast } from "react-hot-toast";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createProject } from "@/api/projectApi";

export default function CreateProjectModal({ open, onOpenChange, onSuccess }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSending] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    try {
      setIsSending(true);
      const newProject = await createProject({ name, description });
      toast.success("Study Workspace created!");

      if (onSuccess) onSuccess(newProject);

      // refresh sidebar workspace
      window.dispatchEvent(new CustomEvent("workspaces:updated"));

      onOpenChange(false);

      navigate(`/workspace/${newProject.id}`);
    } catch (error) {
      console.error("Failed to create project:", error);
      toast.error("Failed to create workspace. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-3xl">
        <DialogHeader>
          <div className="w-12 h-12 rounded-2xl bg-[#f26522]/10 flex items-center justify-center mb-4">
            <FolderPlus className="w-6 h-6 text-[#f26522]" />
          </div>
          <DialogTitle className="text-2xl font-bold text-slate-800">
            Create Study Workspace
          </DialogTitle>
          <DialogDescription className="text-slate-500">
            Group multiple documents together to chat with them simultaneously.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-5 py-4">
          <div className="space-y-2">
            <Label htmlFor="name" className="font-semibold text-slate-700">
              Workspace Name
            </Label>
            <Input
              id="name"
              placeholder="e.g., Final Exam Preparation"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="rounded-xl focus-visible:ring-[#f26522]"
            />
          </div>

          <div className="space-y-2">
            <Label
              htmlFor="description"
              className="font-semibold text-slate-700"
            >
              Description (Optional)
            </Label>
            <Textarea
              id="description"
              placeholder="What are you studying in this project?"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="rounded-xl min-h-[100px] focus-visible:ring-[#f26522] resize-none"
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              className="rounded-xl font-semibold"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !name.trim()}
              className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white font-semibold min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Workspace"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
