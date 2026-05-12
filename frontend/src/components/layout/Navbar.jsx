import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, Mic } from "lucide-react";

export default function Navbar() {
  return (
    <div className="w-full bg-white border-b border-gray-100 py-3 sticky top-0 z-50">
      <div className="max-w-[1700px] w-full mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-6">
        <div className="flex items-center gap-4 w-full sm:max-w-2xl pl-2 lg:pl-[290px] transition-all duration-300">
          <div className="relative w-full">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
              <Search className="h-4 w-4" />
            </span>
            <Input
              className="pl-12 h-11 bg-slate-50 border-transparent hover:border-slate-300 focus-visible:border-blue-500 focus-visible:ring-blue-500/20 rounded-full shadow-none text-sm transition-all"
              placeholder="Search for courses, quizzes, or documents"
            />
          </div>
        </div>

        <div className="flex items-center gap-4 shrink-0">
          <Button
            variant="outline"
            className="hidden sm:flex rounded-full border-gray-200 shadow-sm text-slate-700 h-10 px-4"
          >
            <Mic className="h-4 w-4 mr-2 text-red-500" />
            Record class
          </Button>
          <div className="cursor-pointer h-10 w-10 shrink-0 rounded-full bg-[#6C3DE8] text-white flex items-center justify-center font-medium shadow-sm ring-2 ring-white">
            H
          </div>
        </div>
      </div>
    </div>
  );
}
