import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, BrainCircuit, Users, CheckCircle2, Sparkles, BookMarked, ShieldCheck, Loader2, Check } from "lucide-react";
import studyImage from '../assets/picture-study.png';
import useAiUsage from "@/hooks/useAiUsage";
import axiosClient from "@/api/axiosClient";

function formatBytes(bytes) {
  if (bytes === null || bytes === undefined || bytes === -1) return "Unlimited";
  if (bytes === 0) return "0 MB";
  const mb = bytes / (1024 * 1024);
  if (mb >= 1024) return (mb / 1024).toFixed(0) + "GB";
  return mb.toFixed(0) + "MB";
}

function formatVndPrice(priceVnd) {
  if (!priceVnd || priceVnd === 0) return "0đ";
  return new Intl.NumberFormat("vi-VN").format(priceVnd) + "đ";
}

const defaultPlans = [
  {
    code: "FREE",
    name: "Free",
    priceVnd: 0,
    description: "For trying Study Hub AI features.",
    features: [
      "5 AI requests per day",
      "Up to 15 flashcards per generation",
      "Up to 20 quiz questions per generation",
      "Create up to 3 workspaces",
      "5MB max file size",
      "100MB total storage capacity",
      "3 document uploads per day",
    ],
  },
  {
    code: "PRO",
    name: "Pro",
    priceVnd: 99000,
    description: "For frequent study sessions.",
    features: [
      "Unlimited AI requests",
      "Unlimited flashcards per generation",
      "Up to 50 quiz questions per generation",
      "Unlimited workspaces",
      "10MB max file size",
      "1GB total storage capacity",
      "Unlimited document uploads",
    ],
  },
];

export default function LandingPage() {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const navigate = useNavigate();
  const [isStartingUpgrade, setIsStartingUpgrade] = useState(false);
  const [dbPlans, setDbPlans] = useState([]);
  const { subscriptionTier, loading } = useAiUsage();
  const role = getTokenRole();
  const canUpgrade = role !== "ADMIN" && subscriptionTier === "FREE";

  React.useEffect(() => {
    let isMounted = true;
    axiosClient.get("/api/subscription/plans")
      .then((res) => {
        if (isMounted && res.data && res.data.length > 0) {
          const sorted = (res.data || []).sort((a, b) => (a.priceVnd || 0) - (b.priceVnd || 0));
          setDbPlans(sorted);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch active plans on landing page:", err);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleUpgrade = async (targetPlanCode = "PRO") => {
    if (!isLoggedIn) {
      alert("Vui lòng đăng nhập để nâng cấp!");
      navigate("/login");
      return;
    }

    if (isStartingUpgrade || !canUpgrade) return;

    try {
      setIsStartingUpgrade(true);
      const payment = await createVnpayPayment(targetPlanCode);
      if (payment?.paymentUrl) {
        window.location.href = payment.paymentUrl;
        return;
      }
      alert("Could not start payment. Please try again.");
    } catch (error) {
      console.error("Failed to create VNPAY payment:", error);
      alert("Could not start payment. Please try again.");
    } finally {
      setIsStartingUpgrade(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50 text-slate-800 relative overflow-hidden font-sans">
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
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>

          <div className="flex items-center gap-4">
            {isLoggedIn ? (
              <Link to={role === "ADMIN" ? "/admin/dashboard" : "/home"}>
                <Button className="rounded-full bg-[#f26522] hover:bg-[#f26522]/90 text-white font-bold px-6 shadow-md transition-transform hover:scale-[1.02]">
                  {role === "ADMIN" ? "Go to Dashboard" : "Go to Home"}
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

      <div className="flex-grow flex flex-col">
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

      {/* Pricing Section */}
      <section id="pricing" className="py-22 bg-white border-t border-slate-100 relative">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-3xl mx-auto mb-12 space-y-3">
            <h2 className="text-xs font-black uppercase text-[#f26522] tracking-widest">Pricing Plans</h2>
            <p className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight">Simple, transparent pricing</p>
            <p className="text-slate-500 text-sm sm:text-base">Choose the AI usage level that fits your study routine.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            {(dbPlans.length > 0 ? dbPlans : defaultPlans).map((p) => {
              const planCode = String(p.code || p.name).toUpperCase();
              const isPro = planCode === "PRO";
              const isFree = planCode === "FREE" || p.priceVnd === 0;
              const currentTier = String(subscriptionTier || "FREE").toUpperCase();
              const effectiveTier = role === "ADMIN" ? "PRO" : currentTier;

              // Dynamic tier comparison based on plan price (priceVnd)
              const allPlansList = dbPlans.length > 0 ? dbPlans : defaultPlans;
              const userCurrentPlanObj = allPlansList.find(
                (plan) => String(plan.code || plan.name).toUpperCase() === effectiveTier
              );
              const currentUserPrice = userCurrentPlanObj ? (userCurrentPlanObj.priceVnd || 0) : 0;
              const cardPrice = p.priceVnd || 0;

              const isCurrent = isLoggedIn && effectiveTier === planCode;
              const isLowerTier = isLoggedIn && !isCurrent && currentUserPrice > cardPrice;
              const isDisabled = isCurrent || isLowerTier || isStartingUpgrade || loading;

              let buttonLabel = `Upgrade to ${p.name || p.code}`;
              if (isCurrent) {
                buttonLabel = "Current plan";
              } else if (isLowerTier) {
                buttonLabel = `Included in ${effectiveTier}`;
              } else if (isFree) {
                buttonLabel = "Free Forever";
              }

              const features = p.features || [
                p.dailyAiLimit === -1 ? "Unlimited AI requests" : `${p.dailyAiLimit} AI requests per day`,
                p.maxFlashcardsPerGeneration === -1 ? "Unlimited flashcards per generation" : `Up to ${p.maxFlashcardsPerGeneration} flashcards per generation`,
                p.maxQuizQuestionsPerGeneration === -1 ? "Unlimited quiz questions per generation" : `Up to ${p.maxQuizQuestionsPerGeneration} quiz questions per generation`,
                p.maxOwnedProjects === -1 ? "Unlimited workspaces" : `Create up to ${p.maxOwnedProjects} workspaces`,
                `${formatBytes(p.maxFileSizeBytes)} max file size`,
                `${formatBytes(p.totalStorageBytes)} total storage capacity`,
                p.dailyUploadLimit === -1 ? "Unlimited document uploads" : `${p.dailyUploadLimit} document uploads per day`,
              ];

              return (
                <div
                  key={p.code || p.name}
                  className={`p-8 rounded-xl flex flex-col justify-between transition-all duration-300 relative ${
                    isPro
                      ? "bg-white border-2 border-orange-500 shadow-md scale-[1.01] md:scale-105"
                      : "bg-slate-50/50 border border-slate-200/80 shadow-sm hover:bg-white hover:shadow-md"
                  }`}
                >
                  {isPro && (!isLoggedIn || (!isCurrent && !isLowerTier)) && (
                    <span className="absolute -top-3.5 right-8 bg-gradient-to-r from-orange-500 to-amber-500 text-white text-[11px] font-extrabold px-3 py-1.5 rounded-full shadow-sm tracking-wider uppercase">
                      Popular
                    </span>
                  )}
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-2xl font-black text-slate-800">{p.name || p.code}</h3>
                      {isPro && <Sparkles className="h-5 w-5 text-amber-500 fill-amber-500 animate-pulse" />}
                    </div>
                    <p className="mt-2 text-sm text-slate-400">
                      {p.description || (isFree ? "For trying Study Hub AI features." : "For frequent study sessions.")}
                    </p>
                    <div className="mt-6 flex items-baseline">
                      <span className="text-4xl font-black text-slate-800">{formatVndPrice(p.priceVnd)}</span>
                      <span className="text-slate-400 text-xs ml-1">/ {p.priceVnd === 0 ? "forever" : "month"}</span>
                    </div>
                    <ul className="my-8 space-y-3.5">
                      {features.map((feat, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-sm text-slate-600 font-semibold">
                          <Check className="h-5 w-5 text-green-500 shrink-0" strokeWidth={3} />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <Button
                    className={`w-full rounded-xl py-6 font-bold text-sm shadow-md transition-all duration-300 ${
                      isCurrent || isLowerTier || isFree
                        ? "bg-slate-100 hover:bg-slate-100 text-slate-500 cursor-not-allowed border border-slate-200 shadow-none"
                        : "bg-[#f26522] hover:bg-[#d95316] text-white hover:shadow-orange-500/20 hover:scale-[1.02] cursor-pointer"
                    }`}
                    disabled={isDisabled || isFree}
                    onClick={() => handleUpgrade(p.code)}
                  >
                    {isStartingUpgrade ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : !isCurrent && !isLowerTier && !isFree ? (
                      <Sparkles className="mr-2 h-4 w-4 fill-white" />
                    ) : null}
                    {buttonLabel}
                  </Button>
                </div>
              );
            })}
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
    </div>
  );
}

function getTokenRole() {
  return localStorage.getItem("userRole") || null;
}
