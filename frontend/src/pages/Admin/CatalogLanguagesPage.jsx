import React from "react";
import BaseCrud from "@/components/admin/BaseCrud";
import { Badge } from "@/components/ui/badge";
import { Globe } from "lucide-react";

export default function CatalogLanguagesPage({ hideHeader }) {
  const columns = [
    {
      header: "Language",
      cellClassName: "font-semibold text-slate-700",
      render: (item) => item.name,
    },
    {
      header: "Code",
      render: (item) => (
        <Badge variant="outline" className="border-slate-200 text-slate-500">
          {item.code}
        </Badge>
      ),
    },
  ];

  const formFields = [
    { name: "name", label: "Language name", placeholder: "English" },
    { name: "code", label: "Language code", placeholder: "EN", uppercase: true },
  ];

  const searchFilter = (item, keyword) => 
    `${item.name} ${item.code}`.toLowerCase().includes(keyword);

  return (
    <BaseCrud
      title="Languages Catalog"
      description="Keep survey language options up to date."
      icon={Globe}
      entityName="Language"
      apiUrl="/api/languages"
      columns={columns}
      formFields={formFields}
      initialFormState={{ name: "", code: "" }}
      searchFilter={searchFilter}
      hideHeader={hideHeader}
    />
  );
}
