import React, { useState, useRef } from "react"; // Đã thêm useRef ở đây
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { User, Mail, Shield, Camera, Award, ThumbsUp, FolderOpen, Users } from "lucide-react";

export default function ProfilePage() {
    const [profileData, setProfileData] = useState({
        fullName: "Huân Hoàng",
        email: "huanhoang@gmail.com",
        school: "FPT University",
        followers: 0,
        uploads: 3,
        upvotes: 0,
        avatarUrl: ""
    });

    const [isLoading, setIsLoading] = useState(false);
    const [selectedFile, setSelectedFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState("");
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
        const imageUrl = URL.createObjectURL(file);
        setPreviewUrl(imageUrl); // Bạn mới chỉ set preview để xem tạm
        console.log("File thực tế để chuẩn bị ném lên API:", file);
    }
};

    const triggerFileSelect = () => {
        fileInputRef.current.click();
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setProfileData(prev => ({ ...prev, [name]: value }));
    };

    // Ghi đè lại hàm handleSaveProfile trong ProfilePage.jsx
    const handleSaveProfile = async (e) => {
        e.preventDefault();
        setIsLoading(true);

        try {
            let uploadedAvatarUrl = profileData.avatarUrl;

            // 💥 CHÍNH THỨC GỬI FILE LÊN BACKEND KHI CÓ CHỌN ẢNH MỚI
            if (selectedFile) {
                const formData = new FormData();
                formData.append("file", selectedFile); // Key "file" này khớp chuẩn với @RequestParam("file") bên IntelliJ

                // Thay bằng cái Instance Axios của nhóm bạn (ví dụ: axios, axiosClient, v.v...)
                // Ở đây tui ví dụ dùng fetch thuần cho bạn dễ test không lo thiếu thư viện:
                const response = await fetch("http://localhost:8080/api/user/upload-avatar", {
                    method: "POST",
                    body: formData, // Không cần thêm Header Content-Type vì fetch tự nhận diện FormData
                });

                if (!response.ok) {
                    throw new Error("Lỗi khi upload ảnh lên server!");
                }

                const data = await response.json();
                uploadedAvatarUrl = data.fileUrl; // Nhận lại link URL từ IntelliJ trả về (http://localhost:8080/uploads/...)
                console.log("Đã lưu ảnh thành công tại Server:", uploadedAvatarUrl);
            }

            // Sau khi lấy được link ảnh thành công (hoặc giữ nguyên ảnh cũ), 
            // tiến hành gom dữ liệu update thông tin cá nhân còn lại
            const updateData = {
                ...profileData,
                avatarUrl: uploadedAvatarUrl
            };

            // Tạm thời cập nhật thẳng vào giao diện để test độ mượt
            setProfileData(updateData);
            setSelectedFile(null); // Xóa trạng thái file chờ

            alert("Cập nhật ảnh đại diện lên Server IntelliJ thành công vĩnh viễn! 🎉");

        } catch (error) {
            console.error("Lỗi kết nối API:", error);
            alert("Không thể kết nối đến server Spring Boot!");
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="w-full max-w-6xl mx-auto p-4 md:p-6 space-y-6 animate-in fade-in duration-300">

            {/* Tiêu đề trang */}
            <div>
                <h1 className="text-3xl font-black text-slate-800 tracking-tight">My Profile</h1>
                <p className="text-sm text-slate-500 font-medium">Manage your personal information and view your stats.</p>
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
                                    <AvatarImage src={previewUrl || profileData.avatarUrl} alt={profileData.fullName} className="object-cover" />
                                    <AvatarFallback className="bg-[#f26522] text-white font-bold text-3xl">
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
                            <p className="text-xs text-slate-400 font-medium mt-1">{profileData.school}</p>
                        </CardContent>
                    </Card>

                    <Card className="border-gray-100 shadow-md bg-white rounded-2xl p-4">
                        <CardHeader className="p-2 mb-2">
                            <CardTitle className="text-sm font-bold text-slate-700 uppercase tracking-wider">Dashboard Stats</CardTitle>
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
                            <form onSubmit={handleSaveProfile} className="space-y-4">

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
                                    <Input
                                        name="school"
                                        type="text"
                                        disabled
                                        value={profileData.school}
                                        className="h-11 bg-slate-100 border-transparent rounded-xl text-slate-500 text-sm font-medium"
                                    />
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
        </div>
    );
}