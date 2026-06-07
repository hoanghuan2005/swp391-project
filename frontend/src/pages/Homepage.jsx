import React, { useState, useEffect, useCallback, useMemo } from "react"; // THÊM useMemo
import { Link, useOutletContext } from "react-router-dom"; // THÊM useOutletContext
import { Button } from "@/components/ui/button";
import { forceDownload } from "@/lib/downloadHelper";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  BookOpen,
  Download,
  Eye,
  FileText,
  Heart,
  MessageCircle,
  X,
} from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { askAi, createAiConversation } from "@/api/aiApi";
import RecentDocuments from "@/components/documents/RecentDocuments";
import UploadDocumentDialog from "@/components/documents/UploadDocumentDialog";
import CourseCard from "@/components/ui/CourseCard";
import ChatInterface from "@/components/chat/ChatInterface";
import { toast } from "react-hot-toast";

const HOMEPAGE_WELCOME_MESSAGE = {
  id: "homepage-welcome",
  role: "ASSISTANT",
  content:
    "Hi, I am StudyMate AI. Ask me about study planning, document discovery, or any topic you are learning.",
};

const DEFAULT_FILTER_DATA = { school: "", course: "", tag: "" };

export default function Homepage() {
  // ==========================================
  // THÊM: LẤY SEARCH & FILTER TỪ LAYOUT
  // ==========================================
  const context = useOutletContext();
  const searchQuery = context?.searchQuery || "";
  const filterData = context?.filterData || DEFAULT_FILTER_DATA;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [courses, setCourses] = useState([]);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState(() => [
    HOMEPAGE_WELCOME_MESSAGE,
  ]);
  const [chatConversationId, setChatConversationId] = useState(null);
  const [isChatSending, setIsChatSending] = useState(false);

  const upsertPublicDocument = useCallback((doc) => {
    if (!doc) return;

    const isPublic = doc.visibility ? doc.visibility === "PUBLIC" : true;

    if (!isPublic) return;

    setDocuments((prev) => {
      const exists = prev.find((item) => item.id === doc.id);

      if (exists) {
        return prev.map((item) => (item.id === doc.id ? doc : item));
      }

      return [doc, ...prev];
    });
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/courses", {
        params: {
          t: Date.now(),
        },
      });

      setCourses(response.data?.content || []);
    } catch (error) {
      console.error("Error fetching courses:", error);
      setCourses([]);
    }
  }, []);

  // Lấy danh sách tài liệu từ Backend
  const fetchDocuments = useCallback(async (options = {}) => {
    const { silent = false } = options;

    try {
      if (!silent) setIsLoading(true);

      const response = await axiosClient.get("/api/documents", {
        params: {
          t: Date.now(),
        },
      });

      const publicDocs = (response.data || [])
        .filter((doc) => doc.visibility === "PUBLIC")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

      setDocuments(publicDocs);
    } catch (error) {
      console.error("Error fetching documents:", error);
      setDocuments([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(() => {
      fetchDocuments();
      fetchCourses();
    });

    const handleUploaded = (event) => {
      const uploadedDoc = event?.detail;

      upsertPublicDocument(uploadedDoc);
      fetchDocuments({ silent: true });
    };

    window.addEventListener("documents:uploaded", handleUploaded);

    return () => {
      window.removeEventListener("documents:uploaded", handleUploaded);
    };
  }, [fetchDocuments, fetchCourses, upsertPublicDocument]);

  // Hàm xử lý tải file (Tăng view và tải về máy)
  const handleDownload = async (id, title) => {
    try {
      const res = await axiosClient.get(`/api/documents/${id}/download`);
      const url = res.data.downloadUrl;
      if (url) {
        await forceDownload(url, title || "document");
      }
    } catch (error) {
      console.error("Download failed:", error);
      alert("Error downloading document!");
    }
  };

  const handleSendChatMessage = useCallback(
    async (message) => {
      if (!message || isChatSending) return;

      const userMessage = {
        id: `user-${Date.now()}`,
        role: "USER",
        content: message,
      };

      setChatMessages((prev) => [...prev, userMessage]);
      setIsChatSending(true);

      try {
        let conversationId = chatConversationId;

        if (!conversationId) {
          const conversation = await createAiConversation({
            title: "Homepage Chat",
          });
          conversationId = conversation.id;
          setChatConversationId(conversationId);
        }

        const response = await askAi({
          conversationId,
          message,
          mode: "HOMEPAGE_ASSISTANT",
        });

        const assistantMessage = {
          id: response.assistantMessageId || `assistant-${Date.now()}`,
          role: "ASSISTANT",
          content: response.answer || "I could not generate a response.",
          sources: response.sources || [],
        };

        setChatMessages((prev) => [...prev, assistantMessage]);
      } catch (error) {
        console.error("Homepage AI chat failed:", error);
        toast.error("AI failed to respond. Please try again.");
        setChatMessages((prev) => [
          ...prev,
          {
            id: `assistant-error-${Date.now()}`,
            role: "ASSISTANT",
            content: "Sorry, I could not respond right now. Please try again.",
          },
        ]);
      } finally {
        setIsChatSending(false);
      }
    },
    [chatConversationId, isChatSending],
  );

 const filteredDocuments = useMemo(() => {
    return documents.filter((doc) => {
      // 1. Tìm kiếm theo tiêu đề (Search Bar) - OK
      const matchesSearch = doc.title
        ?.toLowerCase()
        .includes(searchQuery.toLowerCase());
        
      // 2. Lọc theo Course - OK (BE có code và name)
      const matchesCourse = filterData.course 
        ? doc.course?.code?.toLowerCase().includes(filterData.course.toLowerCase()) 
          || doc.course?.name?.toLowerCase().includes(filterData.course.toLowerCase())
        : true;
        
      // 3. Lọc theo Tags - ĐÃ SỬA: Vì BE trả về mảng String trực tiếp ["React", "Java"]
      const matchesTag = filterData.tag 
        ? doc.tags?.some(tag => tag.toLowerCase().includes(filterData.tag.toLowerCase()))
        : true;

      // 4. Lọc theo Trường học (School)
      // TẠM SỬA: Vì BE chưa trả về trường school nên nếu user gõ filter school, 
      // ta tạm thời cho qua (luôn true) hoặc xử lý để không bị crash/ra 0 kết quả nhé.
      const matchesSchool = filterData.school 
        ? false // Hiện tại gõ vào đây sẽ ra 0 kết quả vì dữ liệu doc.school không tồn tại
        : true;

      return matchesSearch && matchesCourse && matchesTag && matchesSchool;
    });
  }, [documents, searchQuery, filterData]);

  return (
    <>
      <main className="flex-1">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[26px] font-bold text-slate-800 tracking-tight font-sans">
            ShareDocs — Knowledge Base
          </h2>
        </div>

        <RecentDocuments />

        <UploadDocumentDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUploadSuccess={(newDoc) => {
            upsertPublicDocument(newDoc);
          }}
        />

        {/* Danh sách tài liệu Public MỚI NHẤT */}
        <section className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-slate-800 tracking-tight">
            Explore Public Documents
          </h3>

          {isLoading ? (
            <div className="text-center text-slate-500 font-medium">
              Loading documents...
            </div>
          ) : filteredDocuments.length === 0 ? ( // ĐỔI SANG DÙNG filteredDocuments
            <div className="text-center bg-slate-50 rounded-2xl text-slate-500 border border-slate-100 p-8">
              No documents found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredDocuments.map((doc) => ( // ĐỔI SANG DÙNG filteredDocuments
                <Card
                  key={doc.id}
                  className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
                >
                  <CardContent className="p-4 flex-1 flex flex-col">
                    {/* Thumbnail ảo mờ mờ cho đẹp */}
                    <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 -mt-4 border border-slate-200 group-hover:border-[#f26522]/20 transition-colors flex items-center justify-center text-slate-300">
                      <FileText className="w-12 h-12" />
                    </div>

                    <CardTitle
                      className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1"
                      title={doc.title}
                    >
                      {doc.title || "Untitled Document"}
                    </CardTitle>

                    <CardDescription className="text-xs text-slate-500 font-medium mb-3 flex items-center gap-1.5">
                      <BookOpen className="w-3.5 h-3.5" />{" "}
                      {doc.course?.code || "General"}
                    </CardDescription>

                    <div className="text-[11px] text-slate-400 -mt-1 flex justify-between items-center">
                      <span>
                        {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                      </span>
                      <span>{doc.downloadCount || 0} downloads</span>
                    </div>
                  </CardContent>

                  {/* Khu vực nút bấm */}
                  <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                    <Button
                      variant="outline"
                      onClick={() => alert("Added to favorites")}
                      className="flex-none px-2.5 rounded-xl border-slate-200 text-slate-500 hover:text-[#f22222] hover:bg-[#f22222]/10 transition-colors cursor-pointer h-9"
                    >
                      <Heart className="w-4 h-4" />
                    </Button>

                    <Button
                      asChild
                      variant="secondary"
                      className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs rounded-xl h-9 cursor-pointer"
                    >
                      <Link to={`/documents/${doc.id}`}>
                        <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                      </Link>
                    </Button>

                    <Button
                      onClick={() => handleDownload(doc.id, doc.title)}
                      className="flex-1 bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white font-semibold text-xs rounded-xl h-9 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          )}
        </section>

        {/* COURSES SECTION */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-5">
            <div>
              <h3 className="text-2xl font-bold text-slate-800 tracking-tight">
                Courses
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                Explore documents by course
              </p>
            </div>

            <Button
              variant="outline"
              className="rounded-xl border-slate-200 hover:border-[#f26522]/30"
            >
              View All
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        </section>
      </main>

      {/* FOOTER */}
      <footer className="text-center text-[13px] text-slate-400 font-medium border-t border-gray-100 py-6 -mb-6">
        © 2026 ShareDocs — Modern Document Sharing Platform
      </footer>

      <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
        {isChatOpen ? (
          <div className="h-[min(620px,calc(100vh-7rem))] w-[min(calc(100vw-2rem),420px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl">
            <ChatInterface
              title="Homepage Chat"
              subtitle="Authenticated StudyMate AI"
              messages={chatMessages}
              isSending={isChatSending}
              onSendMessage={handleSendChatMessage}
            />
          </div>
        ) : null}

        <Button
          type="button"
          onClick={() => setIsChatOpen((open) => !open)}
          className="h-14 w-14 rounded-full bg-[#f26522] text-white shadow-lg hover:bg-[#e45a1b]"
          aria-label={
            isChatOpen ? "Close homepage AI chat" : "Open homepage AI chat"
          }
        >
          {isChatOpen ? (
            <X className="h-6 w-6" />
          ) : (
            <MessageCircle className="h-6 w-6" />
          )}
        </Button>
      </div>
    </>
  );
}
