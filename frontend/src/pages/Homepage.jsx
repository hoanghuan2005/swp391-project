import React from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
} from "@/components/ui/card";

export default function Homepage() {
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
        <div className="flex items-center gap-3">
          <Button variant="outline" className="hidden sm:inline-flex rounded-full border-gray-200">
            Upload
          </Button>
          <Button className="rounded-full bg-slate-900 hover:bg-slate-800 text-white font-medium px-5">
            New
          </Button>
        </div>
      </div>

      <section className="mb-10">
        <h3 className="text-xl font-bold mb-4 text-slate-800 tracking-tight">Continue reading</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
          {sampleDocs.slice(0, 6).map((d) => (
            <Card key={d.id} className="shadow-sm border-gray-100 hover:shadow-md transition-shadow group flex flex-col h-full rounded-[20px] overflow-hidden bg-white">
              <CardContent className="p-4 flex-1">
                <div className="w-full aspect-[4/3] bg-gray-50 rounded-xl mb-4 border border-gray-100 group-hover:border-blue-100 transition-colors" />
                <CardTitle className="text-sm mb-1 font-bold text-slate-800 hover:text-blue-500 cursor-pointer">{d.title}</CardTitle>
                <CardDescription className="text-[13px] text-slate-500 font-medium line-clamp-1">{d.desc}</CardDescription>
              </CardContent>
              <CardFooter className="px-4 pb-4 pt-0 mt-auto">
                <Button variant="ghost" className="w-full text-slate-600 font-semibold text-sm hover:text-[#1B89FC] hover:bg-[#EAF4FF] rounded-xl h-10">
                  Save
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h3 className="text-xl font-bold mb-4 text-slate-800 tracking-tight">Recently viewed</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-5">
          {sampleDocs.slice(0, 4).map((d) => (
            <Card key={`recent-${d.id}`} className="shadow-sm border-gray-100 hover:shadow-md transition-shadow group flex flex-col h-full rounded-[20px] overflow-hidden bg-white">
              <CardHeader className="p-4 pb-2">
                 <CardTitle className="text-sm mb-1 font-bold text-slate-800 hover:text-blue-500 cursor-pointer">{d.title}</CardTitle>
                <CardDescription className="text-[13px] text-slate-500 font-medium line-clamp-1">{d.desc}</CardDescription>
              </CardHeader>
              <CardContent className="p-4 pt-2">
                <div className="w-full h-[72px] bg-slate-50 rounded-xl flex items-center justify-center border border-gray-100">
                   <p className="text-[11px] text-slate-400 font-medium">Document content</p>
                </div>
              </CardContent>
              <CardFooter className="px-4 pb-4 pt-0 mt-auto">
                <Button variant="ghost" className="w-full text-slate-600 font-semibold text-sm hover:text-green-600 hover:bg-green-50 rounded-xl h-10">
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
