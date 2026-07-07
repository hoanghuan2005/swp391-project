import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen } from "lucide-react";
import CatalogSchoolsPage from "./CatalogSchoolsPage";
import CatalogMajorsPage from "./CatalogMajorsPage";
import CatalogTagsPage from "./CatalogTagsPage";
import CatalogLanguagesPage from "./CatalogLanguagesPage";

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f26522]">
              <BookOpen className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Resource Management
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
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
              <TabsTrigger value="majors">Majors</TabsTrigger>
              <TabsTrigger value="tags">Tags</TabsTrigger>
              <TabsTrigger value="languages">Languages</TabsTrigger>
            </TabsList>

            <TabsContent value="schools" className="space-y-4">
              <CatalogSchoolsPage hideHeader={true} />
            </TabsContent>

            <TabsContent value="majors" className="space-y-4">
              <CatalogMajorsPage hideHeader={true} />
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
