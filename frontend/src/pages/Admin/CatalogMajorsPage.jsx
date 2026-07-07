import React, { useEffect, useState } from "react";
import BaseCrud from "@/components/admin/BaseCrud";
import { Badge } from "@/components/ui/badge";
import { Layers } from "lucide-react";
import axiosClient from "@/api/axiosClient";

export default function CatalogMajorsPage({ hideHeader }) {
  const [schoolOptions, setSchoolOptions] = useState([]);

  useEffect(() => {
    const fetchSchools = async () => {
      try {
        const response = await axiosClient.get("/api/schools");
        const options = (response.data || []).map((school) => ({
          value: school.id,
          label: `${school.code} - ${school.name}`,
        }));
        setSchoolOptions(options);
      } catch (error) {
        console.error("Failed to fetch schools for majors", error);
      }
    };
    fetchSchools();
  }, []);

  const columns = [
    {
      header: "Major Name",
      className: "w-[30%]",
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
      className: "w-[25%]",
      cellClassName: "text-slate-600 font-medium",
      render: (item) => item.schoolName || "-",
    },
    {
      header: "Description",
      cellClassName: "text-slate-500 text-sm",
      render: (item) => item.description || "-",
    },
  ];

  const formFields = [
    { name: "name", label: "Major name", placeholder: "Software Engineering" },
    { name: "code", label: "Major code", placeholder: "SE", uppercase: true },
    { name: "description", label: "Description", placeholder: "Brief major overview" },
    {
      name: "schoolId",
      label: "School",
      type: "select",
      options: schoolOptions,
    },
  ];

  const searchFilter = (item, keyword) =>
    `${item.name} ${item.code} ${item.schoolName || ""}`.toLowerCase().includes(keyword);

  return (
    <BaseCrud
      title="Majors Management"
      description="Manage educational majors mapped inside universities."
      icon={Layers}
      entityName="Major"
      apiUrl="/api/majors"
      columns={columns}
      formFields={formFields}
      initialFormState={{ name: "", code: "", description: "", schoolId: "" }}
      searchFilter={searchFilter}
      hideHeader={hideHeader}
      importUrl="/api/admin/catalog/majors/import"
      importMapping={{
        schoolId: "School ID",
        code: "Code",
        name: "Major Name",
        description: "Description"
      }}
      importRequiredFields={["schoolId", "code", "name"]}
    />
  );
}
