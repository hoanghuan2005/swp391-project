import React from "react";
import BaseCrud from "@/components/admin/BaseCrud";
import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

export default function CatalogSchoolsPage({ hideHeader }) {
  const columns = [
    {
      header: "School",
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
    { name: "name", label: "School name", placeholder: "FPT University" },
    { name: "code", label: "School code", placeholder: "FPT", uppercase: true },
    { name: "description", label: "Description", placeholder: "Ho Chi Minh City, Vietnam" },
  ];

  const searchFilter = (item, keyword) => 
    `${item.name} ${item.code}`.toLowerCase().includes(keyword);

  return (
    <BaseCrud
      title="Schools Catalog"
      description="Manage universities displayed across survey and uploads."
      icon={GraduationCap}
      entityName="School"
      apiUrl="/api/schools"
      columns={columns}
      formFields={formFields}
      initialFormState={{ name: "", code: "", description: "" }}
      searchFilter={searchFilter}
      hideHeader={hideHeader}
    />
  );
}
