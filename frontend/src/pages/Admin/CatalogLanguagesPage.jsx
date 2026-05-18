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
import { Globe, Plus, Search, Trash2 } from "lucide-react";

export default function CatalogLanguagesPage() {
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ name: "", code: "" });

  const loadLanguages = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get("/api/languages");
      setLanguages(response.data || []);
    } catch (error) {
      console.error("Failed to load languages:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLanguages();
  }, []);

  const filteredLanguages = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return languages;
    }
    return languages.filter((language) =>
      `${language.name} ${language.code}`.toLowerCase().includes(keyword),
    );
  }, [languages, query]);

  const handleCreateLanguage = async () => {
    try {
      await axiosClient.post("/api/languages", form);
      setDialogOpen(false);
      setForm({ name: "", code: "" });
      loadLanguages();
    } catch (error) {
      console.error("Failed to create language:", error);
      alert("Unable to create language.");
    }
  };

  const handleDeleteLanguage = async (id) => {
    if (!window.confirm("Delete this language?")) {
      return;
    }

    try {
      await axiosClient.delete(`/api/languages/${id}`);
      setLanguages((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete language:", error);
      alert("Unable to delete language.");
    }
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <Globe className="w-8 h-8 text-[#f26522]" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Languages Catalog
          </h1>
          <p className="text-sm text-slate-500">
            Keep survey language options up to date.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg text-slate-700">
            Language list
          </CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search languages..."
                className="pl-9 rounded-xl bg-slate-50 border-transparent focus-visible:border-[#f26522]/40 focus-visible:ring-[#f26522]/20"
              />
            </div>
            <Button
              className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] flex items-center gap-2"
              onClick={() => setDialogOpen(true)}
            >
              <Plus className="w-4 h-4" />
              Add language
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  <TableHead className="font-semibold">Language</TableHead>
                  <TableHead className="font-semibold">Code</TableHead>
                  <TableHead className="text-right font-semibold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-slate-500"
                    >
                      Loading languages...
                    </TableCell>
                  </TableRow>
                ) : filteredLanguages.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={3}
                      className="py-8 text-center text-slate-500"
                    >
                      No languages found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredLanguages.map((language) => (
                    <TableRow
                      key={language.id}
                      className="hover:bg-slate-50/60"
                    >
                      <TableCell className="font-semibold text-slate-700">
                        {language.name}
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className="border-slate-200 text-slate-500"
                        >
                          {language.code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteLanguage(language.id)}
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
            <DialogTitle>Add language</DialogTitle>
            <DialogDescription>
              Add a language option for student surveys.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid gap-2">
              <Label>Language name</Label>
              <Input
                value={form.name}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, name: event.target.value }))
                }
                placeholder="English"
              />
            </div>
            <div className="grid gap-2">
              <Label>Language code</Label>
              <Input
                value={form.code}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="EN"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#f26522] text-white hover:bg-[#d95316]"
              onClick={handleCreateLanguage}
            >
              Save language
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
