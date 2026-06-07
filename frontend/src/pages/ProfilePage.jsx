import React, { useEffect, useMemo, useRef, useState } from "react";
import axiosClient from "@/api/axiosClient";
import Survey from "@/pages/Survey";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { ScrollArea } from "@/components/ui/scroll-area";

import {
  User,
  Mail,
  Shield,
  Camera,
  Award,
  ThumbsUp,
  FolderOpen,
  Users,
  Calendar,
  BookOpen,
  Search,
} from "lucide-react";

export default function ProfilePage() {
  const [profileData, setProfileData] = useState({
    fullName: "",
    email: "",
    schoolCode: "",
    schoolName: "",
    startYear: "",
    followers: 0,
    uploads: 0,
    upvotes: 0,
    avatarUrl: "",
    languages: [],
  });

  const [schoolOptions, setSchoolOptions] = useState([]);
  const [languageOptions, setLanguageOptions] = useState([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState([]);

  const [loadingOptions, setLoadingOptions] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");

  const [showSurvey, setShowSurvey] = useState(false);

  const fileInputRef = useRef(null);

  const years = useMemo(
    () => Array.from({ length: 12 }, (_, i) => 2026 - i),
    [],
  );

  const [schoolOpen, setSchoolOpen] = useState(false);

  const filteredSchools = useMemo(() => {
    const query = (profileData.schoolName || "").trim().toLowerCase();
    if (!query) return schoolOptions;

    return schoolOptions.filter((item) =>
      `${item.name} ${item.code}`.toLowerCase().includes(query)
    );
  }, [profileData.schoolName, schoolOptions]);

  const loadProfileAndOptions = async () => {
    try {
      setLoadingOptions(true);

      const [languagesResponse, schoolsResponse, profileResponse] =
        await Promise.all([
          axiosClient.get("/api/languages"),
          axiosClient.get("/api/schools"),
          axiosClient.get("/api/profile"),
        ]);

      const langs = languagesResponse.data || [];
      const schools = schoolsResponse.data || [];
      const profile = profileResponse.data || {};

      setLanguageOptions(langs);
      setSchoolOptions(schools);

      setProfileData({
        fullName: profile.fullName || "",
        email: profile.email || "",
        avatarUrl: profile.avatarUrl || "",
        schoolCode: profile.schoolCode || "",
        schoolName: profile.schoolName || "",
        startYear: profile.startYear ? String(profile.startYear) : "",
        followers: profile.followers || 0,
        uploads: profile.uploads || 0,
        upvotes: profile.upvotes || 0,
        languages: profile.languages || [],
      });

      const currentLangIds = langs
        .filter((lang) => (profile.languages || []).includes(lang.name))
        .map((lang) => lang.id);

      setSelectedLanguageIds(currentLangIds);
    } catch (error) {
      console.error("Failed to load profile:", error);
    } finally {
      setLoadingOptions(false);
    }
  };

  useEffect(() => {
    const initializePage = async () => {
      await loadProfileAndOptions();

      const isCompleted = localStorage.getItem("surveyCompleted") === "true";

      const isSkipped = localStorage.getItem("surveySkipped") === "true";

      if (!isCompleted && !isSkipped) {
        setShowSurvey(true);
      }
    };

    initializePage();
  }, []);

  useEffect(() => {
    console.log("Profile Data:", profileData);
  }, [profileData]);

  const handleSurveyClose = async (result) => {
    setShowSurvey(false);

    if (result?.completed) {
      await loadProfileAndOptions();

      alert("Đã đồng bộ dữ liệu khảo sát vào hồ sơ 🎉");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;

    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const toggleLanguage = (languageId) => {
    setSelectedLanguageIds((prev) =>
      prev.includes(languageId)
        ? prev.filter((id) => id !== languageId)
        : [...prev, languageId],
    );
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];

    if (!file) return;

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleSaveProfile = async (e) => {
    e.preventDefault();

    try {
      setIsLoading(true);

      let uploadedAvatarUrl = profileData.avatarUrl;

      // upload avatar
      if (selectedFile) {
        const formData = new FormData();

        formData.append("file", selectedFile);

        const uploadResponse = await axiosClient.post(
          "/api/users/upload-avatar",
          formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          },
        );

        uploadedAvatarUrl = uploadResponse.data.fileUrl;
      }

      // update profile
      await axiosClient.put("/api/profile", {
        fullName: profileData.fullName,
        schoolCode: profileData.schoolCode || null,
        schoolName: profileData.schoolName || null,
        startYear: profileData.startYear ? Number(profileData.startYear) : null,
        languageIds: selectedLanguageIds,
        avatarUrl: uploadedAvatarUrl,
      });

      // reload profile
      await loadProfileAndOptions();

      setSelectedFile(null);

      alert("Cập nhật hồ sơ thành công 🎉");
    } catch (error) {
      console.error(error);

      alert("Không thể cập nhật hồ sơ!");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-6xl mx-auto p-3 md:p-3 space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-slate-800">My Profile</h1>

        <p className="text-sm text-slate-500 mt-1">
          Manage your personal information and learning profile.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* LEFT */}
        <div className="space-y-6">
          {/* PROFILE CARD */}
          <Card className="rounded-2xl border-orange-100 shadow-sm bg-white overflow-hidden">
            <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
              <div
                className="relative group cursor-pointer"
                onClick={triggerFileSelect}
              >
                <input
                  type="file"
                  accept="image/*"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                />

                <Avatar className="h-28 w-28 ring-4 ring-orange-200 shadow-lg">
                  <AvatarImage
                    src={previewUrl || profileData.avatarUrl}
                    alt={profileData.fullName}
                    className="object-cover"
                  />

                  <AvatarFallback className="bg-[#f26522] text-white text-3xl font-bold uppercase">
                    {profileData.fullName?.charAt(0)}
                  </AvatarFallback>
                </Avatar>

                <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition">
                  <Camera className="text-white" size={22} />
                </div>
              </div>

              <h2 className="text-2xl font-black text-slate-800 mt-4">
                {profileData.fullName}
              </h2>

              <div className="mt-2 px-3 py-1 rounded-full bg-orange-100 text-[#f26522] text-xs font-bold flex items-center gap-1">
                <Award size={12} />
                Free Plan
              </div>

              <p className="text-sm text-slate-500 mt-3">
                {profileData.schoolName || "No School Selected"}
              </p>

              <div className="flex flex-wrap gap-2 justify-center mt-4">
                {profileData.languages?.map((lang, idx) => (
                  <Badge
                    key={idx}
                    className="rounded-full bg-orange-50 text-[#f26522] border border-orange-100"
                  >
                    {lang}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* STATS */}
          <Card className="rounded-2xl border-orange-100 shadow-sm">
            <CardHeader>
              <CardTitle className="text-sm font-bold text-slate-700 uppercase">
                Dashboard Stats
              </CardTitle>
            </CardHeader>

            <CardContent className="grid grid-cols-3 gap-3">
              <div className="bg-orange-50 rounded-2xl p-4 text-center">
                <Users className="mx-auto text-[#f26522] mb-2" size={18} />

                <div className="text-xl font-black text-slate-800">
                  {profileData.followers}
                </div>

                <div className="text-xs text-slate-500">Followers</div>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4 text-center">
                <FolderOpen className="mx-auto text-[#f26522] mb-2" size={18} />

                <div className="text-xl font-black text-slate-800">
                  {profileData.uploads}
                </div>

                <div className="text-xs text-slate-500">Uploads</div>
              </div>

              <div className="bg-orange-50 rounded-2xl p-4 text-center">
                <ThumbsUp className="mx-auto text-[#f26522] mb-2" size={18} />

                <div className="text-xl font-black text-slate-800">
                  {profileData.upvotes}
                </div>

                <div className="text-xs text-slate-500">Upvotes</div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT */}
        <div className="lg:col-span-2">
          <Card className="rounded-2xl border-orange-100 shadow-sm">
            <CardHeader className="border-b border-orange-100">
              <CardTitle className="text-xl font-black text-slate-800">
                Account Information
              </CardTitle>
            </CardHeader>

            <CardContent className="px-6 -mt-[3px]">
              <form onSubmit={handleSaveProfile} className="space-y-4">
                {/* FULL NAME */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <User size={15} className="text-[#f26522]" />
                    Full Name
                  </label>

                  <Input
                    name="fullName"
                    value={profileData.fullName}
                    onChange={handleInputChange}
                    className="h-9 rounded-xl border-orange-100 focus-visible:ring-[#f26522]"
                  />
                </div>

                {/* EMAIL */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Mail size={15} className="text-[#f26522]" />
                    Email
                  </label>

                  <Input
                    name="email"
                    value={profileData.email}
                    disabled
                    className="h-9 rounded-xl border-orange-100 bg-slate-100"
                  />
                </div>

                {/* SCHOOL */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Shield size={15} className="text-[#f26522]" />
                    School
                  </label>

                  <div className="relative">
                    <InputGroup className="rounded-xl border-orange-100 bg-white/90">
                      <InputGroupAddon>
                        <Search className="h-4 w-4 text-slate-400" />
                      </InputGroupAddon>
                      <InputGroupInput
                        value={profileData.schoolName}
                        placeholder="Search your school"
                        onChange={(event) => {
                          const val = event.target.value;
                          setProfileData((prev) => ({
                            ...prev,
                            schoolName: val,
                            schoolCode: "",
                          }));
                          setSchoolOpen(true);
                        }}
                        onFocus={() => setSchoolOpen(true)}
                        onBlur={() => {
                          setTimeout(() => setSchoolOpen(false), 120);
                        }}
                      />
                    </InputGroup>

                    {schoolOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-md">
                        <ScrollArea className="max-h-48">
                          {loadingOptions ? (
                            <div className="p-3 text-xs text-slate-500">
                              Loading schools...
                            </div>
                          ) : filteredSchools.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500">
                              No schools match your search.
                            </div>
                          ) : (
                            filteredSchools.map((item) => (
                              <Button
                                key={item.id}
                                type="button"
                                variant="ghost"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setProfileData((prev) => ({
                                    ...prev,
                                    schoolName: item.name,
                                    schoolCode: item.code,
                                  }));
                                  setSchoolOpen(false);
                                }}
                                className="w-full justify-between rounded-none px-3 py-2 text-xs hover:bg-slate-50"
                              >
                                <span className="text-slate-700">
                                  {item.name}
                                </span>
                                <Badge
                                  variant="outline"
                                  className="border-slate-200 text-slate-500"
                                >
                                  {item.code}
                                </Badge>
                              </Button>
                            ))
                          )}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>

                {/* START YEAR */}
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <Calendar size={15} className="text-[#f26522]" />
                    Start Year
                  </label>

                  <Select
                    value={profileData.startYear}
                    onValueChange={(value) =>
                      setProfileData((prev) => ({
                        ...prev,
                        startYear: value,
                      }))
                    }
                  >
                    <SelectTrigger className="h-11 rounded-xl border-orange-100 focus:ring-[#f26522]">
                      <SelectValue placeholder="Select year" />
                    </SelectTrigger>

                    <SelectContent>
                      {years.map((year) => (
                        <SelectItem key={year} value={String(year)}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* LANGUAGES */}
                <div className="space-y-3">
                  <label className="text-sm font-bold text-slate-700 flex items-center gap-2">
                    <BookOpen size={15} className="text-[#f26522]" />
                    Languages Learning
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {loadingOptions &&
                      Array.from({ length: 4 }).map((_, i) => (
                        <Skeleton key={i} className="h-8 w-24 rounded-full" />
                      ))}

                    {!loadingOptions &&
                      languageOptions.map((language) => {
                        const isSelected = selectedLanguageIds.includes(
                          language.id,
                        );

                        return (
                          <Button
                            key={language.id}
                            type="button"
                            onClick={() => toggleLanguage(language.id)}
                            variant={isSelected ? "default" : "outline"}
                            className={
                              isSelected
                                ? "bg-[#f26522] hover:bg-[#d9541a] rounded-full"
                                : "rounded-full border-orange-200 text-slate-700 hover:border-[#f26522]"
                            }
                          >
                            {language.name}
                          </Button>
                        );
                      })}
                  </div>
                </div>

                {/* SAVE */}
                <div className="flex justify-end">
                  <Button
                    type="submit"
                    disabled={isLoading}
                    className="h-10 px-6 rounded-xl bg-[#f26522] hover:bg-[#d9541a] text-white font-bold shadow-lg shadow-orange-200"
                  >
                    {isLoading ? "Saving..." : "Save Changes"}
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>

      {showSurvey && <Survey onClose={handleSurveyClose} />}
    </div>
  );
}
