import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, BrainCircuit, Users, CheckCircle2, Sparkles, BookMarked, ShieldCheck } from "lucide-react";
import studyImage from '../assets/picture-study.png';

export default function LandingPage() {
  const isLoggedIn = !!localStorage.getItem("token");

  return (
    <div className="min-h-screen bg-slate-50/50 text-slate-800 relative overflow-hidden font-sans">
      {/* Background Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-orange-200/30 blur-3xl -z-10" />
      <div className="absolute top-[30%] right-[-10%] w-[600px] h-[600px] rounded-full bg-purple-200/20 blur-3xl -z-10" />
      <div className="absolute bottom-[-10%] left-[20%] w-[500px] h-[500px] rounded-full bg-orange-100/20 blur-3xl -z-10" />

      {/* Header */}
      <header className="fixed top-0 w-full z-50 py-4 border-b border-slate-100 bg-white/70 backdrop-blur-md transition-all">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex justify-between items-center">
          <Link to="/" className="flex items-center gap-2 font-black text-2xl text-slate-800 tracking-tight">
            <BookOpen className="h-7 w-7 text-[#f26522]" />
            MinDoCu
          </Link>
          
          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How It Works</a>
            <Link to="/pricing" className="hover:text-slate-900 transition-colors">Pricing</Link>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link to="/home">
                <Button className="rounded-full bg-[#f26522] hover:bg-[#f26522]/90 text-white font-bold px-6 shadow-md transition-transform hover:scale-[1.02]">
                  Go to Home
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/login" className="text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                  Log in
                </Link>
                <Link to="/signup">
                  <Button className="rounded-full bg-[#f26522] hover:bg-[#f26522]/90 text-white font-bold px-6 shadow-md transition-transform hover:scale-[1.02]">
                    Sign up
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="pt-32 pb-24 px-4 max-w-7xl mx-auto min-h-[90vh] flex items-center">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center w-full">
          {/* Hero Left */}
          <div className="lg:col-span-7 space-y-8 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-orange-50 text-orange-600 text-xs font-bold border border-orange-100">
              <span className="flex h-2.5 w-2.5 rounded-full bg-[#f26522] animate-pulse"></span>
              Elevate your study game
            </div>
            
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-slate-900 tracking-tight leading-[1.05]">
              Share documents. <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#f26522] via-[#ff7830] to-[#ff985c]">
                Master your exams.
              </span>
            </h1>
            
            <p className="text-base sm:text-lg text-slate-500 max-w-xl leading-relaxed">
              Join thousands of students sharing lecture notes, summaries, and assignments. Supercharge your learning with our AI-powered study tools.
            </p>

            <div className="flex flex-col sm:flex-row items-center gap-4 pt-4">
              <Link to="/home" className="w-full sm:w-auto">
                <Button size="lg" className="rounded-full bg-[#f26522] hover:bg-[#d95316] text-white h-14 px-8 text-lg font-bold w-full sm:w-auto shadow-xl shadow-orange-500/20 transition-all hover:scale-[1.02]">
                  Explore Documents
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <a href="#how-it-works" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="rounded-full border-slate-200 bg-white text-slate-700 h-14 px-8 text-lg font-bold w-full sm:w-auto hover:bg-slate-50 transition-all">
                  How it works
                </Button>
              </a>
            </div>
            
            <div className="pt-6 flex flex-wrap gap-x-6 gap-y-3 text-xs sm:text-sm text-slate-400 font-bold">
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500"/> Free forever</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500"/> AI Quiz Generation</div>
              <div className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-green-500"/> Verified Content</div>
            </div>
          </div>

          {/* Hero Right */}
          <div className="lg:col-span-5 relative flex justify-center lg:justify-end">
            {/* Background blobs for image styling */}
            <div className="absolute inset-0 bg-gradient-to-tr from-orange-300 to-purple-400 rounded-[40px] opacity-10 blur-xl scale-95" />
            
            <div className="relative border border-slate-200/50 bg-white p-4 rounded-[36px] shadow-2xl transition-transform hover:scale-[1.01] duration-500 max-w-[420px] lg:max-w-none">
              <img 
                src={studyImage} 
                alt="Study Illustration" 
                className="w-full h-auto rounded-[28px] object-cover border border-slate-100"
              />
              
              {/* Floating Badge 1 */}
              <div className="absolute -left-6 top-[20%] bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-3 shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '4s' }}>
                <div className="p-2 rounded-xl bg-orange-100 text-[#f26522]">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">AI Power</p>
                  <p className="text-xs font-black text-slate-800">Quiz & Flashcards</p>
                </div>
              </div>

              {/* Floating Badge 2 */}
              <div className="absolute -right-6 bottom-[15%] bg-white/80 backdrop-blur-md border border-slate-100 rounded-2xl p-3 shadow-xl flex items-center gap-3 animate-bounce" style={{ animationDuration: '6s' }}>
                <div className="p-2 rounded-xl bg-green-100 text-green-600">
                  <BookMarked className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase">Documents</p>
                  <p className="text-xs font-black text-slate-800">50K+ Study Notes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Value Props */}
      <section id="features" className="py-24 bg-white border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase text-[#f26522] tracking-widest">Why MinDoCu</h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Everything you need to master your courses</p>
            <p className="text-slate-500 text-sm sm:text-base">We combine student knowledge sharing with cutting-edge artificial intelligence to revolutionize your learning.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {/* Card 1 */}
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:bg-white hover:shadow-xl hover:border-[#f26522]/10 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-2xl bg-orange-100 text-orange-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BookOpen className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Massive Library</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Access a massive library of student-contributed study materials from your own university.</p>
            </div>
            {/* Card 2 */}
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:bg-white hover:shadow-xl hover:border-purple-500/10 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 text-purple-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">AI Assistant</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Use Ask AI to summarize long PDFs instantly or generate custom practice quizzes.</p>
            </div>
            {/* Card 3 */}
            <div className="bg-slate-50/50 p-8 rounded-3xl border border-slate-100 space-y-4 hover:bg-white hover:shadow-xl hover:border-green-500/10 transition-all duration-300 group">
              <div className="h-12 w-12 rounded-2xl bg-green-100 text-green-600 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Community Driven</h3>
              <p className="text-slate-500 leading-relaxed text-sm">Collaborate with peers, vote on the best materials, and build a trusted knowledge base.</p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-24 bg-slate-50 border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-16 space-y-4">
            <h2 className="text-xs font-black uppercase text-[#f26522] tracking-widest">Simple Workflow</h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">How it works</p>
            <p className="text-slate-500 text-sm sm:text-base">Three easy steps to start improving your test scores immediately.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative">
            <div className="space-y-4 text-center px-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-orange-100 text-[#f26522] flex items-center justify-center font-black text-xl shadow-inner">1</div>
              <h4 className="text-lg font-bold text-slate-800">Find Study Notes</h4>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">Search through thousands of notes, slides, and exam preparation documents shared by other students.</p>
            </div>
            
            <div className="space-y-4 text-center px-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-purple-100 text-purple-600 flex items-center justify-center font-black text-xl shadow-inner">2</div>
              <h4 className="text-lg font-bold text-slate-800">Learn with AI tools</h4>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">Transform static documents into interactive practice quizzes, custom flashcards, or ask AI specific questions.</p>
            </div>

            <div className="space-y-4 text-center px-4">
              <div className="h-16 w-16 mx-auto rounded-full bg-green-100 text-green-600 flex items-center justify-center font-black text-xl shadow-inner">3</div>
              <h4 className="text-lg font-bold text-slate-800">Share your files</h4>
              <p className="text-slate-500 text-xs sm:text-sm leading-relaxed">Upload your own documents to support the university community, gain reputation, and help peers pass their classes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-100 py-12 text-slate-400 text-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 font-bold text-slate-800">
            <BookOpen className="h-6 w-6 text-[#f26522]" />
            MinDoCu
          </div>
          <div>
            © 2026 MinDoCu. All rights reserved. Vietnam's Modern Document Sharing Platform.
          </div>
        </div>
      </footer>
    </div>
  );
}
