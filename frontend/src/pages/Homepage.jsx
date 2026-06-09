import React, { useState, useEffect, useCallback, useMemo } from "react";
import { Link, useOutletContext } from "react-router-dom";
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

const DEFAULT_FILTER_DATA = { school: "", course: "", category: "" };

export default function Homepage() {
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

  // Quản lý danh sách ID tài liệu đã thả tim để đồng bộ UI lập tức
  const [favoritedIds, setFavoritedIds] = useState([]);

  // Lấy danh sách các file đã thích sẵn để tô đỏ trái tim từ đầu (CHỈ GỌI KHI ĐÃ ĐĂNG NHẬP)
  const fetchUserFavorites = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return; // Nếu chưa đăng nhập (Guest) thì không gọi API để tránh lỗi 401

    try {
      const res = await axiosClient.get("/api/documents/favorites");
      if (Array.isArray(res.data)) {
        setFavoritedIds(res.data.map((doc) => doc.id));
      }
    } catch (e) {
      // Ẩn lỗi 401 đi cho màn hình console sạch sẽ nếu token hết hạn
      if (e.response?.status !== 401) {
        console.error("Failed to fetch initial favorites status:", e);
      }
    }
  }, []);

  const upsertPublicDocument = useCallback((doc) => {
    if (!doc) return;
    const isPublic = doc.visibility ? doc.visibility === "PUBLIC" : true;
    if (!isPublic) return;

    setDocuments((prev) => {
      const exists = prev.find((item) => item.id === doc.id);
      if (exists) return prev.map((item) => (item.id === doc.id ? doc : item));
      return [doc, ...prev];
    });
  }, []);

  const fetchCourses = useCallback(async () => {
    try {
      const response = await axiosClient.get("/api/courses");
      setCourses(response.data?.content || []);
    } catch (error) {
      setCourses([]);
    }
  }, []);

  const fetchDocuments = useCallback(async (options = {}) => {
    const { silent = false } = options;
    try {
      if (!silent) setIsLoading(true);
      const response = await axiosClient.get("/api/documents");
      const publicDocs = (response.data || [])
        .filter((doc) => doc.visibility === "PUBLIC")
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setDocuments(publicDocs);
    } catch (error) {
      setDocuments([]);
    } finally {
      if (!silent) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDocuments();
    fetchCourses();
    fetchUserFavorites(); // Chạy lấy status trái tim đỏ

    const handleUploaded = (event) => {
      upsertPublicDocument(event?.detail);
      fetchDocuments({ silent: true });
    };

    window.addEventListener("documents:uploaded", handleUploaded);
    return () =>
      window.removeEventListener("documents:uploaded", handleUploaded);
  }, [fetchDocuments, fetchCourses, fetchUserFavorites, upsertPublicDocument]);

  // Xử lý toggle thả tim / bỏ thả tim thông minh (CHẶN KHI CHƯA ĐĂNG NHẬP)
  const handleToggleFavorite = async (id) => {
    const token = localStorage.getItem("token");
    if (!token) {
      toast.error("Vui lòng đăng nhập để lưu tài liệu!");
      return;
    }

    const isCurrentlyFavorited = favoritedIds.includes(id);

    // Tối ưu UI trước: Cập nhật giao diện ngay lập tức cho mượt
    if (isCurrentlyFavorited) {
      setFavoritedIds((prev) => prev.filter((favId) => favId !== id));
      toast.success("Removed from Library");
    } else {
      setFavoritedIds((prev) => [...prev, id]);
      toast.success("Saved to My Favorites!");
    }

    try {
      // Gửi lệnh lên database thật
      await axiosClient.post(`/api/documents/${id}/favorite`);
    } catch (error) {
      // Nếu API lỗi thì hoàn tác trạng thái cũ cho chính xác
      if (isCurrentlyFavorited) {
        setFavoritedIds((prev) => [...prev, id]);
      } else {
        setFavoritedIds((prev) => prev.filter((favId) => favId !== id));
      }

      if (error.response?.status === 401) {
        toast.error("Phiên đăng nhập hết hạn, vui lòng đăng nhập lại!");
      } else {
        toast.error("Lỗi hệ thống, không thể lưu tài liệu");
      }
    }
  };

  const handleDownload = async (id, title) => {
    try {
      const res = await axiosClient.get(`/api/documents/${id}/download`);
      const url = res.data.downloadUrl;
      if (url) await forceDownload(url, title || "document");
    } catch (error) {
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
        setChatMessages((prev) => [
          ...prev,
          {
            id: response.assistantMessageId || `assistant-${Date.now()}`,
            role: "ASSISTANT",
            content: response.answer || "I could not generate a response.",
          },
        ]);
      } catch (error) {
        setChatMessages((prev) => [
          ...prev,
          {
            id: `error-${Date.now()}`,
            role: "ASSISTANT",
            content: "Sorry, please try again.",
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
      const matchesSearch = searchQuery
        ? doc.title?.toLowerCase().includes(searchQuery.toLowerCase())
        : true;
      const matchesCourse = filterData.course
        ? doc.course?.code
            ?.toLowerCase()
            .includes(filterData.course.toLowerCase()) ||
          doc.course?.name
            ?.toLowerCase()
            .includes(filterData.course.toLowerCase())
        : true;
      const matchesCategory = filterData.category
        ? doc.category?.toLowerCase() === filterData.category.toLowerCase()
        : true;

      // Sửa lỗi trắng trang khi backend trả về school null
      const docSchool =
        doc.schoolCode ||
        doc.school?.code ||
        doc.course?.schoolCode ||
        doc.school ||
        "";
      const matchesSchool = filterData.school
        ? docSchool.toLowerCase().includes(filterData.school.toLowerCase()) ||
          filterData.school.toLowerCase().includes(docSchool.toLowerCase())
        : true;

      return matchesSearch && matchesSchool && matchesCourse && matchesCategory;
    });
  }, [documents, searchQuery, filterData]);

  return (
    <>
      <main className="flex-1">
        <div className="flex items-center justify-between mb-8">
          <h2 className="text-[26px] font-bold text-slate-800 tracking-tight font-sans">
            Knowledge Base
          </h2>
        </div>

        <RecentDocuments />
        <UploadDocumentDialog
          open={uploadOpen}
          onOpenChange={setUploadOpen}
          onUploadSuccess={(newDoc) => upsertPublicDocument(newDoc)}
        />

        <section className="mb-10">
          <h3 className="text-xl font-bold mb-4 text-slate-800 tracking-tight">
            Explore Public Documents
          </h3>
          {isLoading ? (
            <div className="text-center text-slate-500 font-medium">
              Loading documents...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center bg-slate-50 rounded-2xl text-slate-500 border border-slate-100 p-8">
              No documents found matching your criteria.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {filteredDocuments.map((doc) => {
                const isFavorited = favoritedIds.includes(doc.id); // Check xem file đã thích chưa
                return (
                  <Card
                    key={doc.id}
                    className="shadow-sm border-slate-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
                  >
                    <CardContent className="p-4 flex-1 flex flex-col">
                      <div className="w-full aspect-[4/3] bg-slate-50 rounded-xl mb-3 -mt-4 border border-slate-200 group-hover:border-[#f26522]/20 flex items-center justify-center text-slate-300">
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
                      <div className="text-[11px] text-slate-400 mt-auto flex justify-between items-center">
                        <span>
                          {new Date(doc.createdAt).toLocaleDateString("en-GB")}
                        </span>
                        <span>{doc.downloadCount || 0} downloads</span>
                      </div>
                    </CardContent>
                    <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                      {/* Nút trái tim đổi màu thông minh */}
                      <Button
                        variant="outline"
                        onClick={() => handleToggleFavorite(doc.id)}
                        className={`flex-none px-2.5 rounded-xl border-slate-200 h-9 transition-colors ${
                          isFavorited
                            ? "text-red-500 bg-red-50 hover:bg-red-100 border-red-100"
                            : "text-slate-500 hover:text-red-500 hover:bg-red-50"
                        }`}
                      >
                        <Heart
                          className={`w-4 h-4 ${isFavorited ? "fill-current" : ""}`}
                        />
                      </Button>
                      <Button
                        asChild
                        variant="secondary"
                        className="flex-1 bg-slate-100 text-slate-700 hover:bg-slate-200 font-semibold text-xs rounded-xl h-9"
                      >
                        <Link to={`/documents/${doc.id}`}>
                          <Eye className="w-3.5 h-3.5 mr-1.5" /> View
                        </Link>
                      </Button>
                      <Button
                        onClick={() => handleDownload(doc.id, doc.title)}
                        className="flex-1 bg-[#f26522]/10 text-[#f26522] hover:bg-[#f26522] hover:text-white font-semibold text-xs rounded-xl h-9"
                      >
                        <Download className="w-3.5 h-3.5 mr-1.5" /> Download
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
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
        © 2026 Knowledge Base — Modern Document Sharing Platform
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
