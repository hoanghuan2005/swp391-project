import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, BrainCircuit, Users, CheckCircle2 } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Simple Header */}
      <header className="absolute top-0 w-full z-10 py-6 border-b border-gray-100 bg-white/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <div className="flex items-center gap-2 font-bold text-xl text-slate-800 tracking-tight">
            <BookOpen className="h-6 w-6 text-[#f26522]" />
            MinDoCu
          </div>
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block">Log in</Link>
            <Link to="/dashboard">
              <Button className="rounded-full bg-[#f26522] hover:bg-[#f26522]/90 text-white font-semibold">
                Go to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-20 w-full min-h-[90vh] flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-orange-50 text-orange-600 text-sm font-semibold mb-4 border border-orange-100">
            <span className="flex h-2 w-2 rounded-full bg-orange-600 animate-pulse"></span>
            Elevate your study game
          </div>
          
          <h1 className="text-5xl md:text-7xl font-extrabold text-slate-900 tracking-tight leading-[1.1]">
            Share documents. <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f26522] to-[#ff985c]">
              Master your exams.
            </span>
          </h1>
          
          <p className="text-lg md:text-xl text-slate-500 max-w-2xl mx-auto leading-relaxed">
            Join thousands of students sharing lecture notes, summaries, and assignments. Supercharge your learning with our AI-powered study tools.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-6">
            <Link to="/dashboard">
              <Button size="lg" className="rounded-full bg-[#f26522] hover:bg-[#f26522]/90 text-white h-14 px-8 text-lg font-semibold w-full sm:w-auto shadow-lg shadow-orange-500/20">
                Explore Documents
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="rounded-full border-gray-200 text-slate-700 h-14 px-8 text-lg font-semibold w-full sm:w-auto hover:bg-slate-50">
              How it works
            </Button>
          </div>
          
          <div className="pt-10 flex items-center justify-center gap-6 text-sm text-slate-400 font-medium">
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500"/> Free forever</div>
            <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500"/> AI Quiz Generation</div>
            <div className="flex items-center gap-2 hidden sm:flex"><CheckCircle2 className="h-4 w-4 text-green-500"/> Verified Content</div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section className="py-24 bg-slate-50 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="grid md:grid-cols-3 gap-12">
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Massive Library</h3>
              <p className="text-slate-500 leading-relaxed">Access a massive library of student-contributed study materials from your own university.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">AI Assistant</h3>
              <p className="text-slate-500 leading-relaxed">Use Ask AI to summarize long PDFs instantly or generate custom practice quizzes.</p>
            </div>
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-100 space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mb-6">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Community Driven</h3>
              <p className="text-slate-500 leading-relaxed">Collaborate with peers, vote on the best materials, and build a trusted knowledge base.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
