import React from "react";
import BaseCrud from "@/components/admin/BaseCrud";
import { Badge } from "@/components/ui/badge";
import { Tags } from "lucide-react";

export default function CatalogTagsPage({ hideHeader }) {
  const columns = [
    {
      header: "Tag",
      render: (item) => (
        <Badge variant="outline" className="border-slate-200 text-slate-600">
          {item.name}
        </Badge>
      ),
    },
  ];

  const formFields = [
    { name: "name", label: "Tag name", placeholder: "Final Exam" },
  ];

  const searchFilter = (item, keyword) => 
    item.name?.toLowerCase().includes(keyword);

  return (
    <BaseCrud
      title="Tags Catalog"
      description="Maintain the document tags available across the platform."
      icon={Tags}
      entityName="Tag"
      apiUrl="/api/tags"
      columns={columns}
      formFields={formFields}
      initialFormState={{ name: "" }}
      searchFilter={searchFilter}
      hideHeader={hideHeader}
    />
  );
}
