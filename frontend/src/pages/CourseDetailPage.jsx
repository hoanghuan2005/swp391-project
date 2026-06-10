import React, { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import axiosClient from "@/api/axiosClient";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { forceDownload } from "@/lib/downloadHelper";
import { CardTitle } from "@/components/ui/card";
import { CardDescription } from "@/components/ui/card";
import { CardFooter } from "@/components/ui/card";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

import {
  Search,
  FileText,
  BookOpen,
  Download,
  Eye,
  Share2,
  Copy,
  Star,
  Heart,
} from "lucide-react";

export default function CourseDetailPage() {
  const { id } = useParams();

  const [course, setCourse] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [flashcards, setFlashcards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [shareOpen, setShareOpen] = useState(false);
  const [isFollowing, setIsFollowing] = useState(false);

  useEffect(() => {
    fetchCourse();
  }, [id]);

  const fetchCourse = async () => {
    try {
      setLoading(true);

      const [courseRes, docsRes, followStatusRes, quizzesRes, flashcardsRes] = await Promise.all([
        axiosClient.get(`/api/courses/${id}`),
        axiosClient.get(`/api/courses/${id}/documents`),
        axiosClient.get(`/api/courses/${id}/follow-status`),
        axiosClient.get(`/api/quizzes/course/${id}`),
        axiosClient.get(`/api/ai_flashcard/course/${id}`),
      ]);

      setCourse(courseRes.data);
      if (courseRes.data?.name) {
        document.title = `Mindocu | ${courseRes.data.name}`;
      }
      setDocuments(docsRes.data.content || []);
      setIsFollowing(followStatusRes.data);
      setQuizzes(quizzesRes.data || []);
      setFlashcards(flashcardsRes.data?.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
    } catch (err) {
      console.error(err);
    }
  };

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

  const handleFollowToggle = async () => {
    try {
      if (isFollowing) {
        await axiosClient.delete(`/api/courses/${id}/follow`);
        setIsFollowing(false);
      } else {
        await axiosClient.post(`/api/courses/${id}/follow`);
        setIsFollowing(true);
      }

      // refresh sidebar
      window.dispatchEvent(new CustomEvent("courses:updated"));
    } catch (error) {
      console.error(error);
    }
  };

  if (loading) {
    return <div className="text-center py-20 text-slate-500">Loading...</div>;
  }

  return (
    <div className="pb-14">
      {/* COURSE HEADER */}
      <div className="rounded-[28px] border border-orange-100 bg-gradient-to-br from-[#fffaf7] to-[#fff3eb] overflow-hidden">
        <div className="p-5">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-[13px] text-slate-400 mb-4">
            <Link to="/" className="hover:text-[#f66810] transition-colors">
              University
            </Link>

            <span>/</span>

            <span>FPT</span>

            <span>/</span>

            <span className="text-[#f66810] font-medium">{course.code}</span>
          </div>

          {/* TOP INFO */}
          <div className="flex items-start gap-4">
            {/* ICON */}
            <div className="w-14 h-14 rounded-2xl bg-[#f66810] flex items-center justify-center text-white shadow-sm shrink-0">
              <BookOpen className="w-7 h-7" />
            </div>

            {/* CONTENT */}
            <div className="flex-1 min-w-0">
              {/* TITLE */}
              <div>
                <h1 className="text-2xl font-bold text-slate-800 tracking-tight">
                  {course.name}
                </h1>

                <p className="text-sm text-slate-500 mt-1">{course.code}</p>
              </div>

              {/* STATS */}
              <div className="flex flex-wrap gap-3 mt-4">
                <div className="flex items-center gap-2 bg-white border border-orange-100 rounded-full px-3 py-1 text-sm text-slate-600">
                  <FileText className="w-3 h-3 text-[#f66810]" />
                  <span>{documents.length} documents</span>
                </div>

                <div className="flex items-center gap-2 bg-white border border-orange-100 rounded-full px-3 py-1 text-sm text-slate-600">
                  <Eye className="w-3 h-3 text-[#f66810]" />
                  <span>2.1k views</span>
                </div>

                <div className="flex items-center gap-2 bg-white border border-orange-100 rounded-full px-3 py-1 text-sm text-slate-600">
                  <Star className="w-3 h-3 text-[#f66810]" />
                  <span>4.8 rating</span>
                </div>
              </div>

              {/* ACTION ROW */}
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4 mt-5">
                {/* BUTTONS */}
                <div className="flex flex-wrap gap-3">
                  <Button
                    className="rounded-full bg-[#f66810] hover:bg-[#de5b0b] h-9 px-4 text-sm shadow-sm"
                    onClick={handleFollowToggle}
                  >
                    {isFollowing ? "Unfollow Course" : "Follow Course"}
                  </Button>

                  <Button
                    variant="secondary"
                    className="rounded-full bg-orange-100 hover:bg-orange-200 text-[#f66810] h-9 px-4 text-sm"
                  >
                    Practice Exam
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => setShareOpen(true)}
                    className="rounded-full border-orange-200 hover:bg-orange-50 h-9 px-4 text-sm"
                  >
                    <Share2 className="w-4 h-4 mr-1" />
                    Share
                  </Button>
                </div>

                {/* SEARCH */}
                <div className="relative w-full lg:w-[370px]">
                  <Search className="absolute -left-9 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />

                  <Input
                    placeholder={`Find in ${course.code}`}
                    className="pl-10 h-9 rounded-full border-orange-100 bg-white focus-visible:ring-[#f66810] -ml-12"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* TRENDING */}
      <section className="mt-10">
        <div className="flex items-center justify-between mb-5">
          <div className="flex flex-col mb-0.5">
            <h2 className="text-2xl font-bold text-slate-800">
              Trending Documents
            </h2>
            <p className="text-sm text-slate-500 mt-1">Explore the most popular study materials in this course.</p>
          </div>
          <Button variant="ghost">View All</Button>

        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {documents.map((doc) => (
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
      </section>

      {/* Quizzes Section */}
      {quizzes.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-col mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Published Quizzes
            </h2>
            <p className="text-sm text-slate-500 mt-1">Test your knowledge with these quizzes.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {quizzes.map((quiz) => (
              <Card
                key={quiz.id}
                className="shadow-sm border-orange-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-gradient-to-b from-[#fffaf7] to-white"
              >
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="w-full aspect-[4/3] bg-orange-50 rounded-xl mb-3 -mt-4 border border-orange-100 flex items-center justify-center text-[#f26522]">
                    <Star className="w-12 h-12 opacity-50" />
                  </div>
                  <CardTitle className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1" title={quiz.title}>
                    {quiz.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-[#f26522] font-medium mb-3 flex items-center gap-1.5">
                    {quiz.questions?.length || 0} Questions
                  </CardDescription>
                </CardContent>
                <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => alert("Liked!")}
                    className="flex-none px-2.5 rounded-xl border-slate-200 text-slate-500 hover:text-[#f22222] hover:bg-[#f22222]/10 transition-colors cursor-pointer h-9"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    asChild
                    className="flex-1 bg-[#f26522] hover:bg-[#de5b0b] text-white font-semibold text-xs rounded-xl h-9 cursor-pointer"
                  >
                    <Link to={`/quiz/${quiz.id}`}>
                      Take Quiz
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Flashcards Section */}
      {flashcards.length > 0 && (
        <section className="mt-10">
          <div className="flex flex-col mb-6">
            <h2 className="text-2xl font-bold text-slate-800">
              Published Flashcards
            </h2>
            <p className="text-sm text-slate-500 mt-1">Review key concepts with flashcards.</p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {flashcards.map((fc) => (
              <Card
                key={fc.id}
                className="shadow-sm border-blue-100 hover:shadow-md transition-all group flex flex-col h-full rounded-[20px] overflow-hidden bg-gradient-to-b from-[#f7faff] to-white"
              >
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="w-full aspect-[4/3] bg-blue-50 rounded-xl mb-3 -mt-4 border border-blue-100 flex items-center justify-center text-blue-500">
                    <BookOpen className="w-12 h-12 opacity-50" />
                  </div>
                  <CardTitle className="text-[15px] mb-1 font-bold text-slate-800 line-clamp-1" title={fc.title}>
                    {fc.title}
                  </CardTitle>
                  <CardDescription className="text-xs text-blue-500 font-medium mb-3 flex items-center gap-1.5">
                    {fc.cards || 0} Cards
                  </CardDescription>
                </CardContent>
                <CardFooter className="-mt-3 px-4 py-3 flex gap-2">
                  <Button
                    variant="outline"
                    onClick={() => alert("Liked!")}
                    className="flex-none px-2.5 rounded-xl border-slate-200 text-slate-500 hover:text-[#f22222] hover:bg-[#f22222]/10 transition-colors cursor-pointer h-9"
                  >
                    <Heart className="w-4 h-4" />
                  </Button>
                  <Button
                    asChild
                    className="flex-1 bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs rounded-xl h-9 cursor-pointer"
                  >
                    <Link to={`/flashcard?id=${fc.id}`}>
                      Study Now
                    </Link>
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        </section>
      )}

      <Dialog open={shareOpen} onOpenChange={setShareOpen}>
        <DialogContent className="sm:max-w-xl rounded-[28px] border-0 p-0 overflow-hidden">
          <div className="p-8">
            <DialogHeader>
              <DialogTitle className="text-3xl font-bold text-slate-800">
                Share Course
              </DialogTitle>
            </DialogHeader>

            <p className="text-slate-500 mt-3 leading-relaxed">
              Share this course with your friends and classmates.
            </p>

            {/* URL */}
            <div className="mt-8">
              <p className="text-sm font-semibold text-slate-700 mb-3">
                Share URL
              </p>

              <div className="flex gap-3">
                <Input
                  readOnly
                  value={window.location.href}
                  className="rounded-full h-12"
                />

                <Button
                  onClick={handleCopyLink}
                  className="rounded-full bg-[#f66810] hover:bg-[#de5b0b] h-12 px-6"
                >
                  <Copy className="w-4 h-4 mr-2" />
                  Copy
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
