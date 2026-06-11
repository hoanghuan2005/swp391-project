import React, { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import axiosClient from "@/api/axiosClient";
import { cn } from "@/lib/utils";
import CreateProjectModal from "@/components/projects/CreateProjectModal";
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
  FileText,
  MessageSquare,
  BadgeCheck,
  FolderOpen,
  LibraryBig,
  Plus,
  UploadCloud,
  CheckCircle,
  Search,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Layout,
} from "lucide-react";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";

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
            "!w-[21px] !h-[21px] shrink-0 transition-all duration-300",
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

function SidebarDropdown({
  icon: Icon,
  label,
  isOpen,
  children,
  defaultOpen = false,
}) {
  const [expanded, setExpanded] = useState(defaultOpen);

  return (
    <div className="w-full mb-1">
      <Button
        variant="ghost"
        onClick={() => setExpanded((prev) => !prev)}
        className={cn(
          "w-full h-12 rounded-xl transition-all duration-300 flex items-center",
          isOpen ? "justify-between px-4" : "justify-center px-0",
          expanded
            ? "bg-[#fff7f2] text-[#f26522]"
            : "text-slate-600 font-medium hover:bg-slate-100 hover:text-slate-900",
        )}
      >
        {/* LEFT */}
        <div className="flex items-center">
          <Icon
            size={30}
            className={cn(
              "!w-[22px] !h-[22px] shrink-0 transition-all duration-300",
              isOpen ? "mr-4" : "-mr-1.5",
            )}
            strokeWidth={expanded ? 2.5 : 2}
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
        </div>

        {/* ARROW */}
        {isOpen && (
          <ChevronDown
            size={18}
            className={cn(
              "transition-transform duration-300 shrink-0",
              expanded && "rotate-180",
            )}
          />
        )}
      </Button>

      {/* DROPDOWN */}
      <div
        className={cn(
          "overflow-hidden transition-all duration-300",
          expanded ? "max-h-[200px] opacity-100 mt-1" : "max-h-0 opacity-0",
        )}
      >
        <div
          className={cn(
            "flex flex-col gap-1",
            isOpen ? "ml-11 mr-2" : "items-center",
          )}
        >
          {children}
        </div>
      </div>
    </div>
  );
}

export default function Sidebar({ isOpen = true }) {
  const location = useLocation();
  const [uploadOpen, setUploadOpen] = useState(false);
  const [courseLibraryOpen, setCourseLibraryOpen] = useState(false);
  const [courseSearch, setCourseSearch] = useState("");
  const [coursePage, setCoursePage] = useState(0);
  const [coursePageSize] = useState(6);
  const [coursePageData, setCoursePageData] = useState({
    content: [],
    totalPages: 0,
    totalElements: 0,
  });
  const [courseLoading, setCourseLoading] = useState(false);
  const [followedCourses, setFollowedCourses] = useState([]);
  const [workspaceModalOpen, setWorkspaceModalOpen] = useState(false);
  const [workspaces, setWorkspaces] = useState([]);

  // STATE LƯU TRỮ THÔNG TIN PROFILE DÀNH CHO SIDEBAR
  const [sidebarProfile, setSidebarProfile] = useState({
    fullName: "Student",
    schoolCode: "...",
    followers: 0,
    uploads: 0,
    upvotes: 0,
  });

  const navigate = useNavigate();

  // FIX: Tạo các refs để quản lý sự kiện click ngoài dropdown danh sách kết quả
  const schoolRef = useRef(null);
  const subjectRef = useRef(null);
  const tagRef = useRef(null);

  // 🔥 LẤY DỮ LIỆU PROFILE & LẮNG NGHE SỰ KIỆN UPLOAD ĐỂ CẬP NHẬT SỐ LƯỢNG FILE
  useEffect(() => {
    const fetchSidebarProfile = async () => {
      try {
        const res = await axiosClient.get("/api/profile");
        if (res.data) {
          setSidebarProfile({
            fullName: res.data.fullName || "Student",
            schoolCode: res.data.schoolName || "N/A",
            followers: res.data.followers || 0,
            uploads: res.data.uploads || 0,
            upvotes: res.data.upvotes || 0,
          });
        }
      } catch (error) {
        console.error("Failed to load sidebar profile", error);
      }
    };

    const handleDocumentUploaded = () => {
      setSidebarProfile((prev) => ({
        ...prev,
        uploads: (prev.uploads || 0) + 1,
      }));

      fetchSidebarProfile();
    };

    // Chạy lần đầu khi load component
    fetchSidebarProfile();

    // Lắng nghe sự kiện "documents:uploaded" từ hàm handleUploadDocument bên dưới
    window.addEventListener("documents:uploaded", handleDocumentUploaded);

    // Cleanup event khi component unmount
    return () =>
      window.removeEventListener("documents:uploaded", handleDocumentUploaded);
  }, []);

  // load danh sách course đã follow
  useEffect(() => {
    const fetchFollowedCourses = async () => {
      try {
        const res = await axiosClient.get("/api/courses/followed");

        setFollowedCourses(res.data || []);
      } catch (error) {
        console.error("Failed to load followed courses", error);
      }
    };

    // load lần đầu
    fetchFollowedCourses();

    // lắng nghe event follow/unfollow
    window.addEventListener("courses:updated", fetchFollowedCourses);

    return () => {
      window.removeEventListener("courses:updated", fetchFollowedCourses);
    };
  }, []);

  useEffect(() => {
    if (!courseLibraryOpen) return;

    const fetchCourses = async () => {
      setCourseLoading(true);
      try {
        const response = await axiosClient.get("/api/courses", {
          params: {
            search: courseSearch || undefined,
            page: coursePage,
            size: coursePageSize,
          },
        });
        setCoursePageData({
          content: response.data?.content || [],
          totalPages: response.data?.totalPages || 0,
          totalElements: response.data?.totalElements || 0,
        });
      } catch (error) {
        console.error("Failed to load courses", error);
        setCoursePageData({ content: [], totalPages: 0, totalElements: 0 });
      } finally {
        setCourseLoading(false);
      }
    };

    fetchCourses();
  }, [courseLibraryOpen, courseSearch, coursePage, coursePageSize]);

  useEffect(() => {
    if (courseLibraryOpen) {
      setCoursePage(0);
    }
  }, [courseSearch, courseLibraryOpen]);

  const handleUploadMenuItemClick = () => {
    setUploadOpen(true);
  };

  const fetchWorkspaces = async () => {
    try {
      const res = await axiosClient.get("/api/projects/my-projects");
      setWorkspaces(res.data || []);
    } catch (error) {
      console.error("Failed to load workspaces", error);
    }
  };

  useEffect(() => {
    fetchWorkspaces();

    window.addEventListener("workspaces:updated", fetchWorkspaces);

    return () => {
      window.removeEventListener("workspaces:updated", fetchWorkspaces);
    };
  }, []);

  const handleFollowCourse = async (event, course) => {
    event.stopPropagation();
    event.preventDefault();

    try {
      await axiosClient.post(`/api/courses/${course.id}/follow`);

      setFollowedCourses((prev) => {
        const exists = prev.some((c) => c.id === course.id);

        if (exists) return prev;

        return [...prev, course];
      });

      // refresh sidebar
      window.dispatchEvent(new CustomEvent("courses:updated"));
    } catch (error) {
      console.error("Failed to follow course", error);
    }
  };

  return (
    <aside
      className={cn(
        "h-[calc(100vh-68px)] overflow-y-auto pb-10 bg-white [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none] border-r border-gray-100 transition-all duration-300 ease-in-out shadow-sm",
        isOpen ? "w-[280px] px-3 pt-3" : "w-[72px] px-2 pt-3",
        "hidden lg:block shrink-0",
      )}
    >
      {/* User Profile Block */}
      <div
        className={cn(
          "mb-6 mt-2 flex flex-col items-center",
          isOpen ? "px-2" : "",
        )}
      >
        <div
          className={cn(
            "flex items-center w-full",
            isOpen ? "justify-start gap-4 mb-5" : "justify-center",
          )}
        >
          <div className="h-[42px] w-[42px] shrink-0 rounded-full bg-[#f26522] text-white flex items-center justify-center font-bold text-lg shadow-sm uppercase">
            {sidebarProfile.fullName.charAt(0)}
          </div>
          <div
            className={cn(
              "overflow-hidden transition-all duration-300 whitespace-nowrap",
              isOpen ? "w-auto opacity-100 pr-4" : "w-0 opacity-0",
            )}
          >
            <div className="text-sm font-bold text-slate-800">
              {sidebarProfile.fullName}
            </div>
            <div className="text-xs text-[#f26522] font-semibold flex items-center gap-1 mt-0.5">
              <House className="w-3 h-3 shrink-0" />
              <span className="truncate max-w-[120px]">
                {sidebarProfile.schoolCode}
              </span>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div
          className={cn(
            "flex items-center justify-between text-center w-full overflow-hidden whitespace-nowrap transition-all duration-300",
            isOpen ? "h-[50px] opacity-100 px-2 mb-4" : "h-0 opacity-0 m-0",
          )}
        >
          <div className="flex flex-col items-center">
            <div className="text-base font-extrabold text-slate-800">
              {sidebarProfile.followers}
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
              Followers
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-base font-extrabold text-slate-800">
              {sidebarProfile.uploads}
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
              Uploads
            </div>
          </div>
          <div className="flex flex-col items-center">
            <div className="text-base font-extrabold text-slate-800">
              {sidebarProfile.upvotes}
            </div>
            <div className="text-[10px] text-slate-500 font-semibold uppercase tracking-wide">
              Upvotes
            </div>
          </div>
        </div>

        {/* Action Button */}
        <div
          className={cn("flex justify-center", isOpen ? "w-full" : "w-10 pt-4")}
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
                className="p-3 cursor-pointer rounded-xl flex items-start gap-4 hover:bg-slate-50 transition-colors"
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
              <DropdownMenuItem
                className="p-3 cursor-pointer rounded-xl flex items-start gap-4 hover:bg-slate-50 transition-colors"
                onClick={() => navigate("/ask-ai")}
              >
                <div className="bg-purple-100/50 p-2.5 rounded-full text-purple-400 shrink-0">
                  <MessageSquare className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <span className="font-semibold text-[15px] text-slate-800">
                    AI question
                  </span>
                  <span className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                    Ask a study question and get an answer in seconds
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="my-1 bg-slate-100" />
              <DropdownMenuItem
                className="p-3 cursor-pointer rounded-xl flex items-start gap-4 hover:bg-slate-50 transition-colors"
                onClick={() => navigate("/ai-tools/ai-quiz")}
              >
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
                      className="bg-pink-100 text-pink-600 text-[10px] h-5 px-1.5 font-bold border-none"
                    >
                      New
                    </Badge>
                  </div>
                  <span className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                    Generate and edit quizzes instantly to test your knowledge
                  </span>
                </div>
              </DropdownMenuItem>
              <DropdownMenuItem
                className="p-3 cursor-pointer rounded-xl flex items-start gap-4 hover:bg-slate-50 transition-colors"
                onClick={() => navigate("/ai-tools/ai-flashcard")}
              >
                <div className="bg-purple-100/50 p-2.5 rounded-full text-purple-500 shrink-0">
                  <CheckCircle className="h-6 w-6" strokeWidth={2} />
                </div>
                <div className="flex flex-col">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-[15px] text-slate-800">
                      AI Flashcards
                    </span>
                    <Badge
                      variant="secondary"
                      className="bg-pink-100 text-pink-600 text-[10px] h-5 px-1.5 font-bold border-none"
                    >
                      New
                    </Badge>
                  </div>
                  <span className="text-[13px] text-slate-500 mt-0.5 leading-snug">
                    Generate and edit flashcards instantly to test your
                    knowledge
                  </span>
                </div>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Navigation Groups */}
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
          to="/ask-ai"
          icon={MessageSquare}
          label="Ask AI"
          isOpen={isOpen}
          pathname={location.pathname}
        />
        <NavItem
          to="/ai-tools"
          icon={BadgeCheck}
          label="AI Tools"
          isOpen={isOpen}
          pathname={location.pathname}
        />
      </nav>

      <Separator className="bg-slate-100 w-full my-2" />

      <div
        className={cn(
          "px-4 font-bold text-slate-800 mb-2 overflow-hidden whitespace-nowrap transition-all duration-300",
          isOpen ? "h-6 opacity-100 text-sm mt-3" : "h-0 opacity-0 m-0",
        )}
      >
        My Library
      </div>
      <nav className={cn("w-full flex flex-col", !isOpen && "items-center")}>
        {/* Courses */}
        <SidebarDropdown icon={FolderOpen} label="Courses" isOpen={isOpen}>
          {followedCourses.map((course) => (
            <Button
              key={course.id}
              variant="ghost"
              onClick={() => navigate(`/courses/${course.id}`)}
              className="justify-start rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-[#f26522] cursor-pointer"
            >
              {course.code}
            </Button>
          ))}

          <Button
            variant="ghost"
            onClick={() => setCourseLibraryOpen(true)}
            className="justify-start rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-[#f26522] cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Course
          </Button>
        </SidebarDropdown>

        {/* Workspace */}
        <SidebarDropdown icon={Layout} label="Workspace" isOpen={isOpen}>
          {workspaces.map((workspace) => (
            <Button
              key={workspace.id}
              variant="ghost"
              onClick={() => navigate(`/workspace/${workspace.id}`)}
              className="justify-start rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-[#f26522] cursor-pointer"
            >
              {workspace.name}
            </Button>
          ))}

          <Button
            variant="ghost"
            onClick={() => setWorkspaceModalOpen(true)}
            className="justify-start rounded-lg text-sm text-slate-600 hover:bg-slate-100 hover:text-[#f26522] cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-2" />
            Add Workspace
          </Button>
        </SidebarDropdown>

        {/* Create Workspace Modal */}
        <CreateProjectModal
          open={workspaceModalOpen}
          onOpenChange={setWorkspaceModalOpen}
          onSuccess={(newProject) => {
            console.log("Created:", newProject);
            // refresh local state
            fetchWorkspaces();
            // notify toàn app
            window.dispatchEvent(new CustomEvent("workspaces:updated"));
          }}
        />
      </nav>

      {/* Course Library Dialog */}
      <Dialog open={courseLibraryOpen} onOpenChange={setCourseLibraryOpen}>
        <DialogContent className="sm:max-w-2xl rounded-2xl p-6">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">
              Add courses to your library
            </DialogTitle>
            <DialogDescription>
              Browse all available courses, search by code or name, and follow
              what you need.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                value={courseSearch}
                onChange={(event) => setCourseSearch(event.target.value)}
                placeholder="Search by course code or name"
                className="pl-9 rounded-xl border-slate-200 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
              />
            </div>

            <div className="space-y-3 max-h-[360px] overflow-y-auto pr-1">
              {courseLoading ? (
                <div className="text-sm text-slate-500">Loading courses...</div>
              ) : coursePageData.content.length === 0 ? (
                <div className="text-sm text-slate-500">No courses found.</div>
              ) : (
                coursePageData.content.map((course) => {
                  const isFollowed = followedCourses.some(
                    (c) => c.id === course.id,
                  );

                  return (
                    <div
                      key={course.id || course.code}
                      onClick={() => {
                        setCourseLibraryOpen(false);
                        navigate(`/courses/${course.id}`);
                      }}
                      className="flex items-center justify-between rounded-lg border border-slate-200/70 bg-white p-3 cursor-pointer hover:border-[#f26522] hover:bg-orange-50/30 transition-all"
                    >
                      <div>
                        <div className="text-sm font-semibold text-slate-800">
                          {course.name}
                        </div>

                        <div className="text-xs text-slate-500">
                          {course.code}
                        </div>
                      </div>

                      {isFollowed ? (
                        <Button
                          size="sm"
                          disabled
                          className="rounded-full bg-green-100 text-green-700 border border-green-200 cursor-default"
                        >
                          Followed
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          className="rounded-full bg-[#f26522] text-white hover:bg-[#d95316] cursor-pointer hover:scale-[1.02] transition-all"
                          onClick={(event) => handleFollowCourse(event, course)}
                        >
                          Follow
                        </Button>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-gray-200 hover:bg-slate-100 cursor-pointer"
              onClick={() => setCoursePage((prev) => Math.max(prev - 1, 0))}
              disabled={coursePage === 0}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Prev
            </Button>
            <div className="text-xs text-slate-500">
              {coursePageData.totalElements} courses · Page {coursePage + 1} of{" "}
              {Math.max(coursePageData.totalPages, 1)}
            </div>
            <Button
              variant="outline"
              size="sm"
              className="rounded-full border-gray-200 hover:bg-slate-100 cursor-pointer"
              onClick={() => setCoursePage((prev) => prev + 1)}
              disabled={coursePage + 1 >= coursePageData.totalPages}
            >
              Next
              <ChevronRight className="w-4 h-4 ml-1" />
            </Button>
          </div>

          <DialogFooter className="pt-2">
            <Button
              variant="ghost"
              className="rounded-xl border-gray-200 hover:bg-slate-100 cursor-pointer px-4"
              onClick={() => setCourseLibraryOpen(false)}
            >
              Done
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Form Dialog Upload Document */}
      <UploadDocumentDialog open={uploadOpen} onOpenChange={setUploadOpen} />
    </aside>
  );
}
