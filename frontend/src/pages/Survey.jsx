import React, { useEffect, useMemo, useState } from "react";
import { Calendar, GraduationCap, Search, X } from "lucide-react";
import axiosClient from "@/api/axiosClient";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea } from "@/components/ui/scroll-area";import { toast } from "react-hot-toast";

export default function Survey({ onClose, forceOpen = false }) {
  const SCHOOL_STORAGE_KEY = "profileSchool";
  const persistSchool = (schoolCode, schoolName) => {
    if (!schoolCode && !schoolName) return;
    localStorage.setItem(
      SCHOOL_STORAGE_KEY,
      JSON.stringify({
        schoolCode: schoolCode || "",
        schoolName: schoolName || "",
      }),
    );
  };
  // 1. Kiểm tra localStorage ngay từ lúc khởi tạo state
  const [open, setOpen] = useState(() => {
    const isCompleted = localStorage.getItem("surveyCompleted") === "true";
    const isSkipped = localStorage.getItem("surveySkipped") === "true";
    // Nếu parent ép mở (forceOpen) thì cho phép hiển thị bất chấp surveySkipped
    return forceOpen ? true : !isCompleted && !isSkipped;
  });

  const [schoolName, setSchoolName] = useState("");
  const [schoolCode, setSchoolCode] = useState("");
  const [startYear, setStartYear] = useState("");
  const [languageOptions, setLanguageOptions] = useState([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);
  const [schoolOpen, setSchoolOpen] = useState(false);
  const [yearOpen, setYearOpen] = useState(false);

  const years = useMemo(
    () => Array.from({ length: 12 }, (_, i) => 2026 - i),
    [],
  );

  const filteredSchools = useMemo(() => {
    const query = schoolName.trim().toLowerCase();
    if (!query) return schoolOptions;

    return schoolOptions.filter((item) =>
      `${item.name} ${item.code}`.toLowerCase().includes(query),
    );
  }, [schoolName, schoolOptions]);

  const filteredYears = useMemo(() => {
    const query = startYear.trim();
    if (!query) return years;

    return years.filter((year) => String(year).includes(query));
  }, [startYear, years]);

  useEffect(() => {
    // 2. Nếu đã hoàn thành survey trước đó rồi thì không gọi API load data
    const isCompleted = localStorage.getItem("surveyCompleted") === "true";
    const isSkipped = localStorage.getItem("surveySkipped") === "true";

    // Nếu đã completed thì đóng, hoặc nếu đã skipped và không được parent ép mở thì đóng
    if (isCompleted || (isSkipped && !forceOpen)) {
      if (onClose) onClose({ completed: isCompleted });
      return;
    }

    let isMounted = true;

    const loadData = async () => {
      try {
        const [languagesResponse, schoolsResponse] = await Promise.all([
          axiosClient.get("/api/languages"),
          axiosClient.get("/api/schools"),
        ]);

        if (isMounted) {
          setLanguageOptions(languagesResponse.data || []);
          setSchoolOptions(schoolsResponse.data || []);
        }
      } catch (error) {
        console.error("Failed to load survey data:", error);
      } finally {
        if (isMounted) {
          setLoadingLanguages(false);
          setLoadingSchools(false);
        }
      }
    };

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const toggleLanguage = (languageId) => {
    if (selectedLanguageIds.includes(languageId)) {
      setSelectedLanguageIds(
        selectedLanguageIds.filter((id) => id !== languageId),
      );
    } else {
      setSelectedLanguageIds([...selectedLanguageIds, languageId]);
    }
  };

  const closeSurvey = () => {
    setOpen(false);
  };

  // Nếu parent thay đổi prop forceOpen (ví dụ khi click nút reminder), đồng bộ lại state
  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  const handleComplete = async (surveyPayload) => {
    try {
      const response = await axiosClient.post("/api/survey", surveyPayload);

      if (response?.data) {
        persistSchool(
          response.data.schoolCode,
          response.data.schoolName,
        );
      }

      localStorage.setItem("surveyCompleted", "true");
      localStorage.removeItem("surveySkipped");

      window.dispatchEvent(
        new CustomEvent("survey:completed", {
          detail: response.data,
        }),
      );

      closeSurvey();

      if (onClose) {
        onClose({
          completed: true,
          surveyData: response.data,
        });
      }
    } catch (error) {
      console.error("Failed to submit survey:", error);
    }
  };

  const handleSubmit = () => {
    const normalizedSchool = schoolName.trim().toLowerCase();
    const matchedSchool = schoolOptions.find((item) => {
      const name = (item.name || "").trim().toLowerCase();
      const code = (item.code || "").trim().toLowerCase();
      return (
        name === normalizedSchool ||
        code === normalizedSchool ||
        name.includes(normalizedSchool) ||
        normalizedSchool.includes(name)
      );
    });

    const resolvedSchool = matchedSchool
      ? matchedSchool.code
      : (schoolCode || schoolName).trim();

    const surveyPayload = {
      schoolCode: resolvedSchool || null,
      schoolName: schoolName.trim() || null,
      startYear: startYear ? Number(startYear) : null,
      languageIds: selectedLanguageIds,
    };

    handleComplete(surveyPayload);
  };

  const handleSkip = () => {
    closeSurvey();
    localStorage.setItem("surveySkipped", "true");
    localStorage.removeItem("surveyCompleted");
    if (onClose) {
      onClose({ completed: false });
    }
  };

  // 3. Nếu state open là false (do đã check localStorage), return null để ẩn hoàn toàn component
  if (!open) return null;

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        if (!nextOpen) {
          handleSkip();
          return;
        }
        setOpen(true);
      }}
    >
      <DialogContent
        showCloseButton={false}
        className="!max-w-[500px] rounded-xl p-0 overflow-hidden bg-white shadow-xl"
      >
        <DialogTitle className="sr-only">Learning Survey</DialogTitle>
        <DialogDescription className="sr-only">
          Please fill out this background survey to help us recommend better
          study materials.
        </DialogDescription>

        <div className="relative">
          <div className="absolute inset-0 bg-white" />
          <Button
            variant="ghost"
            size="icon-sm"
            onClick={handleSkip}
            className="absolute right-4 top-4 z-10 rounded-full"
          >
            <X className="size-4" />
          </Button>

          <Card className="relative border-0 bg-transparent shadow-none">
            <CardHeader className="px-8 pt-9">
              <Badge className="w-fit rounded-full bg-[#f26522]/10 text-[#f26522]">
                Personalized
              </Badge>
              <CardTitle className="mt-4 text-3xl font-semibold text-slate-900">
                Learning Survey
              </CardTitle>
              <CardDescription className="text-sm text-slate-600">
                Tell us a bit about your background so we can recommend better
                materials.
              </CardDescription>
            </CardHeader>

            <CardContent className="px-8 pb-2">
              <div className="grid gap-6">
                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <GraduationCap className="h-4 w-4 text-[#f26522]" />
                    School / University
                  </Label>
                  <div className="relative">
                    <InputGroup className="rounded-xl border-slate-200 bg-white/90">
                      <InputGroupAddon>
                        <Search className="h-4 w-4 text-slate-400" />
                      </InputGroupAddon>
                      <InputGroupInput
                        value={schoolName}
                        placeholder="Search your school"
                        onChange={(event) => {
                          setSchoolName(event.target.value);
                          setSchoolCode("");
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
                          {loadingSchools ? (
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
                                  setSchoolName(item.name);
                                  setSchoolCode(item.code);
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

                <div className="grid gap-2">
                  <Label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                    <Calendar className="h-4 w-4 text-[#f26522]" />
                    Start year
                  </Label>
                  <div className="relative">
                    <InputGroup className="rounded-xl border-slate-200 bg-white/90">
                      <InputGroupAddon>
                        <Search className="h-4 w-4 text-slate-400" />
                      </InputGroupAddon>
                      <InputGroupInput
                        value={startYear}
                        placeholder="Search start year"
                        onChange={(event) => {
                          setStartYear(event.target.value);
                          setYearOpen(true);
                        }}
                        onFocus={() => setYearOpen(true)}
                        onBlur={() => {
                          setTimeout(() => setYearOpen(false), 120);
                        }}
                      />
                    </InputGroup>

                    {yearOpen && (
                      <div className="absolute z-20 mt-2 w-full rounded-xl border border-slate-200 bg-white shadow-md">
                        <ScrollArea className="max-h-40">
                          {filteredYears.length === 0 ? (
                            <div className="p-3 text-xs text-slate-500">
                              No years match your search.
                            </div>
                          ) : (
                            filteredYears.map((year) => (
                              <Button
                                key={year}
                                type="button"
                                variant="ghost"
                                onMouseDown={(event) => {
                                  event.preventDefault();
                                  setStartYear(String(year));
                                  setYearOpen(false);
                                }}
                                className="w-full justify-start rounded-none px-3 py-2 text-xs hover:bg-slate-50"
                              >
                                {year}
                              </Button>
                            ))
                          )}
                        </ScrollArea>
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid gap-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-semibold text-slate-700">
                      Languages you are learning
                    </Label>
                    <span className="text-xs text-slate-500">
                      {selectedLanguageIds.length} selected
                    </span>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {loadingLanguages &&
                      Array.from({ length: 5 }).map((_, index) => (
                        <Skeleton
                          key={`language-skeleton-${index}`}
                          className="h-9 w-24 rounded-full"
                        />
                      ))}

                    {!loadingLanguages && languageOptions.length === 0 && (
                      <p className="text-sm text-slate-500">
                        No languages available yet. You can skip for now.
                      </p>
                    )}

                    {!loadingLanguages &&
                      languageOptions.map((language) => {
                        const isSelected = selectedLanguageIds.includes(
                          language.id,
                        );
                        return (
                          <Button
                            key={language.id}
                            type="button"
                            variant={isSelected ? "default" : "outline"}
                            onClick={() => toggleLanguage(language.id)}
                            className={`rounded-full px-4 text-sm font-semibold transition ${
                              isSelected
                                ? "bg-[#f26522] text-white hover:bg-[#d95316]"
                                : "border-slate-200 text-slate-700 hover:border-slate-400"
                            }`}
                          >
                            {language.name}
                          </Button>
                        );
                      })}
                  </div>
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex justify-center px-8 pb-8 pt-6">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  className="rounded-lg w-[210px] border-slate-200 text-slate-700 cursor-pointer hover:border-slate-400 hover:bg-slate-50"
                >
                  Skip for now
                </Button>

                <Button
                  type="button"
                  onClick={handleSubmit}
                  className="rounded-lg w-[210px] bg-[#f26522] text-white hover:bg-[#d95316] cursor-pointer"
                  disabled={loadingLanguages}
                >
                  Complete survey
                </Button>
              </div>
            </CardFooter>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}
