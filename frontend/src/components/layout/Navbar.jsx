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
  Bell,
  Book,
  X,
  ChevronDown,
} from "lucide-react";
import { Link } from "react-router-dom";
import axiosClient from "@/api/axiosClient";

// ==========================================
// COMPONENT TẠO DROPDOWN CÓ TÌM KIẾM (GIỐNG ẢNH)
// ==========================================
const SearchableDropdown = ({
  icon,
  label,
  placeholder,
  items,
  value,
  onChange,
  renderItem,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredItems = items.filter(
    (item) =>
      item.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  const selectedItem = items.find((i) => i.code === value);

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        {icon} {label}
      </label>

      <div
        className={`relative flex items-center w-full border ${isOpen ? "border-[#f26522] ring-1 ring-orange-100" : "border-slate-200 hover:border-slate-300"} rounded-xl bg-white transition-all cursor-text`}
        onClick={() => setIsOpen(true)}
      >
        <input
          type="text"
          className="w-full h-11 px-4 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400"
          placeholder={
            selectedItem
              ? `${selectedItem.code} - ${selectedItem.name}`
              : placeholder
          }
          value={isOpen ? searchTerm : ""}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
        />
        {value && !isOpen && (
          <button
            className="absolute right-8 text-slate-400 hover:text-red-500"
            onClick={(e) => {
              e.stopPropagation();
              onChange("");
              setSearchTerm("");
            }}
          >
            <X className="h-4 w-4" />
          </button>
        )}
        <ChevronDown
          className={`absolute right-3 h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`}
        />
      </div>

      {isOpen && (
        <div className="absolute top-[72px] left-0 w-full bg-white border border-slate-100 shadow-xl rounded-xl max-h-[220px] overflow-y-auto z-50">
          {filteredItems.length > 0 ? (
            filteredItems.map((item, index) => (
              <div
                key={index}
                className="px-4 py-3 hover:bg-slate-50 cursor-pointer flex justify-between items-center border-b border-slate-50 last:border-0 transition-colors"
                onClick={() => {
                  onChange(item.code);
                  setSearchTerm("");
                  setIsOpen(false);
                }}
              >
                {renderItem ? (
                  renderItem(item)
                ) : (
                  <>
                    <span className="font-semibold text-sm text-slate-800">
                      {item.code}
                    </span>
                    <span className="text-xs text-slate-400 truncate max-w-[180px]">
                      {item.name}
                    </span>
                  </>
                )}
              </div>
            ))
          ) : (
            <div className="p-4 text-center text-sm text-slate-400">
              Không tìm thấy kết quả
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// ==========================================
// NAVBAR CHÍNH
// ==========================================
export default function Navbar({
  onMenuClick,
  onLogoutClick,
  onFilter,
  onSearch,
}) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [userName, setUserName] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // State chứa dữ liệu Lọc
  const [filterData, setFilterData] = useState({
    school: "",
    course: "",
    category: "",
  });

  const filterPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);
  const [userInitial, setUserInitial] = useState("H");
  const dropdownRef = useRef(null);
  const profileButtonRef = useRef(null);

  // DỮ LIỆU TỪ HÌNH ẢNH CỦA ÔNG
  const schools = [
    { code: "FPT", name: "FPT University" },
    { code: "HCMUS", name: "University of Science" },
    { code: "UIT", name: "University of Information Technology" },
    { code: "HUST", name: "Hanoi University of Science and Technology" },
    { code: "NEU", name: "National Economics University" },
    { code: "UEH", name: "University of Economics Ho Chi Minh City" },
  ];

  const courses = [
    { code: "SWP391", name: "Software Architecture and Design" },
    { code: "PRF192", name: "Programming Fundamentals" },
    { code: "SSG104", name: "Understanding Group Dynamics" },
    { code: "DBI202", name: "Database Systems" },
    { code: "WEB301", name: "Web Application Development" },
    { code: "MAD101", name: "Mobile Application Development" },
    { code: "AI101", name: "Introduction to AI" },
  ];

  const categories = [
    { code: "SLIDE", name: "Slide", color: "bg-purple-500" },
    { code: "FINAL_EXAM", name: "Final Exam", color: "bg-red-500" },
    { code: "ASSIGNMENT", name: "Assignment", color: "bg-orange-500" },
    { code: "LAB", name: "Lab", color: "bg-pink-400" },
    { code: "PROJECT", name: "Project", color: "bg-cyan-400" },
    { code: "REFERENCE", name: "Reference", color: "bg-blue-600" },
  ];

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        profileButtonRef.current &&
        !profileButtonRef.current.contains(event.target)
      ) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
    } catch (error) {}
  };

  useEffect(() => {
    const handleOutsideClick = (event) => {
      if (
        isNotificationOpen &&
        !notificationPanelRef.current?.contains(event.target) &&
        !notificationButtonRef.current?.contains(event.target)
      )
        setIsNotificationOpen(false);
      if (isFilterOpen && !filterPanelRef.current?.contains(event.target))
        setIsFilterOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [isNotificationOpen, isFilterOpen]);

  const handleApplyFilter = () => {
    setIsFilterOpen(false);
    if (onFilter) onFilter(filterData); // Gọi hàm ra component cha để lọc và cuộn tới file
  };

  return (
    <div className="w-full bg-white border-b border-gray-100 py-3.5 sticky top-0 z-40 shadow-sm backdrop-blur-sm">
      <div className="w-full pr-4 sm:pr-6 flex items-center justify-between gap-2">
        {/* LOGO */}
        <div className="flex items-center shrink-0">
          <div className="w-[72px] flex items-center justify-center shrink-0">
            <Button
              variant="ghost"
              size="icon"
              className="text-slate-600 hover:bg-slate-100 h-10 w-10 rounded-full"
              onClick={onMenuClick}
            >
              <Menu className="size-6" />
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

        {/* THANH TÌM KIẾM & BỘ LỌC */}
        <div className="flex-1 max-w-2xl flex items-center gap-4 px-2">
          <div className="relative w-full flex items-center gap-3">
            <div className="relative w-full">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                <Search className="h-5 w-5" />
              </span>
              <Input
                className="pl-12 h-11 bg-slate-50 border-transparent hover:border-slate-200 focus:border-orange-500 rounded-full shadow-sm text-sm"
                placeholder="Search documents..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  if (onSearch) onSearch(e.target.value);
                }}
              />
            </div>

            <div className="relative" ref={filterPanelRef}>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className={`rounded-full h-11 w-11 shadow-sm transition-all ${isFilterOpen ? "bg-orange-100 text-orange-600" : "bg-slate-50"}`}
              >
                <Filter className="h-5 w-5" />
                {(filterData.school ||
                  filterData.course ||
                  filterData.category) && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-[#f26522] rounded-full" />
                )}
              </Button>

              {/* BẢNG LỌC NÂNG CAO */}
              {isFilterOpen && (
                <div className="absolute right-0 top-14 w-[420px] bg-slate-50 rounded-2xl shadow-2xl border border-slate-200 z-50 animate-in slide-in-from-top-4 duration-200">
                  <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-2xl">
                    <h4 className="font-bold text-slate-800">
                      Advanced Filter
                    </h4>
                    <button onClick={() => setIsFilterOpen(false)}>
                      <X
                        size={18}
                        className="text-slate-400 hover:text-slate-700"
                      />
                    </button>
                  </div>

                  <div className="p-5 space-y-5">
                    {/* Combobox School */}
                    <SearchableDropdown
                      icon={<span className="text-orange-500">🎓</span>}
                      label="School"
                      placeholder="Enter school code or name"
                      items={schools}
                      value={filterData.school}
                      onChange={(val) =>
                        setFilterData({ ...filterData, school: val })
                      }
                    />

                    {/* Combobox Course */}
                    <SearchableDropdown
                      icon={<span className="text-orange-500">📖</span>}
                      label="Course"
                      placeholder="Enter course code or name"
                      items={courses}
                      value={filterData.course}
                      onChange={(val) =>
                        setFilterData({ ...filterData, course: val })
                      }
                    />

                    {/* Combobox Category */}
                    <SearchableDropdown
                      icon={<span className="text-orange-500">📄</span>}
                      label="Category"
                      placeholder="Select category"
                      items={categories}
                      value={filterData.category}
                      onChange={(val) =>
                        setFilterData({ ...filterData, category: val })
                      }
                      renderItem={(item) => (
                        <div className="flex justify-between items-center w-full">
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2 h-2 rounded-full ${item.color}`}
                            ></span>
                            <span className="font-semibold text-sm text-slate-700">
                              {item.code}
                            </span>
                          </div>
                          <span className="text-xs text-slate-400">
                            {item.name}
                          </span>
                        </div>
                      )}
                    />
                  </div>

                  <div className="p-4 bg-white border-t flex gap-3 rounded-b-2xl">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl"
                      onClick={() =>
                        setFilterData({ school: "", course: "", category: "" })
                      }
                    >
                      Reset
                    </Button>
                    <Button
                      className="flex-[2] bg-[#f26522] text-white rounded-xl hover:bg-[#d9581c]"
                      onClick={handleApplyFilter}
                    >
                      Áp dụng Bộ Lọc
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* THÔNG BÁO VÀ NGƯỜI DÙNG */}
        <div className="flex items-center gap-4">
          <Button
            ref={notificationButtonRef}
            variant="ghost"
            size="icon"
            onClick={() => setIsNotificationOpen(!isNotificationOpen)}
            className="rounded-full h-10 w-10"
          >
            <Bell className="!h-5 !w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-4 right-[86px] h-4 w-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </Button>

          <button
            ref={profileButtonRef}
            onClick={() => setIsDropdownOpen((prev) => !prev)}
            className="h-10 w-10 rounded-full bg-[#f26522] text-white font-bold shadow-sm"
          >
            {userInitial}
          </button>

          {isDropdownOpen && (
            <div
              ref={dropdownRef}
              className="absolute right-4 top-14 w-48 bg-white rounded-xl shadow-xl border border-slate-100 pt-2 z-50"
            >
              <Link
                to="/profile"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <User size={15} /> My Profile
              </Link>
              <Link
                to="/notifications"
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <Bell size={15} /> Notifications
              </Link>
              <Link
                to="/my-library"
                className="px-4 py-2 pb-3 text-xs font-semibold text-slate-600 hover:bg-slate-50 flex items-center gap-2"
              >
                <Book size={15} /> My Library
              </Link>

              <button
                onClick={onLogoutClick}
                className="border-t w-full px-4 py-3 text-left text-xs font-bold text-red-500 hover:bg-red-50 hover:rounded-b-xl flex items-center gap-2"
              >
                <LogOut size={15} /> Log Out
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
