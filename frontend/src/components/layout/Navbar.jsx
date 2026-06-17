import React, { useCallback, useEffect, useRef, useState } from "react";
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
  GraduationCap,
  Layers,
  Tag,
  Loader2,
  Sparkles,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axiosClient from "@/api/axiosClient";
import { createVnpayPayment } from "@/api/paymentApi";
import useAiUsage from "@/hooks/useAiUsage";

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
  disabled = false,
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

  const filteredItems = (items || []).filter(
    (item) =>
      item &&
      ((item.code || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.name || "").toLowerCase().includes(searchTerm.toLowerCase())),
  );

  const selectedItem = (items || []).find((i) => i && i.code === value);

  return (
    <div
      className={`relative flex flex-col gap-1.5 ${disabled ? "opacity-60 pointer-events-none" : ""}`}
      ref={dropdownRef}
    >
      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
        {icon} {label}
      </label>

      <div
        className={`relative flex items-center w-full border ${
          disabled
            ? "border-slate-100 bg-slate-50 cursor-not-allowed"
            : isOpen
              ? "border-[#f26522] ring-1 ring-orange-100 cursor-text"
              : "border-slate-200 hover:border-slate-300 cursor-text"
        } rounded-xl bg-white transition-all`}
        onClick={() => !disabled && setIsOpen(true)}
      >
        <input
          type="text"
          disabled={disabled}
          className="w-full h-11 px-4 bg-transparent outline-none text-sm text-slate-800 placeholder-slate-400 disabled:cursor-not-allowed"
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
          onFocus={() => !disabled && setIsOpen(true)}
        />
        {value && !isOpen && !disabled && (
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

      {isOpen && !disabled && (
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
  const navigate = useNavigate();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [notifications, setNotifications] = useState([]);
  const [userName, setUserName] = useState("");
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // State chứa dữ liệu Lọc
  const [filterData, setFilterData] = useState({
    school: "",
    major: "",
    course: "",
    category: "",
  });

  const filterPanelRef = useRef(null);
  const notificationButtonRef = useRef(null);
  const notificationPanelRef = useRef(null);
  const [userInitial, setUserInitial] = useState(() => getTokenInitial());
  const [userRole] = useState(() => getTokenRole());
  const [isStartingUpgrade, setIsStartingUpgrade] = useState(false);
  const dropdownRef = useRef(null);
  const profileButtonRef = useRef(null);
  const { subscriptionTier } = useAiUsage();
  const canUpgrade = userRole !== "ADMIN" && subscriptionTier === "FREE";

  // Dynamic filter state lists loaded from backend APIs
  const [schools, setSchools] = useState([]);
  const [majors, setMajors] = useState([]);
  const [courses, setCourses] = useState([]);
  const [categories, setCategories] = useState([]);

  // Fetch initial schools and categories
  useEffect(() => {
    const loadInitialData = async () => {
      try {
        const schoolsRes = await axiosClient.get("/api/schools");
        setSchools(schoolsRes.data || []);
      } catch (error) {
        console.error("Failed to load schools:", error);
      }
      try {
        const categoriesRes = await axiosClient.get("/api/categories/active");
        setCategories(categoriesRes.data || []);
      } catch (error) {
        console.error("Failed to load categories:", error);
      }
    };
    loadInitialData();
  }, []);

  // Fetch majors dynamically when selected school changes
  useEffect(() => {
    const loadMajors = async () => {
      try {
        let url = "/api/majors";
        if (filterData.school) {
          const selectedSchool = schools.find(
            (s) => s.code === filterData.school,
          );
          if (selectedSchool) {
            url += `?schoolId=${selectedSchool.id}`;
          }
        }
        const res = await axiosClient.get(url);
        setMajors(res.data || []);
      } catch (error) {
        console.error("Failed to load majors:", error);
      }
    };
    loadMajors();
  }, [filterData.school, schools]);

  // Fetch courses dynamically when selected major changes
  useEffect(() => {
    const loadCourses = async () => {
      try {
        let url = "/api/courses";
        if (filterData.major) {
          const selectedMajor = majors.find((m) => m.code === filterData.major);
          if (selectedMajor) {
            url += `?majorId=${selectedMajor.id}&size=100`;
          }
        } else {
          url += "?size=100";
        }
        const res = await axiosClient.get(url);
        const content = res.data?.content || res.data || [];
        setCourses(content);
      } catch (error) {
        console.error("Failed to load courses:", error);
      }
    };
    loadCourses();
  }, [filterData.major, majors]);

  // Handlers to handle cascading resets cleanly on parent updates
  const handleSchoolChange = (val) => {
    setFilterData((prev) => ({
      ...prev,
      school: val,
      major: "",
      course: "",
    }));
  };

  const handleMajorChange = (val) => {
    setFilterData((prev) => ({
      ...prev,
      major: val,
      course: "",
    }));
  };

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

  const fetchNotifications = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axiosClient.get("/api/notifications?page=0&size=5");
      setNotifications(res.data.content || []);
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    }
  }, []);

  const fetchUnreadCount = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;
    try {
      const res = await axiosClient.get("/api/notifications/unread-count");
      setUnreadCount(res.data.count);
    } catch (error) {
      console.warn("Failed to fetch unread notifications:", error);
    }
  }, []);

  useEffect(() => {
    fetchUnreadCount();
    fetchNotifications();
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
  }, [fetchUnreadCount, fetchNotifications]);

  useEffect(() => {
    queueMicrotask(() => {
      fetchUnreadCount();
    });
  }, [fetchUnreadCount]);

  const handleUpgradeToPro = async () => {
    if (isStartingUpgrade) return;

    try {
      setIsStartingUpgrade(true);
      const payment = await createVnpayPayment();
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
            to="/home"
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
                  filterData.major ||
                  filterData.course ||
                  filterData.category) && (
                  <span className="absolute top-2 right-2 h-2 w-2 bg-[#f26522] rounded-full" />
                )}
              </Button>

              {/* BẢNG LỌC NÂNG CAO */}
              {isFilterOpen && (
                <div className="absolute right-0 top-13 w-[400px] bg-white rounded-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] border border-slate-200/50 z-50 animate-in slide-in-from-top-4 duration-200">
                  <div className="p-4 border-b flex justify-between items-center bg-white rounded-t-[24px]">
                    <div className="flex items-center gap-2">
                      <Filter className="h-5 w-5 text-[#f26522]" />
                      <h4 className="font-extrabold text-slate-800 text-[16px]">
                        Advanced Filter
                      </h4>
                    </div>
                    <button onClick={() => setIsFilterOpen(false)}>
                      <X
                        size={18}
                        className="text-slate-400 hover:text-slate-700 cursor-pointer"
                      />
                    </button>
                  </div>

                  <div className="p-4 space-y-5">
                    {/* Academic Cascade Connector Wrapper */}
                    <div className="bg-slate-50/70 p-4 rounded-2xl border border-slate-100/80 space-y-4 relative">
                      {/* Cascade connection dashed line */}
                      <div className="absolute left-[18px] top-[45px] bottom-[5px] border-l-2 border-dashed border-orange-200" />
                      {/* Combobox School */}
                      <div className="pl-6 relative">
                        <div className="absolute left-[-3px] top-[42px] w-3 h-3 rounded-full bg-[#f26522] border-2 border-white shadow-sm" />
                        <SearchableDropdown
                          icon={
                            <GraduationCap className="h-4 w-4 text-[#f26522]" />
                          }
                          label="School"
                          placeholder="Select School"
                          items={schools}
                          value={filterData.school}
                          onChange={handleSchoolChange}
                        />
                      </div>

                      {/* Combobox Major */}
                      <div className="pl-6 relative">
                        <div
                          className={`absolute left-[-3px] top-[42px] w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors ${
                            filterData.school ? "bg-[#f26522]" : "bg-slate-300"
                          }`}
                        />
                        <SearchableDropdown
                          icon={<Layers className="h-4 w-4 text-[#f26522]" />}
                          label="Major"
                          placeholder={
                            filterData.school
                              ? "Select Major"
                              : "Please select school first"
                          }
                          items={majors}
                          value={filterData.major}
                          onChange={handleMajorChange}
                          disabled={!filterData.school}
                        />
                      </div>

                      {/* Combobox Course */}
                      <div className="pl-6 relative">
                        <div
                          className={`absolute left-[-3px] top-[42px] w-3 h-3 rounded-full border-2 border-white shadow-sm transition-colors ${
                            filterData.major ? "bg-[#f26522]" : "bg-slate-300"
                          }`}
                        />
                        <SearchableDropdown
                          icon={<BookOpen className="h-4 w-4 text-[#f26522]" />}
                          label="Course"
                          placeholder={
                            filterData.major
                              ? "Select Course"
                              : "Please select major first"
                          }
                          items={courses}
                          value={filterData.course}
                          onChange={(val) =>
                            setFilterData((prev) => ({ ...prev, course: val }))
                          }
                          disabled={!filterData.major}
                        />
                      </div>
                    </div>

                    {/* Category Selection Grid */}
                    <div className="flex flex-col gap-2.5">
                      <label className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                        <Tag className="h-4 w-4 text-[#f26522]" /> Category
                      </label>
                      <div className="grid grid-cols-3 gap-2">
                        {categories.map((cat) => {
                          const isSelected = filterData.category === cat.code;

                          return (
                            <button
                              key={cat.id || cat.code}
                              type="button"
                              onClick={() => {
                                setFilterData((prev) => ({
                                  ...prev,
                                  category: isSelected ? "" : cat.code,
                                }));
                              }}
                              className={`h-9 px-2.5 rounded-lg border text-[11px] font-bold
flex items-center justify-center
transition-all cursor-pointer select-none
${
  isSelected
    ? "bg-[#f26522]/10 border-[#f26522] text-[#f26522] shadow-sm"
    : "bg-white border-slate-200/60 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
}`}
                            >
                              <span className="truncate whitespace-nowrap leading-normal">
                                {cat.name}
                              </span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  <div className="p-4.5 bg-slate-50/50 border-t border-slate-100 flex gap-3 rounded-b-[24px]">
                    <Button
                      variant="outline"
                      className="flex-1 rounded-xl font-bold cursor-pointer"
                      onClick={() =>
                        setFilterData({
                          school: "",
                          major: "",
                          course: "",
                          category: "",
                        })
                      }
                    >
                      Reset
                    </Button>
                    <Button
                      className="flex-[2] bg-[#f26522] text-white rounded-xl hover:bg-[#d9581c] font-bold shadow-md shadow-orange-500/10 cursor-pointer"
                      onClick={handleApplyFilter}
                    >
                      Apply{" "}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* THÔNG BÁO VÀ NGƯỜI DÙNG */}
        {localStorage.getItem("token") ? (
          <div className="flex items-center gap-4">
            <div className="relative">
              <Button
                ref={notificationButtonRef}
                variant="ghost"
                size="icon"
                onClick={() => {
                  setIsNotificationOpen(!isNotificationOpen);
                  if (!isNotificationOpen) {
                    fetchNotifications();
                    fetchUnreadCount();
                  }
                }}
                className="rounded-full h-10 w-10"
              >
                <Bell className="!h-5 !w-5" />
                {unreadCount > 0 && (
                  <span className="absolute top-1 right-1 h-4 w-4 bg-red-500 rounded-full text-white text-[9px] flex items-center justify-center font-bold">
                    {unreadCount}
                  </span>
                )}
              </Button>

              {isNotificationOpen && (
                <div
                  ref={notificationPanelRef}
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-100 z-50 overflow-hidden"
                >
                  <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                    <span className="font-extrabold text-sm text-slate-800">
                      Thông báo
                    </span>
                    <button
                      onClick={async () => {
                        try {
                          await axiosClient.put("/api/notifications/read-all");
                          setUnreadCount(0);
                          setNotifications((prev) =>
                            prev.map((n) => ({ ...n, isRead: true })),
                          );
                        } catch (err) {
                          console.error(err);
                        }
                      }}
                      className="text-xs text-[#f26522] hover:text-[#d9581c] font-bold"
                    >
                      Đọc tất cả
                    </button>
                  </div>
                  <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                    {notifications.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-400">
                        Không có thông báo nào
                      </div>
                    ) : (
                      notifications.map((item) => (
                        <div
                          key={item.id}
                          onClick={async () => {
                            setIsNotificationOpen(false);
                            try {
                              if (!item.isRead) {
                                await axiosClient.put(
                                  `/api/notifications/${item.id}/read`,
                                );
                              }
                            } catch (err) {
                              console.error(err);
                            }
                            if (
                              item.referenceType === "DOCUMENT" &&
                              item.referenceId
                            ) {
                              navigate(`/documents/${item.referenceId}`);
                            } else if (
                              item.referenceType === "USER" &&
                              item.referenceId
                            ) {
                              navigate(`/users/${item.referenceId}`);
                            } else if (
                              item.referenceType === "WORKSPACE" &&
                              item.referenceId
                            ) {
                              navigate(`/workspace/${item.referenceId}`);
                            }
                          }}
                          className={`p-3 text-left hover:bg-slate-50 transition-colors cursor-pointer flex gap-3 ${!item.isRead ? "bg-orange-50/20" : ""}`}
                        >
                          <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-[#f26522] shrink-0">
                            <Bell className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="font-bold text-xs text-slate-700 truncate">
                              {item.title}
                            </p>
                            <p className="text-[11px] text-slate-500 line-clamp-2 mt-0.5">
                              {item.message}
                            </p>
                            <p className="text-[10px] text-slate-400 mt-1">
                              {new Date(item.createdAt).toLocaleString()}
                            </p>
                          </div>
                          {!item.isRead && (
                            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-2 shrink-0" />
                          )}
                        </div>
                      ))
                    )}
                  </div>
                  <Link
                    to="/notifications"
                    onClick={() => setIsNotificationOpen(false)}
                    className="block p-3 text-center text-xs font-bold text-[#f26522] hover:bg-slate-50 border-t border-slate-100 bg-slate-50/30"
                  >
                    Xem tất cả thông báo
                  </Link>
                </div>
              )}
            </div>

            <div className="relative">
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
                  className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-slate-100 pt-2 z-50"
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
                  {canUpgrade && (
                    <button
                      onClick={handleUpgradeToPro}
                      disabled={isStartingUpgrade}
                      className="border-t w-full px-4 py-3 text-left text-xs font-bold text-[#f26522] hover:bg-orange-50 flex items-center gap-2 disabled:opacity-60"
                    >
                      {isStartingUpgrade ? (
                        <Loader2 size={15} className="animate-spin" />
                      ) : (
                        <Sparkles size={15} />
                      )}
                      Upgrade to Pro
                    </button>
                  )}

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
        ) : (
          <div className="flex items-center gap-3">
            <Link
              to="/login"
              className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors hidden sm:block"
            >
              Log in
            </Link>
            <Link to="/signup">
              <Button className="rounded-full bg-[#f26522] hover:bg-[#f26522]/90 text-white font-semibold px-4 h-9">
                Sign up
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

function getTokenRole() {
  try {
    const token = localStorage.getItem("token");
    return token ? jwtDecode(token)?.role : null;
  } catch (error) {
    console.error("Invalid token:", error);
    return null;
  }
}

function getTokenInitial() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return "H";

    const decoded = jwtDecode(token);
    const name = decoded?.name || decoded?.sub || null;
    return name ? name.charAt(0).toUpperCase() : "H";
  } catch (error) {
    console.error("Invalid token:", error);
    return "H";
  }
}
