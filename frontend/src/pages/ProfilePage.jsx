import React, { useEffect, useMemo, useState, useRef } from "react";
import axiosClient from "@/api/axiosClient";
import Survey from "@/pages/Survey";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
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
} from "lucide-react";

export default function ProfilePage() {
    const [profileData, setProfileData] = useState({
        fullName: "Huân Hoàng",
        email: "huanhoang@gmail.com",
        school: "", // Sẽ luôn lưu sch.code ở đây
        startYear: "",
        followers: 0,
        uploads: 0,
        upvotes: 0,
        avatarUrl: "",
        languages: [],
    });

    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const fileInputRef = useRef(null);

    const [schoolOptions, setSchoolOptions] = useState([]);
    const [languageOptions, setLanguageOptions] = useState([]);
    const [selectedLanguageIds, setSelectedLanguageIds] = useState([]);
    const [loadingOptions, setLoadingOptions] = useState(true);

    const [showSurvey, setShowSurvey] = useState(false);

    const years = useMemo(
        () => Array.from({ length: 12 }, (_, i) => 2026 - i),
        []
    );

    const loadProfileAndOptions = async () => {
        try {
            setLoadingOptions(true);
            const [languagesResponse, schoolsResponse, profileResponse] = await Promise.all([
                axiosClient.get("/api/languages"),
                axiosClient.get("/api/schools"),
                axiosClient.get("/api/users/profile").catch(() => null),
            ]);

            const langs = languagesResponse.data || [];
            const schools = schoolsResponse.data || [];

            setLanguageOptions(langs);
            setSchoolOptions(schools);

            if (profileResponse && profileResponse.data) {
                const data = profileResponse.data;
                const backendSchoolStr = (data.schoolName || "").trim().toLowerCase();
                
                const matchedSchool = schools.find((sch) => {
                    const schName = (sch.name || "").trim().toLowerCase();
                    const schCode = (sch.code || "").trim().toLowerCase();
                    return schName === backendSchoolStr || 
                           schCode === backendSchoolStr || 
                           schName.includes(backendSchoolStr) || 
                           backendSchoolStr.includes(schName);
                });

                setProfileData((prev) => ({
                    ...prev,
                    fullName: data.fullName || data.username || prev.fullName,
                    email: data.email || data.username || prev.email,
                    avatarUrl: data.avatarUrl || prev.avatarUrl,
                    school: matchedSchool ? matchedSchool.code : (data.schoolName || ""),
                    startYear: data.startYear ? String(data.startYear) : "",
                    languages: data.languages || [],
                    
                    // 🔥 FIX 1: Lấy số liệu đếm từ Backend để hiển thị ở cục Dashboard Stats
                    uploads: data.uploads || 0,
                    followers: data.followers || 0,
                    upvotes: data.upvotes || 0,
                }));

                const currentLangIds = langs
                    .filter((lang) => data.languages?.includes(lang.name))
                    .map((lang) => lang.id);
                setSelectedLanguageIds(currentLangIds);
            }
        } catch (error) {
            console.error("Failed to load profile details:", error);
        } finally {
            setLoadingOptions(false);
        }
    };

    useEffect(() => {
        loadProfileAndOptions();

        const isCompleted = localStorage.getItem("surveyCompleted") === "true";
        const isSkipped = localStorage.getItem("surveySkipped") === "true";
        if (!isCompleted && !isSkipped) {
            setShowSurvey(true);
        }
    }, []);

    const handleSurveyClose = async (result) => {
        setShowSurvey(false);

        if (result && result.completed) {
            await loadProfileAndOptions();

            if (result.surveyData) {
                const survey = result.surveyData;
                const backendSchoolStr = (survey.schoolName || "").trim().toLowerCase();

                const matchedSchool = schoolOptions.find((sch) => {
                    const schName = (sch.name || "").trim().toLowerCase();
                    const schCode = (sch.code || "").trim().toLowerCase();
                    return schName === backendSchoolStr || 
                           schCode === backendSchoolStr || 
                           schName.includes(backendSchoolStr) || 
                           backendSchoolStr.includes(schName);
                });

                setProfileData((prev) => ({
                    ...prev,
                    school: matchedSchool ? matchedSchool.code : (survey.schoolName || ""),
                    startYear: survey.startYear ? String(survey.startYear) : "",
                    languages: Array.from(survey.languages || []),
                }));

                setLanguageOptions((currentOptions) => {
                    if (currentOptions && currentOptions.length > 0) {
                        const updatedLangIds = currentOptions
                            .filter((lang) => survey.languages?.includes(lang.name))
                            .map((lang) => lang.id);
                        setSelectedLanguageIds(updatedLangIds);
                    }
                    return currentOptions;
                });
            }

            alert("Đã cập nhật và đồng bộ dữ liệu khảo sát vào hồ sơ của bạn! 🎉");
        }
    };

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setSelectedFile(file);
            const imageUrl = URL.createObjectURL(file);
            setPreviewUrl(imageUrl);
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData((prev) => ({ ...prev, [name]: value }));
    };

    const toggleLanguage = (languageId) => {
        if (selectedLanguageIds.includes(languageId)) {
            setSelectedLanguageIds(selectedLanguageIds.filter((id) => id !== languageId));
        } else {
            setSelectedLanguageIds([...selectedLanguageIds, languageId]);
        }
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let uploadedAvatarUrl = profileData.avatarUrl;

            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile);

                const response = await axiosClient.post("/api/users/upload-avatar", formData, {
                    headers: {
                        "Content-Type": "multipart/form-data",
                    },
                });
                uploadedAvatarUrl = response.data.fileUrl;
            }

            const surveyPayload = {
                schoolName: profileData.school || null,
                startYear: profileData.startYear ? Number(profileData.startYear) : null,
                languageIds: selectedLanguageIds,
            };

            await axiosClient.post("/api/survey", surveyPayload);

            setProfileData((prev) => ({
                ...prev,
                avatarUrl: uploadedAvatarUrl,
                languages: languageOptions
                    .filter((lang) => selectedLanguageIds.includes(lang.id))
                    .map((lang) => lang.name),
            }));

            setSelectedFile(null);
            alert("Cập nhật thông tin tài khoản và học vấn thành công! 🎉");
        } catch (error) {
            console.error("Lỗi kết nối API:", error.response?.data || error.message);
            alert("Không thể cập nhật thông tin lên hệ thống!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300">
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Profile</h1>
                <p className="text-sm text-slate-500 font-medium">
                    Manage your personal information and view your stats.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="space-y-6">
                    <Card className="border-gray-100 shadow-md overflow-hidden bg-white rounded-2xl">
                        <CardContent className="pt-8 pb-6 flex flex-col items-center text-center">
                            <div className="relative group mb-4 cursor-pointer" onClick={triggerFileSelect}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />

                                <Avatar className="h-28 w-28 ring-4 ring-orange-500/10 shadow-md transition-all group-hover:brightness-95">
                                    <AvatarImage
                                        src={previewUrl || profileData.avatarUrl}
                                        alt={profileData.fullName}
                                        className="object-cover"
                                    />
                                    <AvatarFallback className="bg-[#f26522] text-white font-bold text-3xl uppercase">
                                        {profileData.fullName.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>

                                <div className="absolute inset-0 bg-black/40 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-white">
                                    <Camera size={22} className="animate-pulse" />
                                </div>
                            </div>

                            <h2 className="text-xl font-bold text-slate-800">{profileData.fullName}</h2>
                            <p className="text-xs text-[#f26522] bg-orange-50 px-2.5 py-0.5 rounded-full font-bold mt-1.5 flex items-center gap-1 justify-center w-fit mx-auto">
                                <Award size={12} />
                                Free Plan
                            </p>
                            <p className="text-xs text-slate-400 font-medium mt-2">
                                {schoolOptions.find(s => s.code === profileData.school)?.name || profileData.school || "No School Selected"}
                            </p>

                            <div className="flex flex-wrap gap-1 justify-center mt-3">
                                {profileData.languages?.map((lang, idx) => (
                                    <Badge key={idx} variant="secondary" className="text-[10px] bg-slate-100 text-slate-600 rounded-full">
                                        {lang}
                                    </Badge>
                                ))}
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-100 shadow-md bg-white rounded-2xl p-4">
                        <CardHeader className="p-2 mb-2">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">
                                Dashboard Stats
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="p-2 grid grid-cols-3 gap-2 text-center">
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                <Users size={18} className="text-slate-400 mx-auto mb-1" />
                                <div className="text-lg font-extrabold text-slate-800">{profileData.followers}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Followers</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                <FolderOpen size={18} className="text-[#f26522] mx-auto mb-1" />
                                <div className="text-lg font-extrabold text-slate-800">{profileData.uploads}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Uploads</div>
                            </div>
                            <div className="bg-slate-50 p-3 rounded-xl border border-slate-100/50">
                                <ThumbsUp size={18} className="text-slate-400 mx-auto mb-1" />
                                <div className="text-lg font-extrabold text-slate-800">{profileData.upvotes}</div>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-tight">Upvotes</div>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                    <Card className="border-gray-100 shadow-md bg-white rounded-2xl h-full">
                        <CardHeader className="px-6 pt-6 pb-2 border-b border-slate-50">
                            <CardTitle className="text-lg font-bold text-slate-800">Account Information</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6">
                            <form onSubmit={handleSaveProfile} className="space-y-5">
                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700 ml-0.5 flex items-center gap-1.5">
                                        <User size={15} className="text-slate-400" /> Full Name
                                    </label>
                                    <Input
                                        name="fullName"
                                        type="text"
                                        required
                                        value={profileData.fullName}
                                        onChange={handleInputChange}
                                        className="h-11 bg-slate-50 border-slate-200/80 rounded-xl focus-visible:border-orange-500 focus-visible:ring-orange-500/20 text-sm transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700 ml-0.5 flex items-center gap-1.5">
                                        <Mail size={15} className="text-slate-400" /> Email Address
                                    </label>
                                    <Input
                                        name="email"
                                        type="email"
                                        required
                                        value={profileData.email}
                                        onChange={handleInputChange}
                                        className="h-11 bg-slate-50 border-slate-200/80 rounded-xl focus-visible:border-orange-500 focus-visible:ring-orange-500/20 text-sm transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700 ml-0.5 flex items-center gap-1.5">
                                        <Shield size={15} className="text-slate-400" /> Organization / School
                                    </label>
                                    {/* 🔥 FIX 2: Sửa profileData.schoolName thành profileData.school */}
                                    <Select
                                        value={profileData.school}
                                        onValueChange={(val) => setProfileData((prev) => ({ ...prev, school: val }))}
                                    >
                                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200/80 rounded-xl text-sm focus:ring-orange-500/20">
                                            <SelectValue placeholder="Select school" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            {loadingOptions ? (
                                                <div className="p-2 text-sm text-slate-500">Loading schools...</div>
                                            ) : (
                                                schoolOptions.map((sch) => (
                                                    <SelectItem key={sch.id} value={sch.code}>
                                                        {sch.name}
                                                    </SelectItem>
                                                ))
                                            )}
                                        </SelectContent>
                                    </Select>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="text-sm font-bold text-slate-700 ml-0.5 flex items-center gap-1.5">
                                        <Calendar size={15} className="text-slate-400" /> Start Year
                                    </label>
                                    <Select
                                        value={profileData.startYear}
                                        onValueChange={(val) => setProfileData((prev) => ({ ...prev, startYear: val }))}
                                    >
                                        <SelectTrigger className="h-11 bg-slate-50 border-slate-200/80 rounded-xl text-sm focus:ring-orange-500/20">
                                            <SelectValue placeholder="Select start year" />
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

                                <div className="space-y-2.5">
                                    <label className="text-sm font-bold text-slate-700 ml-0.5 flex items-center gap-1.5">
                                        <BookOpen size={15} className="text-slate-400" /> Languages Learning
                                    </label>
                                    <div className="flex flex-wrap gap-2 p-1 bg-slate-50/50 border border-slate-100 rounded-xl min-h-[50px] items-center">
                                        {loadingOptions &&
                                            Array.from({ length: 4 }).map((_, i) => (
                                                <Skeleton key={i} className="h-9 w-24 rounded-full" />
                                            ))}
                                        {!loadingOptions &&
                                            languageOptions.map((language) => {
                                                const isSelected = selectedLanguageIds.includes(language.id);
                                                return (
                                                    <Button
                                                        key={language.id}
                                                        type="button"
                                                        variant={isSelected ? "default" : "outline"}
                                                        onClick={() => toggleLanguage(language.id)}
                                                        className={`rounded-full h-8 px-4 text-xs font-semibold transition ${isSelected
                                                            ? "bg-[#f26522] text-white hover:bg-[#d95316]"
                                                            : "border-slate-200 text-slate-700 hover:border-slate-400 bg-white"
                                                            }`}
                                                    >
                                                        {language.name}
                                                    </Button>
                                                );
                                            })}
                                    </div>
                                </div>

                                <div className="pt-4 flex justify-end">
                                    <Button
                                        type="submit"
                                        disabled={isLoading}
                                        className="px-6 h-11 bg-[#f26522] hover:bg-[#d9541a] text-white font-bold rounded-xl shadow-md shadow-[#f26522]/20 transition-all transform active:scale-[0.98]"
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