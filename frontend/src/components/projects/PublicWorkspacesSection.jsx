import React, { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { getPublicProjects } from "@/api/projectApi";
import { Card, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FolderKanban, Globe, FileText, Users, ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";

export default function PublicWorkspacesSection({ searchQuery = "" }) {
  const navigate = useNavigate();
  const [workspaces, setWorkspaces] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const fetchPublicWorkspaces = useCallback(async () => {
    try {
      setIsLoading(true);
      const data = await getPublicProjects({
        search: searchQuery,
        page: page,
        size: 6,
      });
      if (data && data.content) {
        setWorkspaces(data.content || []);
        setTotalPages(data.totalPages || 1);
      } else if (Array.isArray(data)) {
        setWorkspaces(data);
        setTotalPages(1);
      }
    } catch (error) {
      console.error("Failed to load public workspaces:", error);
      setWorkspaces([]);
    } finally {
      setIsLoading(false);
    }
  }, [searchQuery, page]);

  useEffect(() => {
    fetchPublicWorkspaces();
  }, [fetchPublicWorkspaces]);

  const handleOpenWorkspace = (ws) => {
    if (ws.id) {
      navigate(`/workspace/${ws.id}`);
    } else if (ws.shareToken) {
      navigate(`/workspace/shared/${ws.shareToken}`);
    }
  };

  return (
    <section className="mb-12">
      {/* Section Header - Synchronized with Homepage style */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <div className="flex items-center gap-2">
            <FolderKanban className="w-6 h-6 text-[#f26522]" />
            <h3 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
              Public Workspaces
              <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-[#f26522]/10 text-[#f26522] border border-[#f26522]/20">
                <Globe className="w-3 h-3" /> Community
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-500 mt-1.5 pl-8">
            Explore study spaces curated and shared by the community
          </p>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              disabled={page === 0 || isLoading}
              onClick={() => setPage((prev) => Math.max(0, prev - 1))}
              className="h-8 w-8 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="text-xs text-slate-500 font-medium px-1">
              {page + 1} / {totalPages}
            </span>
            <Button
              variant="outline"
              size="icon"
              disabled={page >= totalPages - 1 || isLoading}
              onClick={() => setPage((prev) => prev + 1)}
              className="h-8 w-8 rounded-xl border-slate-200 text-slate-600 hover:bg-slate-50 cursor-pointer disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        )}
      </div>

      {/* Grid Content */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="h-48 rounded-2xl bg-slate-100 dark:bg-slate-800 animate-pulse border border-slate-200 dark:border-slate-700"
            />
          ))}
        </div>
      ) : workspaces.length === 0 ? (
        <div className="text-center py-10 px-4 rounded-2xl bg-slate-50/50 dark:bg-slate-800/40 border border-dashed border-slate-200 dark:border-slate-700">
          <FolderKanban className="w-10 h-10 text-slate-400 mx-auto mb-3 opacity-60" />
          <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
            {searchQuery ? `No public workspaces matching "${searchQuery}"` : "No public workspaces available"}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-md mx-auto">
            Be the first to create a workspace and set its visibility to Public to share with the community!
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {workspaces.map((ws) => {
            const docCount = ws.documents?.length || 0;
            const memberCount = ws.members?.length || 1;
            const ownerName = ws.members?.find((m) => m.role === "OWNER")?.username || "Member";

            return (
              <Card
                key={ws.id}
                className="group relative flex flex-col justify-between overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 bg-white dark:bg-slate-900 border-slate-200/80 dark:border-slate-800 rounded-2xl"
              >
                <div className="p-5">
                  {/* Top Badge & Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-lg bg-[#f26522]/10 text-[#f26522] border border-[#f26522]/20">
                      <FolderKanban className="w-3.5 h-3.5" /> Workspace
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400">
                      <Globe className="w-3 h-3 text-emerald-500" /> Public
                    </span>
                  </div>

                  {/* Title & Description */}
                  <h3 className="text-base font-bold text-slate-800 dark:text-white line-clamp-1 group-hover:text-[#f26522] transition-colors">
                    {ws.name}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 line-clamp-2 mt-1.5 min-h-[32px]">
                    {ws.description || "No description provided for this workspace."}
                  </p>
                </div>

                {/* Footer Metadata & CTA */}
                <CardFooter className="p-5 pt-0 flex flex-col gap-3">
                  <div className="flex items-center justify-between w-full text-xs text-slate-500 dark:text-slate-400 pt-3 border-t border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <span className="flex items-center gap-1 font-medium">
                        <FileText className="w-3.5 h-3.5 text-[#f26522]" /> {docCount} {docCount === 1 ? 'document' : 'documents'}
                      </span>
                      <span className="flex items-center gap-1 font-medium">
                        <Users className="w-3.5 h-3.5 text-purple-500" /> {memberCount} {memberCount === 1 ? 'member' : 'members'}
                      </span>
                    </div>
                    <span className="truncate max-w-[110px] font-medium text-slate-600 dark:text-slate-300">
                      by {ownerName}
                    </span>
                  </div>

                  <Button
                    onClick={() => handleOpenWorkspace(ws)}
                    className="w-full justify-between bg-slate-50 hover:bg-[#f26522] text-slate-700 hover:text-white dark:bg-slate-800 dark:hover:bg-[#f26522] dark:text-slate-200 transition-all duration-200 rounded-xl group/btn font-medium text-xs h-9 cursor-pointer"
                  >
                    <span>Explore Workspace</span>
                    <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover/btn:translate-x-1" />
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </section>
  );
}
