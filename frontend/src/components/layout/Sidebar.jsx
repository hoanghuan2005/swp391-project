import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import axiosClient from "@/api/axiosClient";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import {
  House,
  BookMarked,
  FileText,
  MessageSquare,
  BadgeCheck,
  FolderOpen,
  LibraryBig,
  Plus,
  UploadCloud,
  CheckCircle,
  GraduationCap,
  BookOpen,
  Tags,
} from "lucide-react";
import { cn } from "@/lib/utils";

function NavItem({ to, icon: Icon, label, isOpen, pathname }) {
  const isActive = pathname === to || (to === "/" && pathname === "/");

  return (
    <Link
      to={to}
      title={!isOpen ? label : undefined}
      className="block w-full mb-1"
    >
      <Button
        variant="ghost"
        className={cn(
          "w-full h-12 rounded-xl transition-all duration-300 flex items-center",
          isOpen ? "justify-start px-4" : "justify-center px-0",
          isActive
            ? "bg-[#fff0e5] text-[#f26522] hover:bg-[#ffe1cc] hover:text-[#f26522]"
            : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900",
        )}
      >
        <Icon
          size={30}
          className={cn(
            "!w-[22px] !h-[22px] shrink-0 transition-all duration-300",
            isOpen ? "mr-4" : "-mr-1.5",
          )}
          strokeWidth={isActive ? 2.5 : 2}
        />
        <div
          className={cn(
            "transition-all duration-300 whitespace-nowrap overflow-hidden text-left",
            isOpen
              ? "w-auto opacity-100 text-[15px] font-semibold"
              : "w-0 opacity-0 text-[0px]",
          )}
        >
          {label}
        </div>
      </Button>
    </Link>
  );
}

export default function Sidebar({ isOpen = true }) {
  const location = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);

  // State cho việc subject chưa có trong DB
  const [subjectNameOpen, setSubjectNameOpen] = useState(false);
  const [schoolQuery, setSchoolQuery] = useState("");
  const [subjectQuery, setSubjectQuery] = useState("");
  const [tagQuery, setTagQuery] = useState("");
  const [selectedSchool, setSelectedSchool] = useState(null);
  const [selectedSubject, setSelectedSubject] = useState(null);
  const [selectedTags, setSelectedTags] = useState([]);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [subjectOpen, setSubjectOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [subjectName, setSubjectName] = useState("");
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [subjectOptions, setSubjectOptions] = useState([]);
  const [tagOptions, setTagOptions] = useState([]);
  const fileInputRef = useRef(null);

  useEffect(() => {
    const fetchOptions = async () => {
      try {
        const [schoolsRes, subjectsRes, tagsRes] = await Promise.all([
          axiosClient.get("/api/schools"),
          axiosClient.get("/api/subjects"),
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
          Array.isArray(subjectsRes.data)
            ? subjectsRes.data.map((subject) => ({
                code: subject.code,
                name: subject.name,
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

    fetchOptions();
  }, []);

  const filteredSchools = schoolOptions.filter((option) => {
    const query = schoolQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      option.code.toLowerCase().includes(query) ||
      option.name.toLowerCase().includes(query)
    );
  });

  const filteredSubjects = subjectOptions.filter((option) => {
    const query = subjectQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return (
      option.code.toLowerCase().includes(query) ||
      option.name.toLowerCase().includes(query)
    );
  });

  const filteredTags = tagOptions.filter((option) => {
    const query = tagQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return option.toLowerCase().includes(query);
  });

  const addTag = (name) => {
    const trimmed = name.trim();
    if (!trimmed) {
      return;
    }

    setSelectedTags((prev) =>
      prev.some((tag) => tag.toLowerCase() === trimmed.toLowerCase())
        ? prev
        : [...prev, trimmed],
    );
    setTagQuery("");
  };

  const handleUploadMenuItemClick = () => {
    setUploadOpen(true);
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
    if (storedId) {
      return storedId;
    }

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

    const subjectCode = subjectQuery.split("-")[0]?.trim();
    if (!subjectCode) {
      setUploadError("Please enter a subject code.");
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
      formData.append("subjectCode", subjectCode);

      if (subjectNameOpen && subjectName.trim()) {
        formData.append("subjectName", subjectName.trim());
      }

      selectedTags.forEach((tag) => formData.append("tagNames", tag));

      await axiosClient.post("/api/documents/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      window.dispatchEvent(new CustomEvent("documents:uploaded"));
      setSelectedFile(null);
      setSubjectQuery("");
      setSubjectName("");
      setSelectedTags([]);
      setUploadOpen(false);
    } catch (error) {
      console.error("Upload failed", error);
      setUploadError("Upload failed. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <aside
      className={cn(
        "h-[calc(100vh-68px)] overflow-y-auto pb-10 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-r border-gray-100 transition-all duration-300 ease-in-out shadow-sm",
        isOpen ? "w-[280px] px-3 pt-3" : "w-[72px] px-2 pt-3",
        "hidden lg:block shrink-0 transition-all duration-300 ease-in-out",
      )}
    >
      {/* User Profile Block */}
      <div
        className={cn(
          "mb-6 mt-2 transition-all duration-300 ease-in-out overflow-hidden flex flex-col items-center",
          isOpen ? "px-2" : "",
        )}
      >
        <div
          className={cn(
            "flex items-center w-full transition-all duration-300",
            isOpen ? "justify-start gap-4 mb-5" : "justify-center",
          )}
        >
          <div className="h-[42px] w-[42px] shrink-0 rounded-full bg-[#f26522] text-white flex items-center justify-center font-bold text-lg shadow-sm">
            H
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 whitespace-nowrap",
              isOpen ? "w-auto opacity-100 pr-4" : "w-0 opacity-0",
            )}
          >
            <div className="text-sm font-bold text-slate-800">Huân Hoàng</div>
            <div className="text-xs text-[#f26522] font-semibold flex items-center gap-1 mt-0.5">
              <House className="w-3 h-3 shrink-0" />
              <span>FPT</span>
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex items-center justify-between text-center w-full transition-all duration-300 overflow-hidden whitespace-nowrap",
            isOpen ? "h-[50px] opacity-100 px-2 mb-4" : "h-0 opacity-0 m-0",
          )}
        >
          <div className="flex flex-col items-center">
            <div className="text-base font-extrabold text-slate-800">0</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
              Followers
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-base font-extrabold text-slate-800">3</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
              Uploads
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-base font-extrabold text-slate-800">0</div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
              Upvotes
            </div>
          </div>
        </div>

        <div
          className={cn(
            "flex justify-center transition-all duration-300",
            isOpen ? "w-full" : "w-10 pt-4",
          )}
        >
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              {isOpen ? (
                <Button className="w-full rounded-full bg-[#f26522] hover:bg-[#fd5101] text-white shadow-sm h-11 text-sm font-bold transition-all flex items-center justify-center gap-2 cursor-pointer hover:scale-[1.02]">
                  <Plus className="h-5 w-5" strokeWidth={2.5} /> New Create
                </Button>
              ) : (
                <Button className="w-10 h-10 rounded-full p-0 bg-[#f26522] hover:bg-[#fd5101] text-white shadow-sm shrink-0 flex items-center justify-center transition-transform hover:scale-105">
                  <Plus className="h-5 w-5" strokeWidth={3} />
                </Button>
              )}
            </DropdownMenuTrigger>
            <DropdownMenuContent
              side="right"
              align="start"
              className="w-80 p-2 rounded-2xl ml-2 shadow-xl border-gray-100"
            >
              <DropdownMenuItem
                onSelect={handleUploadMenuItemClick}
                className="p-3 cursor-pointer rounded-xl flex items-start gap-4 hover:bg-slate-50 transition-colors focus:bg-slate-50"
              >
                <div className="bg-blue-100/50 p-2.5 rounded-full text-blue-500 shrink-0">
                  <UploadCloud className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[15px] text-slate-800">
                    Upload
                  </span>
                  <span className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                    Contribute to the community by sharing your study materials
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-slate-100" />

              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl flex items-start gap-4 hover:bg-slate-50 transition-colors focus:bg-slate-50">
                <div className="bg-purple-100/50 p-2.5 rounded-full text-purple-400 shrink-0">
                  <MessageSquare className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] text-slate-800">
                      AI question
                    </span>
                  </div>
                  <span className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                    Ask a study question and get an answer in seconds
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-slate-100" />

              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl flex items-start gap-4 hover:bg-slate-50 transition-colors focus:bg-slate-50">
                <div className="bg-purple-100/50 p-2.5 rounded-full text-purple-400 shrink-0">
                  <FileText className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] text-slate-800">
                      AI Notes
                    </span>
                  </div>
                  <span className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                    Turn all your material into organized summaries
                  </span>
                </div>
              </DropdownMenuItem>

              <DropdownMenuSeparator className="my-1 bg-slate-100" />

              <DropdownMenuItem className="p-3 cursor-pointer rounded-xl flex items-start gap-4 hover:bg-slate-50 transition-colors focus:bg-slate-50">
                <div className="bg-purple-100/50 p-2.5 rounded-full text-purple-500 shrink-0">
                  <CheckCircle className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] text-slate-800">
                      AI Quiz
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-pink-100 text-pink-600 hover:bg-pink-100 text-[10px] h-5 px-1.5 border-none font-bold"
                    >
                      New
                    </Badge>
                  </div>
                  <span className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                    Generate and edit quizzes instantly to test your knowledge
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <nav className={cn("w-full flex flex-col", !isOpen && "items-center")}>
        <NavItem
          to="/home"
          icon={House}
          label="Home"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/my-library"
          icon={LibraryBig}
          label="Library"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/ai-notes"
          icon={FileText}
          label="AI Notes"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/ask-ai"
          icon={MessageSquare}
          label="Ask AI"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/ai-quiz"
          icon={BadgeCheck}
          label="AI Quiz"
          isOpen={isOpen}
          pathname={location.pathname}
        />
      </nav>

      <Separator className="bg-slate-100 w-full my-2" />

      {/* Explorer heading gracefully fades out */}
      <div
        className={cn(
          "px-4 font-bold text-slate-800 mb-2 transition-all duration-300 whitespace-nowrap overflow-hidden",
          isOpen ? "h-6 opacity-100 text-sm mt-3" : "h-0 opacity-0 m-0",
        )}
      >
        Explore
      </div>
      <nav className={cn("w-full flex flex-col", !isOpen && "items-center")}>
        <NavItem
          to="/courses"
          icon={FolderOpen}
          label="Courses"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/projects"
          icon={BookMarked}
          label="Projects"
          isOpen={isOpen}
          pathname={location.pathname}
        />
      </nav>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
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
                  <p className="text-xs text-slate-700 mt-2">
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

            <div className="space-y-2">
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
                  onBlur={() => setSchoolOpen(false)}
                  className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
                />
                {schoolOpen && (
                  <div
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg"
                  >
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
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
                            onClick={() => {
                              setSelectedSchool(option);
                              setSchoolQuery(`${option.code} - ${option.name}`);
                              setSchoolOpen(false);
                            }}
                          >
                            <span className="font-semibold text-slate-700">
                              {option.code}
                            </span>
                            <span className="text-slate-500">
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

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <BookOpen size={16} className="text-[#f26522]" /> Subject
              </Label>
              <div className="relative">
                <Input
                  placeholder="Enter subject code or name"
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
                  onBlur={() => setSubjectOpen(false)}
                  className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
                />
                {subjectOpen && (
                  <div
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg"
                  >
                    <div className="max-h-48 overflow-y-auto">
                      {filteredSubjects.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-slate-500">
                          No subjects found
                        </div>
                      ) : (
                        filteredSubjects.map((option) => (
                          <Button
                            key={option.code}
                            type="button"
                            variant="ghost"
                            size="sm"
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
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
                            <span className="text-slate-500">
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
                  <FileText size={16} className="text-[#f26522]" /> Subject Name
                </Label>
                <Input
                  placeholder="New subject! Enter full name here:"
                  className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
                  value={subjectName}
                  onChange={(e) => setSubjectName(e.target.value)}
                />
              </div>
            )}

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <Tags size={16} className="text-[#f26522]" /> Tags
              </Label>
              <div className="relative">
                <div className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-300 px-2.5 py-1 focus-within:border-[#f26522] focus-within:ring-1 focus-within:ring-[#f26522]">
                  {selectedTags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="flex items-center gap-1 rounded-full bg-[#f26522]/10 text-[#888888]"
                    >
                      {tag}
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon-xs"
                        className="-ml-1 -mr-2 text-[#6a6a6a] hover:text-[#4c4c4c] rounded-full p-0 cursor-pointer"
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
                    onBlur={() => setTagOpen(false)}
                    className="h-6 flex-1 border-0 p-0 text-xs focus-visible:ring-0"
                  />
                </div>
                {tagOpen && (
                  <div
                    onMouseDown={(e) => e.preventDefault()}
                    className="absolute z-20 mt-2 w-full rounded-lg border border-slate-200 bg-white shadow-lg"
                  >
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
                            className="flex w-full items-center justify-between px-3 py-2 text-left text-xs hover:bg-slate-50"
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
              <p className="text-xs text-red-500 w-full text-left">
                {uploadError}
              </p>
            )}
            <Button
              className="w-full h-9 bg-[#f26522] hover:bg-[#f44d00] text-white rounded-xl cursor-pointer hover:scale-[1.02] transition-transform duration-300"
              onClick={handleUploadDocument}
              disabled={uploading}
            >
              {uploading ? "Uploading..." : "Upload to Cloudinary"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </aside>
  );
}
