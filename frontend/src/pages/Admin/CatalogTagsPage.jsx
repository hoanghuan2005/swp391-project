import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Tags, Trash2 } from "lucide-react";
import { useModal } from "@/components/share/useModal";
import { toast } from "sonner";

export default function CatalogTagsPage() {
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [tagName, setTagName] = useState("");
  const { confirm } = useModal();

  const loadTags = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/api/tags");
      setTags(response.data || []);
    } catch (error) {
      console.error("Failed to load tags:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTags();
  }, []);

  const filteredTags = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return tags;
    }
    return tags.filter((tag) => tag.name?.toLowerCase().includes(keyword));
  }, [tags, query]);

  const handleCreateTag = async () => {
    try {
      await axiosClient.post("/api/tags", { name: tagName });
      setDialogOpen(false);
      setTagName("");
      loadTags();
    } catch (error) {
      console.error("Failed to create tag:", error);
      alert("Unable to create tag.");
    }
  };

  const handleDeleteTag = async (id, tagName) => {
    const confirmed = await confirm({
      title: "Delete Tag",
      message: `Delete "${tagName}" permanently?`,
    });

    if (!confirmed) return;

    try {
      await axiosClient.delete(`/api/tags/${id}`);

      setTags((prev) => prev.filter((item) => item.id !== id));
      toast.success("Tag deleted successfully");
    } catch (error) {
      toast.error("Unable to delete tag");
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Tags className="w-8 h-8 text-[#f26522]" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Tags Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Maintain the document tags available across the platform.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg text-slate-700">Tags list</CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search tags..."
                className="pl-9 rounded-xl bg-slate-50 border-transparent focus-visible:border-[#f26522]/40 focus-visible:ring-[#f26522]/20"
              />
            </div>
            <Button
              className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] flex items-center gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add tag
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold">Tag</TableHead>
                  <TableHead className="text-right font-semibold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="py-8 text-center text-slate-500"
                    >
                      Loading tags...
                    </TableCell>
                  </TableRow>
                ) : filteredTags.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={2}
                      className="py-8 text-center text-slate-500"
                    >
                      No tags found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredTags.map((tag) => (
                    <TableRow key={tag.id} className="hover:bg-slate-50/60">
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-slate-600"
                        >
                          {tag.name}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteTag(tag.id, tag.name)}
                          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>Add tag</DialogTitle>
            <DialogDescription>
              Create a new tag for documents.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2">
            <Label>Tag name</Label>
            <Input
              value={tagName}
              onChange={(event) => setTagName(event.target.value)}
              placeholder="Final Exam"
            />
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#f26522] text-white hover:bg-[#d95316]"
              onClick={handleCreateTag}
            >
              Save tag
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
