import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  UploadCloud,
  Bot,
  FileQuestion,
  GraduationCap,
  Tags,
  BookOpen,
} from "lucide-react";

export default function Homepage() {
  const [uploadOpen, setUploadOpen] = useState(false);

  const sampleDocs = new Array(6).fill(0).map((_, i) => ({
    id: i + 1,
    title: `Document ${i + 1}`,
    desc: "Short description or course name",
  }));

  return (
    <>
      <div className="flex items-center justify-between mb-8">
        <h2 className="text-[26px] font-bold text-slate-800 tracking-tight font-sans">
          ShareDocs — Chia sẻ tài liệu
        </h2>
      </div>

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent className="sm:max-w-lg rounded-2xl">
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
            <div className="space-y-4 border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:bg-gray-50 transition-colors cursor-pointer">
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
                  PDF, DOCX, PPTX or Text files (max. 10MB)
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <GraduationCap size={16} className="text-[#f26522]" /> School
              </Label>
              <Input
                placeholder="Enter your school name (e.g. FPT University)"
                className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <BookOpen size={16} className="text-[#f26522]" /> Subject
              </Label>
              <Input
                placeholder="Enter subject code or name (e.g. SWP391)"
                className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
              />
            </div>

            <div className="space-y-2">
              <Label className="flex items-center gap-2 text-slate-700 font-semibold">
                <Tags size={16} className="text-[#f26522]" /> Tags
              </Label>
              <Input
                placeholder="Enter tags, separated by comma (e.g. exam, past-paper)"
                className="rounded-lg border-gray-300 focus-visible:ring-[#f26522] focus-visible:border-[#f26522]"
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setUploadOpen(false)}
              className="rounded-lg font-semibold"
            >
              Cancel
            </Button>
            <Button className="rounded-lg bg-[#f26522] hover:bg-[#d95316] text-white font-semibold">
              Upload Now
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <section className="mb-10">
        <h3 className="text-xl font-bold mb-4 text-slate-800 tracking-tight">
          Continue reading
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
          {sampleDocs.slice(0, 6).map((d) => (
            <Card
              key={d.id}
              className="shadow-sm border-gray-100 hover:shadow-md transition-shadow group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
            >
              <CardContent className="p-4 flex-1">
                <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl mb-4 border border-gray-100 group-hover:border-blue-100 transition-colors" />
                <CardTitle className="text-sm mb-1 font-bold text-slate-800 hover:text-blue-500 cursor-pointer">
                  {d.title}
                </CardTitle>
                <CardDescription className="text-[13px] text-slate-500 font-medium line-clamp-1">
                  {d.desc}
                </CardDescription>
              </CardContent>
              <CardFooter className="px-4 pb-4 pt-0 mt-auto">
                <Button
                  variant="ghost"
                  className="w-full text-slate-600 font-semibold text-sm hover:text-[#1B89FC] hover:bg-[#EAF4FF] rounded-xl h-10"
                >
                  Save
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold mb-4 text-slate-800 tracking-tight">
          Recently viewed
        </h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
          {sampleDocs.slice(0, 4).map((d) => (
            <Card
              key={`recent-${d.id}`}
              className="shadow-sm border-gray-100 hover:shadow-md transition-shadow group flex flex-col h-full rounded-[20px] overflow-hidden bg-white"
            >
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm mb-1 font-bold text-slate-800 hover:text-blue-500 cursor-pointer">
                  {d.title}
                </CardTitle>
                <CardDescription className="text-[13px] text-slate-500 font-medium line-clamp-1">
                  {d.desc}
                </CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="w-full h-[72px] bg-slate-50 rounded-xl flex items-center justify-center border border-gray-100">
                  <p className="text-[11px] text-slate-400 font-medium">
                    Document content
                  </p>
                </div>
              </CardContent>
              <CardFooter className="px-4 pb-4 pt-0 mt-auto">
                <Button
                  variant="ghost"
                  className="w-full text-slate-600 font-semibold text-sm hover:text-green-600 hover:bg-green-50 rounded-xl h-10"
                >
                  Open
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <footer className="mt-16 text-center text-[13px] text-slate-400 font-medium pb-8 border-t border-gray-100 pt-8">
        © 2026 ShareDocs — Modern Document Sharing Platform
      </footer>
    </>
  );
}
