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
import { GraduationCap, Plus, Search, Trash2 } from "lucide-react";
import { useModal } from "@/components/share/useModal";

export default function CatalogSchoolsPage() {
  const [schools, setSchools] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const loadSchools = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/api/schools");
      setSchools(response.data || []);
    } catch (error) {
      console.error("Failed to load schools:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSchools();
  }, []);

  const filteredSchools = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return schools;
    }
    return schools.filter((school) =>
      `${school.name} ${school.code}`.toLowerCase().includes(keyword),
    );
  }, [schools, query]);

  const handleCreateSchool = async () => {
    try {
      await axiosClient.post("/api/schools", form);
      setDialogOpen(false);
      setForm({ name: "", code: "", description: "" });
      loadSchools();
    } catch (error) {
      console.error("Failed to create school:", error);
      alert("Unable to create school. Please check the form.");
    }
  };

  const handleDeleteSchool = async (id) => {
    if (!window.confirm("Delete this school?")) {
      return;
    }

    try {
      await axiosClient.delete(`/api/schools/${id}`);
      setSchools((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete school:", error);
      alert("Unable to delete school.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <GraduationCap className="w-8 h-8 text-[#f26522]" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Schools Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Manage universities displayed across survey and uploads.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg text-slate-700">
            School directory
          </CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search schools..."
                className="pl-9 rounded-xl bg-slate-50 border-transparent focus-visible:border-[#f26522]/40 focus-visible:ring-[#f26522]/20"
              />
            </div>
            <Button
              className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] flex items-center gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add school
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="w-[35%] font-semibold">
                    School
                  </TableHead>
                  <TableHead className="w-[15%] font-semibold">Code</TableHead>
                  <TableHead className="font-semibold">Description</TableHead>
                  <TableHead className="text-right font-semibold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-slate-500"
                    >
                      Loading schools...
                    </TableCell>
                  </TableRow>
                ) : filteredSchools.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={4}
                      className="py-8 text-center text-slate-500"
                    >
                      No schools found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredSchools.map((school) => (
                    <TableRow key={school.id} className="hover:bg-slate-50/60">
                      <TableCell className="font-semibold text-slate-700">
                        {school.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-slate-500"
                        >
                          {school.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-slate-500 text-sm">
                        {school.description || "-"}
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteSchool(school.id)}
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
            <DialogTitle>Add school</DialogTitle>
            <DialogDescription>
              Create a new school record for survey and document flows.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>School name</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="FPT University"
              />
            </div>
            <div className="grid gap-2">
              <Label>School code</Label>
              <Input
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="FPT"
              />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Input
                value={form.description}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Ho Chi Minh City, Vietnam"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#f26522] text-white hover:bg-[#d95316]"
              onClick={handleCreateSchool}
            >
              Save school
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
