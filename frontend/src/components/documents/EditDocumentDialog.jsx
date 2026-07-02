import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import SearchSelect from "@/components/search-select/SearchSelect";
import MultiSearchSelect from "@/components/search-select/MultiSearchSelect";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  GraduationCap,
  Layers,
  BookOpen,
  Tags,
  FileText,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { toast } from "sonner";

export default function EditDocumentDialog({
  open,
  onOpenChange,
  doc,
  onUpdateSuccess,
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [schoolQuery, setSchoolQuery] = useState("");
  const [majorQuery, setMajorQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [categoryQuery, setCategoryQuery] = useState("");

  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectNameOpen, setSubjectNameOpen] = useState(false);

  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  const [schoolOptions, setSchoolOptions] = useState([]);
  const [majorOptions, setMajorOptions] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const [categoryOptions, setCategoryOptions] = useState([]);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [schoolsRes, coursesRes, tagsRes, categoriesRes] =
          await Promise.all([
            axiosClient.get("/api/schools"),
            axiosClient.get("/api/courses/all"),
            axiosClient.get("/api/tags"),
            axiosClient.get("/api/categories/active"),
          ]);
        setSchoolOptions(
          Array.isArray(schoolsRes.data)
            ? schoolsRes.data.map((school) => ({
                id: school.id,
                code: school.code,
                name: school.name,
              }))
            : [],
        );
        const courses = Array.isArray(coursesRes.data) ? coursesRes.data : [];
        setAllCourses(courses);
        setTagOptions(
          Array.isArray(tagsRes.data)
            ? tagsRes.data.map((tag) => tag.name)
            : [],
        );
        setCategoryOptions(
          Array.isArray(categoriesRes.data)
            ? categoriesRes.data.map((category) => ({
                id: category.id,
                code: category.code,
                name: category.name,
                icon: category.icon,
                color: category.color,
              }))
            : [],
        );
      } catch (error) {
        console.error("Failed to load options", error);
      }
    };

    if (open) {
      fetchOptions();
    }
  }, [open]);

  // Pre-populate fields when doc is loaded
  useEffect(() => {
    if (open && doc) {
      setTitle(doc.title || "");
      setDescription(doc.description || "");

      const school = doc.course?.major?.school || null;
      setSelectedSchool(school);
      setSchoolQuery(school ? `${school.code} - ${school.name}` : "");

      const major = doc.course?.major || null;
      setSelectedMajor(major);
      setMajorQuery(major ? `${major.code} - ${major.name}` : "");

      const course = doc.course || null;
      setSelectedSubject(course);
      setSubjectQuery(course ? `${course.code} - ${course.name}` : "");

      const category = doc.category || null;
      setSelectedCategory(category);
      setCategoryQuery(category ? `${category.code} - ${category.name}` : "");

      setSelectedTags(doc.tags || []);
      setSubjectName("");
      setSubjectNameOpen(false);
      setSaveError("");

      // Fetch majors if school exists
      if (school) {
        axiosClient.get(`/api/majors?schoolId=${school.id}`)
          .then((res) => {
            setMajorOptions(
              Array.isArray(res.data)
                ? res.data.map((m) => ({
                    id: m.id,
                    code: m.code,
                    name: m.name,
                  }))
                : [],
            );
          })
          .catch((err) => console.error("Failed to fetch majors", err));
      }
    }
  }, [open, doc]);

  // Handle course options filtering when major changes
  useEffect(() => {
    if (selectedMajor && allCourses.length > 0) {
      const filteredCourses = allCourses.filter(
        (course) => course.major?.id === selectedMajor.id,
      );
      setSubjectOptions(
        filteredCourses.map((course) => ({
          id: course.id,
          code: course.code,
          name: course.name,
        })),
      );
    } else {
      setSubjectOptions([]);
    }
  }, [selectedMajor, allCourses]);

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
            : [],
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
  };

  const handleSaveChanges = async () => {
    if (!title.trim()) {
      const message = "Please enter a document title.";
      setSaveError(message);
      toast.error(message);
      return;
    }

    if (!selectedSchool) {
      const message = "Please select a school.";
      setSaveError(message);
      toast.error(message);
      return;
    }

    if (!selectedMajor) {
      const message = "Please select a major.";
      setSaveError(message);
      toast.error(message);
      return;
    }

    const courseCode = subjectQuery.split("-")[0]?.trim();

    if (!selectedSubject && !subjectNameOpen) {
      const message = "Please select or enter a course.";
      setSaveError(message);
      toast.error(message);
      return;
    }

    if (subjectNameOpen && !subjectName.trim()) {
      const message = "Please enter the course name.";
      setSaveError(message);
      toast.error(message);
      return;
    }

    setSaving(true);
    setSaveError("");
    const toastId = toast.loading("Saving changes...");

    try {
      const updateData = {
        title: title.trim(),
        description: description.trim(),
        tagNames: selectedTags,
      };

      if (selectedSubject?.id) {
        updateData.courseId = selectedSubject.id;
      } else {
        updateData.courseCode = courseCode;
        if (selectedMajor?.id) {
          updateData.majorId = selectedMajor.id;
        }
        if (subjectNameOpen && subjectName.trim()) {
          updateData.courseName = subjectName.trim();
        }
      }

      if (selectedCategory?.id) {
        updateData.categoryId = selectedCategory.id;
      }

      const response = await axiosClient.put(`/api/documents/${doc.id}`, updateData);

      toast.success("Document updated successfully!", { id: toastId });
      onUpdateSuccess?.(response.data);
      onOpenChange(false);
    } catch (error) {
      console.error("Update failed", error);
      toast.error("Failed to update document", { id: toastId });
      setSaveError("Failed to update document. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Edit Document
          </DialogTitle>
          <DialogDescription>
            Update metadata fields for your uploaded document.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-5 py-4">
          {/* Title Input */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-slate-700 font-semibold">
              <FileText size={16} className="text-[#f26522]" /> Document Title
            </Label>
            <Input
              placeholder="Enter document title"
              className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          {/* Description Input */}
          <div className="space-y-1.5">
            <Label className="flex items-center gap-2 text-slate-700 font-semibold">
              <FileText size={16} className="text-[#f26522]" /> Description
            </Label>
            <Textarea
              placeholder="Enter brief description"
              className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522] min-h-[80px]"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>

          {/* school Input */}
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
              <span className="font-semibold text-slate-700">
                {school.code}
              </span>
            )}
            renderRight={(school) => (
              <span className="text-slate-500 text-[11px]">
                {school.name}
              </span>
            )}
          />

          {/* major Input */}
          <SearchSelect
            label="Major"
            icon={<Layers size={16} className="text-[#f26522]" />}
            placeholder={
              selectedSchool
                ? "Enter major code or name"
                : "Please select a school first"
            }
            disabled={!selectedSchool}
            options={majorOptions}
            value={majorQuery}
            setValue={setMajorQuery}
            onSelect={handleMajorSelect}
            displayValue={(major) => `${major.code} - ${major.name}`}
            searchKeys={["code", "name"]}
            renderLeft={(major) => (
              <span className="font-semibold text-slate-700">
                {major.code}
              </span>
            )}
            renderRight={(major) => (
              <span className="text-slate-500 text-[11px]">{major.name}</span>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            {/* subject Input */}
            <SearchSelect
              label="Course"
              icon={<BookOpen size={16} className="text-[#f26522]" />}
              placeholder={
                selectedMajor
                  ? "Enter course code or name"
                  : "Please select a major first"
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
                  (option) => option.code.toLowerCase() === trimmed,
                );
                setSubjectNameOpen(Boolean(trimmed) && !hasMatch);
              }}
              displayValue={(course) => `${course.code} - ${course.name}`}
              searchKeys={["code", "name"]}
              renderLeft={(course) => (
                <span className="font-semibold text-slate-700">
                  {course.code}
                </span>
              )}
              renderRight={(course) => (
                <span className="text-slate-500 text-[11px]">
                  {course.name}
                </span>
              )}
            />
            {subjectNameOpen && (
              <div className="space-y-1">
                <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                  <FileText size={16} className="text-[#f26522]" /> Course
                  Name
                </Label>
                <Input
                  placeholder="New subject! Enter full name here:"
                  className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>
            )}
            {/* category Input */}
            <SearchSelect
              label="Category"
              icon={<FileText size={16} className="text-[#f26522]" />}
              placeholder="Select category"
              options={categoryOptions}
              value={categoryQuery}
              setValue={setCategoryQuery}
              onSelect={setSelectedCategory}
              displayValue={(c) => `${c.code} - ${c.name}`}
              searchKeys={["code", "name"]}
              renderLeft={(c) => (
                <div className="flex items-center gap-2">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor: c.color || "#f26522",
                    }}
                  />
                  <span className="font-semibold">{c.code}</span>
                </div>
              )}
              renderRight={(c) => (
                <span className="text-slate-500 text-[11px]">{c.name}</span>
              )}
            />
          </div>

          {/* tags Input */}
          <MultiSearchSelect
            label="Tags"
            icon={<Tags size={16} className="text-[#f26522]" />}
            options={tagOptions}
            selected={selectedTags}
            setSelected={setSelectedTags}
            placeholder="Type to search tags"
          />
        </div>

        <DialogFooter>
          {saveError && (
            <p className="text-xs text-red-500 w-full text-left mb-2 font-medium">
              {saveError}
            </p>
          )}
          <Button
            className="w-full h-10 bg-[#f26522] hover:bg-[#f44d00] text-white font-bold rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            onClick={handleSaveChanges}
            disabled={saving}
          >
            {saving ? "Saving Changes..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}