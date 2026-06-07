import React, { useEffect, useRef, useState } from "react";
import { jwtDecode } from "jwt-decode";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Search,
  Filter, 
  Menu,
  BookOpen,
  LogOut,
  User,
  Settings,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";
import axiosClient from "@/api/axiosClient";

// ADDED: Thêm prop onSearch vào đây
export default function Navbar({ onMenuClick, onLogoutClick, onFilter, onSearch }) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // ADDED: State cho Search
  const [searchQuery, setSearchQuery] = useState("");

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [filterData, setFilterData] = useState({
    school: "",
    course: "",
    tag: "",
  });
  
  const filterPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);

  const [userInitial, setUserInitial] = useState("H");

  useEffect(() => {
    fetchUnreadCount();
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const decoded = jwtDecode(token);
        const name = decoded?.name || decoded?.sub || null;
        if (name) {
          setUserName(name);
          setUserInitial(name.charAt(0).toUpperCase());
        }
      }
    } catch (e) {
      console.error("Token decode error", e);
    }
  }, []);

  const fetchUnreadCount = async () => {
    try {
      const res = await axiosClient.get("/api/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch (error) {
      console.error(error);
    }
  };

  useEffect(() => {
    if (isNotificationOpen) {
      loadNotifications();
    }
  }, [isNotificationOpen]);

  useEffect(() => {
    const handleOutsideClick = (event) => {
      const target = event.target;

      if (
        isNotificationOpen &&
        !notificationPanelRef.current?.contains(target) &&
        !notificationButtonRef.current?.contains(target)
      ) {
        setIsNotificationOpen(false);
      }

      if (
        isFilterOpen &&
        !filterPanelRef.current?.contains(target)
      ) {
        setIsFilterOpen(false);
      }
    };

    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isNotificationOpen, isFilterOpen]);

  const loadNotifications = async () => {
    try {
      const res = await axiosClient.get("/api/notifications?page=0&size=4");
      setNotifications(res.data.content);
    } catch (error) {
      console.error(error);
    }
  };

  const markAsRead = async (id) => {
    try {
      await axiosClient.put(`/api/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error(error);
    }
  };

  const handleApplyFilter = () => {
    console.log("Filtering with:", filterData);
    setIsFilterOpen(false);
    
    if (onFilter) {
      onFilter(filterData);
    }
  };

  // ADDED: Hàm xử lý thay đổi text search (real-time)
  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    // Gọi hàm onSearch truyền từ component cha (nếu có)
    if (onSearch) {
      onSearch(value);
    }
  };

  // ADDED: Tùy chọn xử lý khi nhấn Enter (nếu bạn muốn submit form thay vì real-time)
  const handleKeyDown = (e) => {
    if (e.key === "Enter" && onSearch) {
      onSearch(searchQuery);
    }
  };

  return (
    <div className="w-full bg-white border-b border-gray-100 py-2.5 sticky top-0 z-40 shadow-sm/5 backdrop-blur-sm">
      <div className="w-full pr-4 sm:pr-6 flex items-center justify-between gap-2">
        {/* Logo & Menu Button */}
        <div className="flex items-center shrink-0">
          <div className="w-[72px] flex items-center justify-center shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:bg-slate-100 h-10 w-10 rounded-full"
              onClick={onMenuClick}
            >
              <Menu className="cursor-pointer size-6" />
            </Button>
          </div>

          <Link
            to="/dashboard"
            className="flex items-center gap-2 font-bold text-[20px] text-slate-800 tracking-tight ml-2"
          >
            <BookOpen className="h-7 w-7 text-[#f26522]" />
            <span className="hidden sm:inline-block">MinDoCu</span>
          </Link>
        </div>

        {/* Search Bar & Filter */}
        <div className="flex-1 max-w-2xl flex items-center gap-4 px-2">
          <div className="relative w-full flex items-center gap-2">
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-4 w-4" />
              </span>
              <Input
                className="pl-12 h-11 bg-slate-50 border-transparent hover:border-slate-300 focus-visible:border-orange-500 focus-visible:ring-orange-500/20 rounded-full shadow-sm text-sm transition-all"
                placeholder="Search..."
                value={searchQuery} // ADDED: Liên kết giá trị
                onChange={handleSearchChange} // ADDED: Xử lý thay đổi
                onKeyDown={handleKeyDown} // ADDED: Xử lý nhấn Enter
              />
            </div>
            
            <div className="relative" ref={filterPanelRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`hidden sm:flex rounded-full bg-slate-50 hover:bg-slate-100 text-slate-700 h-11 w-11 shrink-0 shadow-sm transition-colors ${
                  isFilterOpen ? "bg-orange-100 text-orange-600" : ""
                }`}
              >
                <Filter className="h-5 w-5" />
              </Button>

              {isFilterOpen && (
                <div className="absolute right-0 top-14 w-[320px] bg-white rounded-xl shadow-xl border border-slate-100 z-50 p-4">
                  <h4 className="font-semibold text-slate-800 mb-4 border-b pb-2">Filter Documents</h4>
                  
                  <div className="space-y-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">School / University</label>
                      <Input 
                        placeholder="e.g. FPT University..." 
                        className="h-9 text-sm"
                        value={filterData.school}
                        onChange={(e) => setFilterData({...filterData, school: e.target.value})}
                      />
                    </div>
                    
                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">Course</label>
                      <Input 
                        placeholder="e.g. SWP391..." 
                        className="h-9 text-sm"
                        value={filterData.course}
                        onChange={(e) => setFilterData({...filterData, course: e.target.value})}
                      />
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-medium text-slate-600">Tags</label>
                      <Input 
                        placeholder="e.g. React, Midterm..." 
                        className="h-9 text-sm"
                        value={filterData.tag}
                        onChange={(e) => setFilterData({...filterData, tag: e.target.value})}
                      />
                    </div>

                    <div className="flex flex-col gap-2 pt-2">
                      <Button 
                        variant="outline" 
                        className="w-full text-xs"
                        onClick={() => {
                          setFilterData({ school: "", course: "", tag: "" });
                        }}
                      >
                        Clear
                      </Button>
                      <Button 
                        className="w-full bg-[#f26522] hover:bg-[#d9581c] text-white text-xs"
                        onClick={handleApplyFilter}
                      >
                        Apply Filter
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Bell Icons */}
          <div className="relative">
            <Button
              ref={notificationButtonRef}
              variant="ghost"
              size="icon"
              onClick={() => setIsNotificationOpen(!isNotificationOpen)}
              className="rounded-full hover:bg-slate-100 text-slate-700 h-10 w-10 cursor-pointer flex items-center justify-center"
            >
              <Bell className="!h-5 !w-5" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[16px] h-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </Button>

            {isNotificationOpen && (
              <>
                <div
                  ref={notificationPanelRef}
                  className="absolute right-0 top-12 w-[310px] bg-white rounded-xl shadow-xl border border-slate-100 z-50"
                >
                  <div className="p-4 border-b border-slate-200">
                    <h3 className="font-semibold text-slate-800">
                      Notifications
                    </h3>
                  </div>

                  <div className="max-h-[320px] overflow-y-auto scrollbar-none">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-sm text-slate-500">
                        No notifications
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={() => markAsRead(item.id)}
                          className={`
                            px-4 py-3 border-b cursor-pointer
                            transition-all
                            hover:bg-slate-50
                            ${!item.isRead ? "bg-orange-50" : ""}
                          `}
                        >
                          <div className="flex gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                              <Bell size={16} className="text-[#f26522]" />
                            </div>

                            <div className="flex-1">
                              <p className="text-sm text-slate-700 leading-relaxed">
                                {item.message}
                              </p>
                              <p className="text-xs text-slate-400 mt-1">
                                {new Date(item.createdAt).toLocaleString()}
                              </p>
                            </div>

                            {!item.isRead && (
                              <div className="w-2 h-2 rounded-full bg-[#f26522] mt-2" />
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  <Link
                    to="/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="block text-center py-3 text-sm font-medium text-[#f26522] hover:bg-slate-50 transition-colors rounded-b-xl"
                  >
                    View all notifications
                  </Link>
                </div>
              </>
            )}
          </div>

          {/* User Profile Dropdown */}
          <div className="relative flex items-center gap-4 shrink-0">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-sm font-bold text-slate-800 leading-tight">
                {userName || "Guest"}
              </span>
              <span className="text-[10px] text-[#f26522] font-semibold">
                Free Plan
              </span>
            </div>

            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="cursor-pointer h-10 w-10 shrink-0 rounded-full bg-[#f26522] text-white flex items-center justify-center font-bold shadow-sm ring-2 ring-white hover:opacity-90 transition-all focus:outline-none"
            >
              {userInitial}
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-40 bg-transparent cursor-default"
                  onClick={() => setIsDropdownOpen(false)}
                />

                <div className="absolute right-0 top-12 w-48 bg-white rounded-xl shadow-xl border border-slate-100 py-1.5 z-50">
                  <Link
                    to="/profile"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors block rounded-t-xl"
                  >
                    <User size={15} className="text-slate-400" />
                    My Profile
                  </Link>

                  <button className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors cursor-pointer">
                    <Settings size={15} className="text-slate-400" />
                    Account Settings
                  </button>

                  <Link
                    to="/notifications"
                    onClick={() => setIsDropdownOpen(false)}
                    className="w-full px-4 py-2 text-left text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2.5 transition-colors block rounded-t-xl"
                  >
                    <Bell size={15} className="text-slate-400" />
                    Notifications
                  </Link>

                  <div className="border-t border-slate-100 my-1.5"></div>

                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      onLogoutClick();
                    }}
                    className="w-full px-4 py-2 text-left text-xs font-bold text-red-500 hover:bg-red-50 flex items-center gap-2.5 transition-colors rounded-b-xl cursor-pointer"
                  >
                    <LogOut size={15} className="text-red-500" />
                    Log Out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}