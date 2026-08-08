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
  Layers,
  BookOpen,
  Tags,
  FileText,
  Eye,
  Lock,
  AlignLeft,
  AlertCircle,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import axiosClient from "@/api/axiosClient";
import { isDocumentQuotaExceeded } from "@/api/documentQuotaApi";
import QuotaExceededDialog from "@/components/quota/QuotaExceededDialog";
import useDocumentQuota from "@/hooks/useDocumentQuota";
import { toast } from "sonner";
import ConfirmModal from "@/components/share/ConfirmModal";

export default function UploadDocumentDialog({
  open,
  onOpenChange,
  onUploadSuccess,
  targetProjectId,
}) {
  const [schoolQuery, setSchoolQuery] = useState("");
  const [majorQuery, setMajorQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedMajor, setSelectedMajor] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [subjectName, setSubjectName] = useState("");
  const [subjectNameOpen, setSubjectNameOpen] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [title, setTitle] = useState("");
  const [visibility, setVisibility] = useState("PUBLIC");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [duplicateConfirmOpen, setDuplicateConfirmOpen] = useState(false);
  const [quotaDialog, setQuotaDialog] = useState({
    open: false,
    type: "DOCUMENT",
    message: "",
  });
  const {
    subscriptionTier,
    uploadsToday,
    dailyUploadLimit,
    totalDocuments,
    totalDocumentLimit,
    maxFileSizeBytes,
    loading: quotaLoading,
    refreshDocumentQuota,
  } = useDocumentQuota();
  const maxFileSizeMb = maxFileSizeBytes
    ? Math.round(maxFileSizeBytes / 1024 / 1024)
    : null;

  const [schoolOptions, setSchoolOptions] = useState([]);
  const [majorOptions, setMajorOptions] = useState([]);
  const [allCourses, setAllCourses] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);

  const [categoryOptions, setCategoryOptions] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [categoryQuery, setCategoryQuery] = useState("");

  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const results = await Promise.allSettled([
          axiosClient.get("/api/schools"),
          axiosClient.get("/api/courses/all"),
          axiosClient.get("/api/tags"),
          axiosClient.get("/api/categories/active"),
        ]);

        const [schoolsRes, coursesRes, tagsRes, categoriesRes] = results;

        if (schoolsRes.status === "fulfilled") {
          setSchoolOptions(
            Array.isArray(schoolsRes.value?.data)
              ? schoolsRes.value.data.map((school) => ({
                  id: school.id,
                  code: school.code,
                  name: school.name,
                }))
              : [],
          );
        }

        if (coursesRes.status === "fulfilled") {
          setAllCourses(
            Array.isArray(coursesRes.value?.data) ? coursesRes.value.data : [],
          );
        }

        if (tagsRes.status === "fulfilled") {
          setTagOptions(
            Array.isArray(tagsRes.value?.data)
              ? tagsRes.value.data.map((tag) => tag.name)
              : [],
          );
        }

        if (categoriesRes.status === "fulfilled") {
          setCategoryOptions(
            Array.isArray(categoriesRes.value?.data)
              ? categoriesRes.value.data.map((category) => ({
                  id: category.id,
                  code: category.code,
                  name: category.name,
                  icon: category.icon,
                  color: category.color,
                }))
              : [],
          );
        }
      } catch (error) {
        console.error("Failed to load options", error);
      }
    };

    if (open) {
      fetchOptions();
    } else {
      // Reset state when dialog closes
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSelectedFile(null);
      setTitle("");
      setVisibility("PUBLIC");
      setDescription("");

      setSchoolQuery("");
      setMajorQuery("");
      setSubjectQuery("");
      setCategoryQuery("");

      setSelectedSchool(null);
      setSelectedMajor(null);
      setSelectedSubject(null);
      setSelectedCategory(null);

      setSelectedTags([]);

      setSubjectName("");
      setSubjectNameOpen(false);

      setUploadError("");
      setDuplicateConfirmOpen(false);
      setMajorOptions([]);
      setSubjectOptions([]);
    }
  }, [open]);

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

    if (major) {
      const filteredCourses = allCourses.filter(
        (course) => course.major?.id === major.id,
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
  };

  const ALLOWED_EXTENSIONS = [".pdf", ".doc", ".docx", ".ppt", ".pptx"];
  const isSupportedFile = (file) => {
    if (!file || !file.name) return false;
    const name = file.name.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => name.endsWith(ext));
  };

  const handleFileSelect = (event) => {
    const file = event.target.files?.[0];
    if (file) {
      if (!isSupportedFile(file)) {
        toast.error("Supported file formats: .pdf, .doc, .docx, .ppt, .pptx");
        setSelectedFile(null);
        if (event.target) event.target.value = "";
        return;
      }
      setSelectedFile(file);
      if (!title.trim() || (selectedFile && title === selectedFile.name)) {
        setTitle(file.name);
      }
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

  const [suggestedTitle, setSuggestedTitle] = useState("");

  const executeUpload = async (uploadedById, overrideTitle) => {
    setUploading(true);
    setUploadError("");
    const toastId = toast.loading("Uploading document...");
    const courseCode = subjectQuery.split("-")[0]?.trim();

    try {
      const uploadPromise = async () => {
        const formData = new FormData();

        const finalTitle = overrideTitle?.trim() || title.trim() || selectedFile?.name || "";
        formData.append("file", selectedFile);
        formData.append("title", finalTitle);
        formData.append("visibility", visibility);

        if (description.trim()) {
          formData.append("description", description.trim());
        }

        if (uploadedById) {
          formData.append("uploadedById", uploadedById);
        }

        if (selectedSubject?.id) {
          formData.append("courseId", selectedSubject.id);
        } else {
          formData.append("courseCode", courseCode);
          if (selectedMajor?.id) {
            formData.append("majorId", selectedMajor.id);
          }
          if (subjectNameOpen && subjectName.trim()) {
            formData.append("courseName", subjectName.trim());
          }
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
            timeout: 180000,
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
              toast.error(
                linkError.response?.data?.message ||
                  "Uploaded but failed to attach to workspace",
              );
            }
          }
        }

        return uploadResponse;
      };

      const uploadedDoc = await uploadPromise();
      toast.success("Document uploaded successfully!", { id: toastId });
      await refreshDocumentQuota();

      const normalizedDoc = {
        visibility: visibility,
        title: title.trim() || selectedFile?.name,
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

      if (isDocumentQuotaExceeded(error)) {
        toast.dismiss(toastId);
        const message = error.response?.data?.message;
        setQuotaDialog({
          open: true,
          type: (message?.toLowerCase().includes("storage") || message?.toLowerCase().includes("capacity"))
            ? "STORAGE"
            : message?.toLowerCase().includes("file size")
              ? "FILE_SIZE"
              : "DOCUMENT",
          message,
          fileSize: selectedFile?.size,
        });
        await refreshDocumentQuota();
        return;
      }

      toast.error(
        error.response?.data?.message || "Upload failed. Please try again.",
        { id: toastId },
      );
      setUploadError(
        error.response?.data?.message || "Upload failed. Please try again.",
      );
    } finally {
      setUploading(false);
    }
  };

  const handleUploadDocument = async () => {
    if (!selectedFile || !isSupportedFile(selectedFile)) {
      const message = "Supported file formats: .pdf, .doc, .docx, .ppt, .pptx";
      setUploadError(message);
      toast.error(message);
      return;
    }

    if (!title.trim()) {
      const message = "Please enter a document title.";
      setUploadError(message);
      toast.error(message);
      return;
    }

    if (!selectedSchool) {
      const message = "Please select a school.";
      setUploadError(message);
      toast.error(message);
      return;
    }

    if (!selectedMajor) {
      const message = "Please select a major.";
      setUploadError(message);
      toast.error(message);
      return;
    }

    if (selectedFile) {
      const SYSTEM_MAX_BYTES = 10 * 1024 * 1024;
      if (selectedFile.size > SYSTEM_MAX_BYTES) {
        setQuotaDialog({
          open: true,
          type: "FILE_SIZE",
          message: "The system does not support files larger than 10MB.",
          fileSize: selectedFile.size,
        });
        return;
      }
      if (maxFileSizeBytes && selectedFile.size > maxFileSizeBytes) {
        setQuotaDialog({
          open: true,
          type: "FILE_SIZE",
          message: `Maximum file size for your plan is ${maxFileSizeMb}MB.`,
          fileSize: selectedFile.size,
        });
        return;
      }
    }

    if (!selectedSubject && !subjectNameOpen) {
      const message = "Please select or enter a course.";
      setUploadError(message);
      toast.error(message);
      return;
    }

    if (subjectNameOpen && !subjectName.trim()) {
      const message = "Please enter the course name.";
      setUploadError(message);
      toast.error(message);
      return;
    }

    const uploadedById = await resolveUploadedById();

    // Check duplicate
    try {
      const duplicateRes = await axiosClient.get(
        `/api/documents/check-duplicate?fileName=${encodeURIComponent(selectedFile.name)}&fileSize=${selectedFile.size}`
      );
      if (duplicateRes.data?.isDuplicate) {
        let baseTitle = title.trim() || selectedFile?.name || "Document";
        let autoTitle = baseTitle;
        if (!/\(\d+\)$/.test(autoTitle)) {
          autoTitle = `${autoTitle} (1)`;
        }
        setSuggestedTitle(autoTitle);
        setDuplicateConfirmOpen(true);
        return;
      }
    } catch (checkErr) {
      console.warn("Failed to complete duplicate check, continuing with normal upload...", checkErr);
    }

    await executeUpload(uploadedById);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl rounded-2xl p-6 max-h-[90vh] flex flex-col gap-0 overflow-hidden">
          <DialogHeader className="pb-4 flex-shrink-0">
            <DialogTitle className="text-2xl font-bold">
              Upload Document
            </DialogTitle>
            <DialogDescription>
              Share your knowledge. Fill out the specific areas so others can
              easily find it.
            </DialogDescription>
            <p className="pt-2 text-xs font-medium text-slate-500">
              {quotaLoading
                ? "Loading document limits..."
                : subscriptionTier === "PRO"
                  ? `PRO: Unlimited documents, max ${maxFileSizeMb || 10}MB`
                  : `Documents: ${uploadsToday ?? 0}/${dailyUploadLimit ?? "∞"} uploads today, ${totalDocuments ?? 0}/${totalDocumentLimit ?? "∞"} stored, max ${maxFileSizeMb || 10}MB`}
            </p>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar grid gap-5 py-4 min-h-0">
            {/* File Input */}
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <FileText size={16} className="text-[#f26522]" />
                Document File <span className="text-red-500">*</span>
              </Label>
              <div
                className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer"
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
                    PDF, DOCX, PPTX (max. {maxFileSizeMb || 10}MB)
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
            </div>

            {/* Document Title Input */}
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <FileText size={16} className="text-[#f26522]" />
                Document Title <span className="text-red-500">*</span>
              </Label>
              <Input
                placeholder="Enter document title..."
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
              />
            </div>

            {/* school Input */}
            <SearchSelect
              label={
                <>
                  School <span className="text-red-500">*</span>
                </>
              }
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
              label={
                <>
                  Major <span className="text-red-500">*</span>
                </>
              }
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
                label={
                  <>
                    Course <span className="text-red-500">*</span>
                  </>
                }
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

            {/* description Input */}
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <AlignLeft size={16} className="text-[#f26522]" />
                Description
              </Label>
              <Textarea
                placeholder="Enter description (optional)..."
                value={description}
                onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                maxLength={500}
                className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522] min-h-[80px] max-h-[120px] resize-none overflow-y-auto w-full"
              />
              <p className="text-xs text-slate-400 text-right">{description.length}/500</p>
            </div>

            {/* visibility Input */}
            <div className="space-y-1">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                {visibility === "PUBLIC" ? (
                  <Eye size={16} className="text-[#f26522]" />
                ) : (
                  <Lock size={16} className="text-[#f26522]" />
                )}
                Visibility <span className="text-red-500">*</span>
              </Label>
              <Select value={visibility} onValueChange={setVisibility}>
                <SelectTrigger className="w-full h-10 rounded-xl px-3 border-slate-200">
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
          </div>
          <DialogFooter className="pt-4 flex-shrink-0 !flex-col !space-x-0 sm:!flex-col gap-2.5 w-full">
            <Button
              className="w-full h-11 bg-[#f26522] hover:bg-[#f44d00] text-white font-bold rounded-xl cursor-pointer hover:scale-[1.005] active:scale-[0.995] transition-all duration-200"
              onClick={handleUploadDocument}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload"}
            </Button>
            {uploadError && (
              <div className="flex items-center gap-2 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-medium w-full animate-in fade-in slide-in-from-top-1 duration-200">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span className="leading-snug break-words flex-1">{uploadError}</span>
              </div>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Duplicate Document Options Dialog */}
      <Dialog open={duplicateConfirmOpen} onOpenChange={setDuplicateConfirmOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <FileText className="text-[#f26522]" size={22} />
              Duplicate Document Detected
            </DialogTitle>
            <DialogDescription className="text-xs text-slate-500">
              A file named <span className="font-semibold text-slate-700">"{selectedFile?.name}"</span> with the same size already exists in your library.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            {/* Separate Document Option */}
            <div className="p-3.5 border border-slate-200 rounded-xl bg-slate-50/80 space-y-2">
              <Label className="text-xs font-bold text-slate-700 block">
                Option 1: Upload as a Separate New Document
              </Label>
              <p className="text-[11px] text-slate-500">
                Specify a unique title to avoid confusion:
              </p>
              <Input
                value={suggestedTitle}
                onChange={(e) => setSuggestedTitle(e.target.value)}
                className="rounded-lg h-9 text-xs bg-white border-slate-300"
                placeholder="Enter unique document title..."
              />
              <Button
                size="sm"
                className="w-full bg-[#f26522] hover:bg-[#f44d00] text-white text-xs font-bold rounded-lg h-8.5 mt-1"
                onClick={async () => {
                  if (!suggestedTitle.trim()) {
                    toast.error("Please enter a valid title!");
                    return;
                  }
                  setDuplicateConfirmOpen(false);
                  setTitle(suggestedTitle.trim());
                  const uploadedById = await resolveUploadedById();
                  await executeUpload(uploadedById, suggestedTitle.trim());
                }}
              >
                Upload as New Document
              </Button>
            </div>

            {/* Hint for New Version */}
            <div className="p-3 border border-amber-200 rounded-xl bg-amber-50/50">
              <p className="text-[11px] text-amber-800 font-medium">
                💡 <span className="font-semibold">Want to upload this as a new version (v2.0)?</span>
                <br />
                Open the existing document from your library and click <span className="font-semibold text-amber-900">'Upload New Version'</span>.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              className="w-full rounded-xl text-xs border-slate-200"
              onClick={() => setDuplicateConfirmOpen(false)}
            >
              Cancel Upload
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <QuotaExceededDialog
        open={quotaDialog.open}
        onOpenChange={(quotaOpen) =>
          setQuotaDialog((current) => ({ ...current, open: quotaOpen }))
        }
        type={quotaDialog.type}
        message={quotaDialog.message}
        fileSize={quotaDialog.fileSize}
      />
    </>
  );
}
