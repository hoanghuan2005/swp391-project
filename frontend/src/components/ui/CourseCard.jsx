import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  FileText,
  Layers,
  ListChecks,
  ChevronRight,
} from "lucide-react";
import CourseBanner from "./CourseBanner";

export default function CourseCard({ course }) {
  return (
    <Link
      to={`/courses/${course.id}`}
      className="group block"
    >
      <Card
        className="
          overflow-hidden
          rounded-2xl
          border
          bg-white
          transition-all
          duration-300
          hover:-translate-y-1
          hover:shadow-sm
        "
      >
        <CourseBanner code={course.code} />

        <CardContent>
          {/* Course Name */}
          <h3 className="font-bold text-slate-800 text-lg line-clamp-2 min-h-[48px]">
            {course.name}
          </h3>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 mt-3">
            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-2 text-center">
              <FileText className="w-4 h-4 mx-auto mb-1 text-[#f26522]" />
              <p className="font-bold text-slate-800">
                {course.documentCount || 0}
              </p>
              <p className="text-[10px] text-slate-500">
                Docs
              </p>
            </div>

            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-2 text-center">
              <Layers className="w-4 h-4 mx-auto mb-1 text-[#f26522]" />
              <p className="font-bold text-slate-800">
                {course.flashcardCount || 0}
              </p>
              <p className="text-[10px] text-slate-500">
                Cards
              </p>
            </div>

            <div className="rounded-xl border border-orange-100 bg-orange-50/50 p-2 text-center">
              <ListChecks className="w-4 h-4 mx-auto mb-1 text-[#f26522]" />
              <p className="font-bold text-slate-800">
                {course.quizCount || 0}
              </p>
              <p className="text-[10px] text-slate-500">
                Quiz
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-3">
            <span className="text-xs text-slate-400">
              Learning Materials
            </span>

            <span
              className="
                flex items-center gap-1
                text-xs font-semibold
                text-[#f26522]
                opacity-0
                transition-all
                group-hover:opacity-100
              "
            >
              Open
              <ChevronRight className="w-3 h-3" />
            </span>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}