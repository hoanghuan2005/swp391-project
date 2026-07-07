import React, { useEffect, useState } from "react";
import BaseCrud from "@/components/admin/BaseCrud";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";
import axiosClient from "@/api/axiosClient";

export default function CatalogCoursesPage() {
  const [schools, setSchools] = useState([]);
  const [majors, setMajors] = useState([]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await axiosClient.get("/api/schools");
        setSchools(response.data || []);
      } catch (error) {
        console.error("Failed to fetch schools for course catalog", error);
      }
    };
    fetchSchools();
  }, []);

  const fetchMajorsForSchool = async (schoolId) => {
    if (!schoolId) {
      setMajors([]);
      return;
    }
    try {
      const response = await axiosClient.get(`/api/majors?schoolId=${schoolId}`);
      setMajors(response.data || []);
    } catch (error) {
      console.error("Failed to fetch majors for school", schoolId, error);
    }
  };

  const handleFieldChange = async (fieldName, val, updatedForm, setForm) => {
    if (fieldName === "schoolId") {
      // Clear majorId in form when school changes
      setForm((prev) => ({ ...prev, majorId: "" }));
      await fetchMajorsForSchool(val);
    } else if (fieldName === "__init__") {
      const schoolId = updatedForm?.schoolId;
      await fetchMajorsForSchool(schoolId);
    }
  };

  const columns = [
    {
      header: "Course Name",
      className: "w-[25%]",
      cellClassName: "font-semibold text-slate-700",
      render: (item) => item.name,
    },
    {
      header: "Code",
      className: "w-[15%]",
      render: (item) => (
        <Badge variant="outline" className="border-slate-200 text-slate-500">
          {item.code}
        </Badge>
      ),
    },
    {
      header: "School",
      className: "w-[20%]",
      cellClassName: "text-slate-600 text-sm",
      render: (item) => item.major?.school?.code || "-",
    },
    {
      header: "Major",
      className: "w-[20%]",
      cellClassName: "text-slate-600 text-sm font-medium",
      render: (item) => item.major?.code || "-",
    },
    {
      header: "Description",
      cellClassName: "text-slate-500 text-sm",
      render: (item) => item.description || "-",
    },
  ];

  const schoolOptions = schools.map((school) => ({
    value: school.id,
    label: `${school.code} - ${school.name}`,
  }));

  const majorOptions = majors.map((major) => ({
    value: major.id,
    label: `${major.code} - ${major.name}`,
  }));

  const formFields = [
    {
      name: "schoolId",
      label: "School",
      type: "select",
      options: schoolOptions,
    },
    {
      name: "majorId",
      label: "Major",
      type: "select",
      options: majorOptions,
    },
    { name: "name", label: "Course name", placeholder: "Software Architecture" },
    { name: "code", label: "Course code", placeholder: "SWP391", uppercase: true },
    { name: "description", label: "Description", placeholder: "Brief course overview", type: "textarea" },
  ];

  const searchFilter = (item, keyword) => {
    const sName = item.name || "";
    const sCode = item.code || "";
    const sDesc = item.description || "";
    const sMajorName = item.major?.name || "";
    const sMajorCode = item.major?.code || "";
    const sSchoolName = item.major?.school?.name || "";
    const sSchoolCode = item.major?.school?.code || "";
    
    return `${sName} ${sCode} ${sDesc} ${sMajorName} ${sMajorCode} ${sSchoolName} ${sSchoolCode}`
      .toLowerCase()
      .includes(keyword);
  };

  return (
    <BaseCrud
      title="Courses Management"
      description="Manage academic subjects displayed across system."
      icon={BookOpen}
      entityName="Course"
      apiUrl="/api/courses"
      fetchUrl="/api/courses/all"
      columns={columns}
      formFields={formFields}
      initialFormState={{ name: "", code: "", description: "", schoolId: "", majorId: "" }}
      searchFilter={searchFilter}
      onFieldChange={handleFieldChange}
      importUrl="/api/admin/catalog/courses/import"
      importMapping={{
        majorId: "Major ID",
        code: "Course Code",
        name: "Course Name",
        description: "Description"
      }}
      importRequiredFields={["majorId", "code", "name"]}
    />
  );
}
