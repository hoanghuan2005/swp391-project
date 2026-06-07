import React, { useEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  UploadCloud,
  GraduationCap,
  BookOpen,
  Tags,
  FileText,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { toast } from "sonner";

export default function UploadDocumentDialog({
  open,
  onOpenChange,
  onUploadSuccess,
  targetProjectId,
}) {
  const [schoolQuery, setSchoolQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectNameOpen, setSubjectNameOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [schoolOptions, setSchoolOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryQuery, setCategoryQuery] = useState("");

  const fileInputRef = useRef(null);

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
    } else {
      // Reset state when dialog closes
      setSelectedFile(null);

      setSchoolQuery("");
      setSubjectQuery("");
      setCategoryQuery("");

      setSelectedSchool(null);
      setSelectedSubject(null);
      setSelectedCategory(null);

      setSelectedTags([]);

      setSubjectName("");
      setSubjectNameOpen(false);

      setUploadError("");
    }
  }, [open]);

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
      const profileRes = await axiosClient.get("/api/profile");
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
      const message = "Please select a file to upload.";

      setUploadError(message);
      toast.error(message);

      return;
    }

    const courseCode = subjectQuery.split("-")[0]?.trim();

    if (!selectedSubject) {
      const message = "Please select a course.";

      setUploadError(message);
      toast.error(message);

      return;
    }

    const uploadedById = await resolveUploadedById();

    setUploading(true);
    setUploadError("");

    try {
      const uploadPromise = async () => {
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

        if (selectedCategory?.id) {
          formData.append("categoryId", selectedCategory.id);
        }

        selectedTags.forEach((tag) => formData.append("tagNames", tag));

        // Upload file
        const uploadResponse = await axiosClient.post(
          "/api/documents/upload",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        // Attach to workspace if exists
        if (targetProjectId) {
          const newDocumentId = uploadResponse.data?.id;

          if (newDocumentId) {
            try {
              await axiosClient.post(
                `/api/projects/${targetProjectId}/documents/${newDocumentId}`,
              );
            } catch (linkError) {
              console.error(
                "Failed to attach document to workspace",
                linkError,
              );

              toast.error("Uploaded but failed to attach to workspace");
            }
          }
        }

        return uploadResponse;
      };

      const uploadPromiseInstance = uploadPromise();

      toast.promise(uploadPromiseInstance, {
        loading: "Uploading document...",
        success: "Document uploaded successfully!",
        error: "Upload failed",
      });

      const uploadedDoc = await uploadPromiseInstance;

      const normalizedDoc = {
        visibility: "PUBLIC",
        title: selectedFile?.name,
        ...uploadedDoc?.data,
      };

      window.dispatchEvent(
        new CustomEvent("documents:uploaded", {
          detail: normalizedDoc,
        }),
      );

      onUploadSuccess?.(normalizedDoc);

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
            className="space-y-2 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
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

          {/* school Input */}
          <SearchSelect
            label="School"
            icon={<GraduationCap size={16} className="text-[#f26522]" />}
            placeholder="Enter school code or name"
            options={schoolOptions}
            value={schoolQuery}
            setValue={setSchoolQuery}
            onSelect={setSelectedSchool}
            displayValue={(school) => `${school.code} - ${school.name}`}
            searchKeys={["code", "name"]}
            renderLeft={(school) => (
              <span className="font-semibold text-slate-700">
                {school.code}
              </span>
            )}
            renderRight={(school) => (
              <span className="text-slate-500 text-[11px]">{school.name}</span>
            )}
          />

          {/* subject Input */}
          <SearchSelect
            label="Course"
            icon={<BookOpen size={16} className="text-[#f26522]" />}
            placeholder="Enter course code or name"
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
