import React, { useEffect, useMemo, useState } from "react";
import { X } from "lucide-react";
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
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";

export default function Survey({ onClose }) {
  const [open, setOpen] = useState(true);
  const [school, setSchool] = useState("");
  const [startYear, setStartYear] = useState("");
  const [languageOptions, setLanguageOptions] = useState([]);
  const [selectedLanguageIds, setSelectedLanguageIds] = useState([]);
  const [loadingLanguages, setLoadingLanguages] = useState(true);
  const [schoolOptions, setSchoolOptions] = useState([]);
  const [loadingSchools, setLoadingSchools] = useState(true);

  const years = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date().getFullYear() - i),
    [],
  );

  useEffect(() => {
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

  const handleComplete = async (payload) => {
    closeSurvey();
    localStorage.setItem("surveyCompleted", "true");
    localStorage.removeItem("surveySkipped");
    if (onClose) {
      onClose({ completed: true });
    }

    try {
      await axiosClient.post("/api/survey", payload);
    } catch (error) {
      console.error("Failed to submit survey:", error);
    }
  };

  const handleSubmit = () => {
    const payload = {
      schoolName: school.trim() || null,
      startYear: startYear ? Number(startYear) : null,
      languageIds: selectedLanguageIds,
    };
    handleComplete(payload);
  };

  const handleSkip = () => {
    closeSurvey();
    localStorage.setItem("surveySkipped", "true");
    localStorage.removeItem("surveyCompleted");
    if (onClose) {
      onClose({ completed: false });
    }
  };

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
                  <Label className="text-sm font-semibold text-slate-700">
                    School / University
                  </Label>
                  <Select value={school} onValueChange={setSchool}>
                    <SelectTrigger className="w-full rounded-xl border-slate-200">
                      <SelectValue placeholder="Select school" />
                    </SelectTrigger>

                    <SelectContent>
                      {loadingSchools ? (
                        <div className="p-2 text-sm text-slate-500">
                          Loading schools...
                        </div>
                      ) : (
                        schoolOptions.map((school) => (
                          <SelectItem key={school.id} value={school.name}>
                            {school.name}
                          </SelectItem>
                        ))
                      )}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label className="text-sm font-semibold text-slate-700">
                    Start year
                  </Label>
                  <Select value={startYear} onValueChange={setStartYear}>
                    <SelectTrigger className="w-full rounded-xl border-slate-200">
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
