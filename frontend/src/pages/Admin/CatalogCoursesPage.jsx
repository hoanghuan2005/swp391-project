import React from "react";
import BaseCrud from "@/components/admin/BaseCrud";
import { Badge } from "@/components/ui/badge";
import { BookOpen } from "lucide-react";

export default function CatalogCoursesPage() {
  const columns = [
    {
      header: "Course Name",
      className: "w-[35%]",
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
      header: "Description",
      cellClassName: "text-slate-500 text-sm",
      render: (item) => item.description || "-",
    },
  ];

  const formFields = [
    { name: "name", label: "Course name", placeholder: "Software Architecture" },
    { name: "code", label: "Course code", placeholder: "SWP391", uppercase: true },
    { name: "description", label: "Description", placeholder: "Brief course overview" },
  ];

  const searchFilter = (item, keyword) => 
    `${item.name} ${item.code}`.toLowerCase().includes(keyword);

  return (
    <BaseCrud
      title="Courses Catalog"
      description="Manage academic subjects displayed across system."
      icon={BookOpen}
      entityName="Course"
      apiUrl="/api/courses"
      fetchUrl="/api/courses/all"
      columns={columns}
      formFields={formFields}
      initialFormState={{ name: "", code: "", description: "" }}
      searchFilter={searchFilter}
    />
  );
}
