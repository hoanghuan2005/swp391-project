import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UploadCloud,
  GraduationCap,
  BookOpen,
  Tags,
  FileText,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";

export default function UploadDocumentDialog({ open, onOpenChange, onUploadSuccess }) {
  const [schoolQuery, setSchoolQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectNameOpen, setSubjectNameOpen] = useState(false);

  const [schoolOpen, setSchoolOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  const fileInputRef = useRef(null);
  const schoolRef = useRef(null);
  const subjectRef = useRef(null);
  const tagRef = useRef(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [schoolsRes, coursesRes, tagsRes] = await Promise.all([
          axiosClient.get("/api/schools"),
          axiosClient.get("/api/courses/all"),
          axiosClient.get("/api/tags"),
        ]);

        setSchoolOptions(
          Array.isArray(schoolsRes.data)
            ? schoolsRes.data.map((school) => ({
                code: school.code,
                name: school.name,
              }))
            : [],
        );
        setSubjectOptions(
          Array.isArray(coursesRes.data)
            ? coursesRes.data.map((course) => ({
                code: course.code,
                name: course.name,
              }))
            : [],
        );
        setTagOptions(
          Array.isArray(tagsRes.data)
            ? tagsRes.data.map((tag) => tag.name)
            : [],
        );
      } catch (error) {
        console.error("Failed to load options", error);
      }
    };

    if (open) {
      fetchOptions();
    } else {
        // Reset state when dialog closes
        setSelectedFile(null);
        setSubjectQuery("");
        setSchoolQuery("");
        setSubjectName("");
        setSelectedTags([]);
        setUploadError("");
    }
  }, [open]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (schoolRef.current && !schoolRef.current.contains(event.target)) {
        setSchoolOpen(false);
      }
      if (subjectRef.current && !subjectRef.current.contains(event.target)) {
        setSubjectOpen(false);
      }
      if (tagRef.current && !tagRef.current.contains(event.target)) {
        setTagOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredSchools = schoolOptions.filter((option) => {
    const query = schoolQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      option.code.toLowerCase().includes(query) ||
      option.name.toLowerCase().includes(query)
    );
  });

  const filteredSubjects = subjectOptions.filter((option) => {
    const query = subjectQuery.trim().toLowerCase();
    if (!query) return true;
    return (
      option.code.toLowerCase().includes(query) ||
      option.name.toLowerCase().includes(query)
    );
  });

  const filteredTags = tagOptions.filter((option) => {
    const query = tagQuery.trim().toLowerCase();
    if (!query) return true;
    return option.toLowerCase().includes(query);
  });

  const addTag = (name) => {
    const trimmed = name.trim();
    if (!trimmed) return;

    setSelectedTags((prev) =>
      prev.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())
        ? prev
        : [...prev, trimmed],
    );
    setTagQuery("");
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setUploadError("");
    }
  };

  const resolveUploadedById = async () => {
    const storedId = localStorage.getItem("userId");
    if (storedId) return storedId;

    try {
      const profileRes = await axiosClient.get("/api/users/profile");
      const profileId = profileRes.data?.id;
      if (profileId) {
        localStorage.setItem("userId", profileId);
        return profileId;
      }
    } catch (error) {
      console.error("Failed to load user profile", error);
    }
    return null;
  };

  const handleUploadDocument = async () => {
    if (!selectedFile) {
      setUploadError("Please select a file to upload.");
      return;
    }

    const courseCode = subjectQuery.split("-")[0]?.trim();
    if (!courseCode) {
      setUploadError("Please enter a course code.");
      return;
    }

    const uploadedById = await resolveUploadedById();

    setUploading(true);
    setUploadError("");

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);
      formData.append("title", selectedFile.name);
      formData.append("visibility", "PUBLIC");
      if (uploadedById) {
        formData.append("uploadedById", uploadedById);
      }
      formData.append("courseCode", courseCode);

      if (subjectNameOpen && subjectName.trim()) {
        formData.append("courseName", subjectName.trim());
      }

      selectedTags.forEach((tag) => formData.append("tagNames", tag));

      await axiosClient.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      window.dispatchEvent(new CustomEvent("documents:uploaded"));
      if (onUploadSuccess) onUploadSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl rounded-2xl p-6">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">
            Upload Document
          </DialogTitle>
          <DialogDescription>
            Share your knowledge. Fill out the specific areas so others can
            easily find it.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-5 py-4">
          {/* File Input */}
          <div
            className="space-y-4 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <div className="flex justify-center">
              <div className="p-3 bg-[#f26522]/10 rounded-full text-[#f26522]">
                <UploadCloud size={32} />
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">
                Click to upload or drag and drop
              </p>
              <p className="text-xs text-slate-500 mt-1">
                PDF, DOCX, PPTX (max. 10MB)
              </p>
              {selectedFile && (
                <p className="text-xs text-slate-700 mt-2 font-medium text-[#f26522]">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.ppt,.pptx"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          <div className="space-y-2" ref={schoolRef}>
            <Label className="flex items-center gap-2 text-slate-700 font-semibold">
              <GraduationCap size={16} className="text-[#f26522]" /> School
            </Label>
            <div className="relative">
              <Input
                placeholder="Enter school code or name"
                value={schoolQuery}
                onChange={(e) => {
                  setSchoolQuery(e.target.value);
                  setSelectedSchool(null);
                  setSchoolOpen(true);
                }}
                onFocus={() => setSchoolOpen(true)}
                className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
              />
              {schoolOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredSchools.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500">
                        No schools found
                      </div>
                    ) : (
                      filteredSchools.map((option) => (
                        <Button
                          key={option.code}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            setSelectedSchool(option);
                            setSchoolQuery(`${option.code} - ${option.name}`);
                            setSchoolOpen(false);
                          }}
                        >
                          <span className="font-semibold text-slate-700">
                            {option.code}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {option.name}
                          </span>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="space-y-2" ref={subjectRef}>
            <Label className="flex items-center gap-2 text-slate-700 font-semibold">
              <BookOpen size={16} className="text-[#f26522]" /> Course
            </Label>
            <div className="relative">
              <Input
                placeholder="Enter course code or name"
                value={subjectQuery}
                onChange={(e) => {
                  const value = e.target.value;
                  setSubjectQuery(value);
                  setSelectedSubject(null);
                  setSubjectOpen(true);

                  const trimmed = value.trim().toLowerCase();
                  const hasMatch = subjectOptions.some(
                    (option) => option.code.toLowerCase() === trimmed,
                  );
                  setSubjectNameOpen(Boolean(trimmed) && !hasMatch);
                }}
                onFocus={() => setSubjectOpen(true)}
                className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
              />
              {subjectOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="max-h-48 overflow-y-auto">
                    {filteredSubjects.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500">
                        No courses found
                      </div>
                    ) : (
                      filteredSubjects.map((option) => (
                        <Button
                          key={option.code}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            setSelectedSubject(option);
                            setSubjectQuery(
                              `${option.code} - ${option.name}`,
                            );
                            setSubjectNameOpen(false);
                            setSubjectOpen(false);
                          }}
                        >
                          <span className="font-semibold text-slate-700">
                            {option.code}
                          </span>
                          <span className="text-slate-500 text-[11px]">
                            {option.name}
                          </span>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {subjectNameOpen && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <FileText size={16} className="text-[#f26522]" /> Course Name
              </Label>
              <Input
                placeholder="New subject! Enter full name here:"
                className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
              />
            </div>
          )}

          <div className="space-y-2" ref={tagRef}>
            <Label className="flex items-center gap-2 text-slate-700 font-semibold">
              <Tags size={16} className="text-[#f26522]" /> Tags
            </Label>
            <div className="relative">
              <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-2.5 py-1 focus-within:border-[#f26522] focus-within:ring-1 focus-within:ring-[#f26522] bg-white">
                {selectedTags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="secondary"
                    className="flex items-center gap-1 rounded-full bg-[#f26522]/10 text-[#555555] px-2 py-0.5 font-medium"
                  >
                    {tag}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-xs"
                      className="-ml-1 -mr-1.5 text-[#6a6a6a] hover:text-red-500 rounded-full p-0 cursor-pointer h-4 w-4"
                      onClick={() =>
                        setSelectedTags((prev) =>
                          prev.filter((item) => item !== tag),
                        )
                      }
                    >
                      x
                    </Button>
                  </Badge>
                ))}
                <Input
                  placeholder={
                    selectedTags.length > 0 ? "" : "Type to search tags"
                  }
                  value={tagQuery}
                  onChange={(e) => {
                    setTagQuery(e.target.value);
                    setTagOpen(true);
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addTag(tagQuery);
                    }
                  }}
                  onFocus={() => setTagOpen(true)}
                  className="h-7 flex-1 border-0 p-0 text-xs focus-visible:ring-0 bg-transparent shadow-none"
                />
              </div>
              {tagOpen && (
                <div className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg">
                  <div className="max-h-44 overflow-y-auto">
                    {filteredTags.length === 0 ? (
                      <div className="px-3 py-2 text-xs text-slate-500">
                        No tags found. Press Enter to add new tag.
                      </div>
                    ) : (
                      filteredTags.map((option) => (
                        <Button
                          key={option}
                          type="button"
                          variant="ghost"
                          size="sm"
                          className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50 cursor-pointer"
                          onClick={() => {
                            addTag(option);
                            setTagOpen(false);
                          }}
                        >
                          <span className="text-slate-700">{option}</span>
                        </Button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
        <DialogFooter>
          {uploadError && (
            <p className="text-xs text-red-500 w-full text-left mb-2 font-medium">
              {uploadError}
            </p>
          )}
          <Button
            className="w-full h-10 bg-[#f26522] hover:bg-[#f44d00] text-white font-bold rounded-xl cursor-pointer hover:scale-[1.01] active:scale-[0.99] transition-all duration-200"
            onClick={handleUploadDocument}
            disabled={uploading}
          >
            {uploading ? "Uploading..." : "Upload"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
