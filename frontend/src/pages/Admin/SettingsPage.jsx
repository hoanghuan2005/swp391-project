import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";
import CatalogSchoolsPage from "./CatalogSchoolsPage";
import CatalogTagsPage from "./CatalogTagsPage";
import CatalogLanguagesPage from "./CatalogLanguagesPage";

export default function SettingsPage() {
  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center gap-3">
        <BookOpen className="w-8 h-8 text-[#f26522]" />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">
            Catalog Management
          </h1>
          <p className="text-sm text-slate-500">
            Manage schools, tags, and language lists used across the platform.
          </p>
        </div>
      </div>

      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="text-lg text-slate-700">
            Manage resources
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-6">
          <Tabs defaultValue="schools" className="space-y-6">
            <TabsList className="rounded-xl">
              <TabsTrigger value="schools">Schools</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
            </TabsList>

            <TabsContent value="schools" className="space-y-4">
              <CatalogSchoolsPage hideHeader={true} />
            </TabsContent>

            <TabsContent value="tags" className="space-y-4">
              <CatalogTagsPage hideHeader={true} />
            </TabsContent>

            <TabsContent value="languages" className="space-y-4">
              <CatalogLanguagesPage hideHeader={true} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
