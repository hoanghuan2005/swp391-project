import React from "react";
import { PiBookOpenTextBold } from "react-icons/pi";

export default function CourseBanner({ code }) {
  return (
    <div className="relative h-26 overflow-hidden rounded-t-2xl bg-gradient-to-br from-orange-400 via-orange-500 to-orange-600 -mt-4">
      {/* Overlay */}
      <div className="absolute inset-0 bg-black/[0.02]" />

      {/* Badge */}
      <div className="absolute left-3 top-3 z-10">
        <div className="rounded-full bg-orange-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
          {code}
        </div>
      </div>

      {/* Main Icon */}
      <div className="absolute inset-0 flex items-center justify-center">
        <PiBookOpenTextBold className="text-5xl text-white/90" />
      </div>

      {/* Decorative Shapes */}

      <div className="absolute top-5 right-8 h-7 w-7 rotate-45 border-2 border-white/20" />

      <div className="absolute bottom-7 left-5 h-6 w-6 rotate-45 border-2 border-white/15" />

      <div className="absolute bottom-10 right-10 h-8 w-8 rounded-full border border-white/15" />

      <div className="absolute top-8 left-8 h-14 w-14 rotate-12 rounded-2xl border border-white/10" />

      <div className="absolute bottom-4 left-24 h-5 w-5 rounded-full border border-white/15" />

      {/* Dot Pattern */}
      <svg className="absolute bottom-0 left-0 w-full opacity-20">
        <defs>
          <pattern
            id="dots"
            width="8"
            height="8"
            patternUnits="userSpaceOnUse"
          >
            <circle cx="1" cy="1" r="1" fill="white" />
          </pattern>
        </defs>

        <rect width="100%" height="100%" fill="url(#dots)" />
      </svg>
    </div>
  );
}