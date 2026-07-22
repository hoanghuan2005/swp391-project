import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SearchSelect from "@/components/search-select/SearchSelect";
import MultiSearchSelect from "@/components/search-select/MultiSearchSelect";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Layers,
  BookOpen,
  Tags,
  FileText,
  Eye,
  Lock,
  Save,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";

export default function EditDocumentModal({ open, documentId, onClose, onSuccess }) {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);

  const [schoolQuery, setSchoolQuery] = useState("");
  const [majorQuery, setMajorQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [subjectName, setSubjectName] = useState("");
  const [subjectNameOpen, setSubjectNameOpen] = useState(false);

  const [schoolOptions, setSchoolOptions] = useState([]);
  const [majorOptions, setMajorOptions] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    const fetchOptionsAndDetails = async () => {
      try {
        setLoading(true);
        // Load active options
        const [schoolsRes, coursesRes, tagsRes, categoriesRes, docDetailsRes] =
          await Promise.all([
            axiosClient.get("/api/schools"),
            axiosClient.get("/api/courses/all"),
            axiosClient.get("/api/tags"),
            axiosClient.get("/api/categories/active"),
            axiosClient.get(`/api/documents/${documentId}/detail`),
          ]);

        setSchoolOptions(
          Array.isArray(schoolsRes.data)
            ? schoolsRes.data.map((school) => ({
                id: school.id,
                code: school.code,
                name: school.name,
              }))
            : []
        );
        const fetchedCourses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
        setAllCourses(fetchedCourses);

        setTagOptions(
          Array.isArray(tagsRes.data)
            ? tagsRes.data.map((tag) => tag.name)
            : []
        );

        const fetchedCategories = Array.isArray(categoriesRes.data)
          ? categoriesRes.data.map((category) => ({
              id: category.id,
              code: category.code,
              name: category.name,
            }))
          : [];
        setCategoryOptions(fetchedCategories);

        // Load document details
        const doc = docDetailsRes.data;
        if (doc) {
          setTitle(doc.title || "");
          setDescription(doc.description || "");
          setVisibility(doc.visibility || "PUBLIC");
          setSelectedTags(doc.tags || []);

          if (doc.category) {
            const foundCat = fetchedCategories.find(c => c.id === doc.category.id) || doc.category;
            setSelectedCategory(foundCat);
          }

          if (doc.course) {
            const courseObj = doc.course;
            setSelectedSubject(courseObj);
            setSubjectQuery(`${courseObj.code} - ${courseObj.name}`);

            if (courseObj.major) {
              const majorObj = courseObj.major;
              setSelectedMajor(majorObj);
              setMajorQuery(`${majorObj.code} - ${majorObj.name}`);

              if (majorObj.school) {
                const schoolObj = majorObj.school;
                setSelectedSchool(schoolObj);
                setSchoolQuery(`${schoolObj.code} - ${schoolObj.name}`);

                // Load majors for this school
                try {
                  const res = await axiosClient.get(`/api/majors?schoolId=${schoolObj.id}`);
                  setMajorOptions(
                    Array.isArray(res.data)
                      ? res.data.map((m) => ({
                          id: m.id,
                          code: m.code,
                          name: m.name,
                        }))
                      : []
                  );
                } catch (error) {
                  console.error("Failed to fetch majors for school", schoolObj.id, error);
                }
              }

              // Load subject options for this major
              const filteredCourses = fetchedCourses.filter(
                (c) => c.major?.id === majorObj.id
              );
              setSubjectOptions(
                filteredCourses.map((c) => ({
                  id: c.id,
                  code: c.code,
                  name: c.name,
                }))
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to load edit details", error);
        toast.error("Failed to load document details");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    if (documentId && open) {
      fetchOptionsAndDetails();
    }
  }, [documentId, open, onClose]);

  const handleSchoolSelect = async (school) => {
    setSelectedSchool(school);
    setSelectedMajor(null);
    setMajorQuery("");
    setSelectedSubject(null);
    setSubjectQuery("");
    setSubjectName("");
    setSubjectNameOpen(false);
    setMajorOptions([]);
    setSubjectOptions([]);

    if (school) {
      try {
        const res = await axiosClient.get(`/api/majors?schoolId=${school.id}`);
        setMajorOptions(
          Array.isArray(res.data)
            ? res.data.map((m) => ({
                id: m.id,
                code: m.code,
                name: m.name,
              }))
            : []
        );
      } catch (error) {
        console.error("Failed to fetch majors for school", school.id, error);
      }
    }
  };

  const handleMajorSelect = (major) => {
    setSelectedMajor(major);
    setSelectedSubject(null);
    setSubjectQuery("");
    setSubjectName("");
    setSubjectNameOpen(false);

    if (major) {
      const filteredCourses = allCourses.filter(
        (course) => course.major?.id === major.id
      );
      setSubjectOptions(
        filteredCourses.map((course) => ({
          id: course.id,
          code: course.code,
          name: course.name,
        }))
      );
    } else {
      setSubjectOptions([]);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSchool) {
      toast.error("Please select a school");
      return;
    }
    if (!selectedMajor) {
      toast.error("Please select a major");
      return;
    }
    if (!selectedSubject && !subjectNameOpen) {
      toast.error("Please select or enter a course");
      return;
    }
    if (subjectNameOpen && !subjectName.trim()) {
      toast.error("Please enter the course name");
      return;
    }

    if (!title.trim()) {
      toast.error("Please enter a document title");
      return;
    }

    setSubmitting(true);
    const courseCode = subjectQuery.split("-")[0]?.trim();

    const payload = {
      title: title.trim(),
      description,
      visibility,
      categoryId: selectedCategory?.id || null,
      courseId: selectedSubject?.id || null,
      majorId: selectedMajor?.id || null,
      courseCode: selectedSubject?.id ? null : courseCode,
      courseName: subjectNameOpen ? subjectName.trim() : null,
      tagNames: selectedTags,
    };

    try {
      await axiosClient.put(`/api/documents/${documentId}`, payload);
      toast.success("Document updated successfully!");
      onSuccess();
    } catch (err) {
      console.error("Failed to update document:", err);
      toast.error(err.response?.data?.message || "Failed to update document");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(val) => !val && !submitting && onClose()}>
      <DialogContent className="sm:max-w-2xl rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl shadow-slate-900/10 max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b border-slate-50 pb-4">
          <DialogTitle className="text-xl font-black text-slate-800 flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#f26522]" /> Edit Document
          </DialogTitle>
          <DialogDescription className="mt-1 text-sm text-slate-500">
            Edit title, description, course, tags, etc.
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="space-y-6 py-4">
            <Skeleton className="h-12 w-full rounded-xl" />
            <Skeleton className="h-32 w-full rounded-xl" />
            <div className="grid grid-cols-2 gap-4">
              <Skeleton className="h-12 w-full rounded-xl" />
              <Skeleton className="h-12 w-full rounded-xl" />
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold flex items-center gap-2">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter document title..."
                className="rounded-xl border-slate-200 focus-visible:ring-[#f26522] focus-visible:border-[#f26522] h-11"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label className="text-slate-700 font-semibold">Description</Label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                maxLength={500}
                placeholder="Enter document description..."
                className="rounded-xl border-slate-200 focus-visible:ring-[#f26522] focus-visible:border-[#f26522] min-h-[100px] max-h-[120px] resize-none overflow-y-auto"
              />
              <p className="text-xs text-slate-400 text-right">{description.length}/500</p>
            </div>

            {/* Visibility and Category Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Visibility Dropdown */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold flex items-center gap-2">
                  {visibility === "PUBLIC" ? (
                    <Eye size={16} className="text-[#f26522]" />
                  ) : (
                    <Lock size={16} className="text-[#f26522]" />
                  )}
                  Visibility
                </Label>
                <Select value={visibility} onValueChange={setVisibility}>
                  <SelectTrigger className="w-full h-11 rounded-xl px-3 border-slate-200 focus:ring-[#f26522]">
                    <SelectValue placeholder="Select visibility" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    <SelectItem value="PUBLIC">
                      <div className="flex items-center gap-2">
                        <Eye size={14} className="text-slate-500" />
                        <span>Public</span>
                      </div>
                    </SelectItem>
                    <SelectItem value="PRIVATE">
                      <div className="flex items-center gap-2">
                        <Lock size={14} className="text-slate-500" />
                        <span>Private</span>
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Category Dropdown */}
              <div className="space-y-2">
                <Label className="text-slate-700 font-semibold">Category</Label>
                <Select
                  value={selectedCategory?.id || ""}
                  onValueChange={(val) => {
                    const found = categoryOptions.find((c) => c.id === val);
                    setSelectedCategory(found || null);
                  }}
                >
                  <SelectTrigger className="w-full h-11 rounded-xl px-3 border-slate-200 focus:ring-[#f26522]">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent className="rounded-xl">
                    {categoryOptions.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.code} - {c.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* School Input */}
            <SearchSelect
              label="School"
              icon={<GraduationCap size={16} className="text-[#f26522]" />}
              placeholder="Enter school code or name"
              options={schoolOptions}
              value={schoolQuery}
              setValue={setSchoolQuery}
              onSelect={handleSchoolSelect}
              displayValue={(school) => `${school.code} - ${school.name}`}
              searchKeys={["code", "name"]}
              renderLeft={(school) => (
                <span className="font-semibold text-slate-700">{school.code}</span>
              )}
              renderRight={(school) => (
                <span className="text-slate-500 text-[11px]">{school.name}</span>
              )}
            />

            {/* Major Input */}
            <SearchSelect
              label="Major"
              icon={<Layers size={16} className="text-[#f26522]" />}
              placeholder={
                selectedSchool ? "Enter major code or name" : "Please select a school first"
              }
              disabled={!selectedSchool}
              options={majorOptions}
              value={majorQuery}
              setValue={setMajorQuery}
              onSelect={handleMajorSelect}
              displayValue={(major) => `${major.code} - ${major.name}`}
              searchKeys={["code", "name"]}
              renderLeft={(major) => (
                <span className="font-semibold text-slate-700">{major.code}</span>
              )}
              renderRight={(major) => (
                <span className="text-slate-500 text-[11px]">{major.name}</span>
              )}
            />

            {/* Course & Course Name Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Subject Input */}
              <SearchSelect
                label="Course"
                icon={<BookOpen size={16} className="text-[#f26522]" />}
                placeholder={
                  selectedMajor ? "Enter course code or name" : "Please select a major first"
                }
                disabled={!selectedMajor}
                options={subjectOptions}
                value={subjectQuery}
                setValue={setSubjectQuery}
                onSelect={(course) => {
                  setSelectedSubject(course);
                  setSubjectNameOpen(false);
                }}
                onInputChange={(value) => {
                  const trimmed = value.trim().toLowerCase();
                  const hasMatch = subjectOptions.some(
                    (option) => option.code.toLowerCase() === trimmed
                  );
                  setSubjectNameOpen(Boolean(trimmed) && !hasMatch);
                }}
                displayValue={(course) => `${course.code} - ${course.name}`}
                searchKeys={["code", "name"]}
                renderLeft={(course) => (
                  <span className="font-semibold text-slate-700">{course.code}</span>
                )}
                renderRight={(course) => (
                  <span className="text-slate-500 text-[11px]">{course.name}</span>
                )}
              />
              {subjectNameOpen && (
                <div className="space-y-1">
                  <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                    <FileText size={16} className="text-[#f26522]" /> Course Name
                  </Label>
                  <Input
                    placeholder="New subject! Enter full name here:"
                    className="rounded-xl border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522] h-11"
                    value={subjectName}
                    onChange={(e) => setSubjectName(e.target.value)}
                  />
                </div>
              )}
            </div>

            {/* Tags Input */}
            <MultiSearchSelect
              label="Tags"
              icon={<Tags size={16} className="text-[#f26522]" />}
              options={tagOptions}
              selected={selectedTags}
              setSelected={setSelectedTags}
              placeholder="Type to search tags"
            />

            <div className="mt-6 flex justify-end gap-3 border-t border-slate-50 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={submitting}
                className="rounded-xl border-slate-200 px-6 h-11 cursor-pointer"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white font-bold px-6 h-11 flex items-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer border-none"
              >
                <Save size={16} />
                {submitting ? "Saving..." : "Save Changes"}
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
