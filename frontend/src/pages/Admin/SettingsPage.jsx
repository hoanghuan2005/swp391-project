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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BookOpen,
  GraduationCap,
  Plus,
  Search,
  Tags,
  Trash2,
} from "lucide-react";

export default function SettingsPage() {
  const [schools, setSchools] = useState([]);
  const [tags, setTags] = useState([]);
  const [languages, setLanguages] = useState([]);
  const [loading, setLoading] = useState(true);

  const [schoolQuery, setSchoolQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [languageQuery, setLanguageQuery] = useState("");

  const [schoolDialogOpen, setSchoolDialogOpen] = useState(false);
  const [tagDialogOpen, setTagDialogOpen] = useState(false);
  const [languageDialogOpen, setLanguageDialogOpen] = useState(false);

  const [schoolForm, setSchoolForm] = useState({
    name: "",
    code: "",
    description: "",
  });
  const [tagName, setTagName] = useState("");
  const [languageForm, setLanguageForm] = useState({
    name: "",
    code: "",
  });

  const loadCatalog = async () => {
    try {
      setLoading(true);
      const [schoolsRes, tagsRes, languagesRes] = await Promise.all([
        axiosClient.get("/api/schools"),
        axiosClient.get("/api/tags"),
        axiosClient.get("/api/languages"),
      ]);
      setSchools(schoolsRes.data || []);
      setTags(tagsRes.data || []);
      setLanguages(languagesRes.data || []);
    } catch (error) {
      console.error("Failed to load catalog data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCatalog();
  }, []);

  const filteredSchools = useMemo(() => {
    const query = schoolQuery.trim().toLowerCase();
    if (!query) {
      return schools;
    }
    return schools.filter((school) =>
      `${school.name} ${school.code}`.toLowerCase().includes(query),
    );
  }, [schools, schoolQuery]);

  const filteredTags = useMemo(() => {
    const query = tagQuery.trim().toLowerCase();
    if (!query) {
      return tags;
    }
    return tags.filter((tag) => tag.name?.toLowerCase().includes(query));
  }, [tags, tagQuery]);

  const filteredLanguages = useMemo(() => {
    const query = languageQuery.trim().toLowerCase();
    if (!query) {
      return languages;
    }
    return languages.filter((language) =>
      `${language.name} ${language.code}`.toLowerCase().includes(query),
    );
  }, [languages, languageQuery]);

  const handleCreateSchool = async () => {
    try {
      await axiosClient.post("/api/schools", schoolForm);
      setSchoolDialogOpen(false);
      setSchoolForm({ name: "", code: "", description: "" });
      loadCatalog();
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

  const handleCreateTag = async () => {
    try {
      await axiosClient.post("/api/tags", { name: tagName });
      setTagDialogOpen(false);
      setTagName("");
      loadCatalog();
    } catch (error) {
      console.error("Failed to create tag:", error);
      alert("Unable to create tag.");
    }
  };

  const handleDeleteTag = async (id) => {
    if (!window.confirm("Delete this tag?")) {
      return;
    }

    try {
      await axiosClient.delete(`/api/tags/${id}`);
      setTags((prev) => prev.filter((item) => item.id !== id));
    } catch (error) {
      console.error("Failed to delete tag:", error);
      alert("Unable to delete tag.");
    }
  };

  const handleCreateLanguage = async () => {
    try {
      await axiosClient.post("/api/languages", languageForm);
      setLanguageDialogOpen(false);
      setLanguageForm({ name: "", code: "" });
      loadCatalog();
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
        <BookOpen className="w-8 h-8 text-[#f26522]" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Catalog Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage schools, tags, and language lists used across the platform.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-700">
            Manage resources
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="schools" className="space-y-6">
            <TabsList className="rounded-xl">
              <TabsTrigger value="schools">Schools</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
            </TabsList>

            <TabsContent value="schools" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={schoolQuery}
                    onChange={(event) => setSchoolQuery(event.target.value)}
                    placeholder="Search schools..."
                    className="pl-9 rounded-xl bg-slate-50 border-transparent focus-visible:border-[#f26522]/40 focus-visible:ring-[#f26522]/20"
                  />
                </div>
                <Button
                  className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] flex items-center gap-2"
                  onClick={() => setSchoolDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add school
                </Button>
              </div>

              <div className="rounded-xl border border-slate-100 overflow-hidden">
                <Table>
                  <TableHeader className="bg-slate-50/50">
                    <TableRow>
                      <TableHead className="w-[35%] font-semibold">
                        School
                      </TableHead>
                      <TableHead className="w-[15%] font-semibold">
                        Code
                      </TableHead>
                      <TableHead className="font-semibold">
                        Description
                      </TableHead>
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
                        <TableRow
                          key={school.id}
                          className="hover:bg-slate-50/60"
                        >
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
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={tagQuery}
                    onChange={(event) => setTagQuery(event.target.value)}
                    placeholder="Search tags..."
                    className="pl-9 rounded-xl bg-slate-50 border-transparent focus-visible:border-[#f26522]/40 focus-visible:ring-[#f26522]/20"
                  />
                </div>
                <Button
                  className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] flex items-center gap-2"
                  onClick={() => setTagDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add tag
                </Button>
              </div>

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
                              onClick={() => handleDeleteTag(tag.id)}
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
            </TabsContent>

            <TabsContent value="languages" className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="relative w-full sm:w-80">
                  <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <Input
                    value={languageQuery}
                    onChange={(event) => setLanguageQuery(event.target.value)}
                    placeholder="Search languages..."
                    className="pl-9 rounded-xl bg-slate-50 border-transparent focus-visible:border-[#f26522]/40 focus-visible:ring-[#f26522]/20"
                  />
                </div>
                <Button
                  className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] flex items-center gap-2"
                  onClick={() => setLanguageDialogOpen(true)}
                >
                  <Plus className="w-4 h-4" />
                  Add language
                </Button>
              </div>

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
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      <Dialog open={schoolDialogOpen} onOpenChange={setSchoolDialogOpen}>
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
                value={schoolForm.name}
                onChange={(event) =>
                  setSchoolForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="FPT University"
              />
            </div>
            <div className="grid gap-2">
              <Label>School code</Label>
              <Input
                value={schoolForm.code}
                onChange={(event) =>
                  setSchoolForm((prev) => ({
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
                value={schoolForm.description}
                onChange={(event) =>
                  setSchoolForm((prev) => ({
                    ...prev,
                    description: event.target.value,
                  }))
                }
                placeholder="Ho Chi Minh City, Vietnam"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSchoolDialogOpen(false)}>
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

      <Dialog open={tagDialogOpen} onOpenChange={setTagDialogOpen}>
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
            <Button variant="ghost" onClick={() => setTagDialogOpen(false)}>
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

      <Dialog open={languageDialogOpen} onOpenChange={setLanguageDialogOpen}>
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
                value={languageForm.name}
                onChange={(event) =>
                  setLanguageForm((prev) => ({
                    ...prev,
                    name: event.target.value,
                  }))
                }
                placeholder="English"
              />
            </div>
            <div className="grid gap-2">
              <Label>Language code</Label>
              <Input
                value={languageForm.code}
                onChange={(event) =>
                  setLanguageForm((prev) => ({
                    ...prev,
                    code: event.target.value.toUpperCase(),
                  }))
                }
                placeholder="EN"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setLanguageDialogOpen(false)}
            >
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
