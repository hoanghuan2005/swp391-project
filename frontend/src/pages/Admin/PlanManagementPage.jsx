import React, { useEffect, useState, useCallback } from "react";
import axiosClient from "@/api/axiosClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Layers, Plus, Edit2, HardDrive, FileUp, Sparkles, RefreshCw, Trash2 } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";

function bytesToMB(bytes) {
  if (bytes === null || bytes === undefined || bytes === -1) return "Unlimited";
  return Math.round(bytes / (1024 * 1024)) + " MB";
}

function formatVND(amount) {
  if (!amount || amount === 0) return "0 đ";
  return new Intl.NumberFormat("vi-VN").format(amount) + " đ";
}

export default function PlanManagementPage() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);

  // Delete modal state
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingPlan, setDeletingPlan] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const [formData, setFormData] = useState({
    code: "",
    name: "",
    priceVnd: 0,
    maxFileMb: 10,
    totalStorageMb: 100,
    dailyUploadLimit: 3,
    totalDocumentLimit: 20,
    dailyAiLimit: 5,
    maxFlashcardsPerGen: 15,
    maxQuizQuestionsPerGen: 20,
    maxOwnedProjects: 3,
    maxJoinedProjects: 5,
    maxSelectedDocs: 2,
    maxWorkspaceDocs: 10,
    isActive: true,
  });

  const fetchPlans = useCallback(async () => {
    try {
      const res = await axiosClient.get("/api/admin/subscription-plans");
      const sorted = (res.data || []).sort((a, b) => (a.priceVnd || 0) - (b.priceVnd || 0));
      setPlans(sorted);
    } catch (err) {
      console.error("Failed to load plans:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;
    axiosClient.get("/api/admin/subscription-plans")
      .then((res) => {
        if (isMounted) {
          const sorted = (res.data || []).sort((a, b) => (a.priceVnd || 0) - (b.priceVnd || 0));
          setPlans(sorted);
        }
      })
      .catch((err) => {
        console.error("Failed to load plans:", err);
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleOpenModal = (plan = null) => {
    if (plan) {
      const activeState = plan.isActive !== undefined ? plan.isActive : (plan.active !== undefined ? plan.active : true);
      setEditingPlan(plan);
      setFormData({
        code: plan.code || "",
        name: plan.name || "",
        priceVnd: plan.priceVnd || 0,
        maxFileMb: plan.maxFileSizeBytes ? Math.round(plan.maxFileSizeBytes / (1024 * 1024)) : 10,
        totalStorageMb: plan.totalStorageBytes ? Math.round(plan.totalStorageBytes / (1024 * 1024)) : 100,
        dailyUploadLimit: plan.dailyUploadLimit ?? 3,
        totalDocumentLimit: plan.totalDocumentLimit ?? 20,
        dailyAiLimit: plan.dailyAiLimit ?? 5,
        maxFlashcardsPerGen: plan.maxFlashcardsPerGeneration ?? 15,
        maxQuizQuestionsPerGen: plan.maxQuizQuestionsPerGeneration ?? 20,
        maxOwnedProjects: plan.maxOwnedProjects ?? 3,
        maxJoinedProjects: plan.maxJoinedProjects ?? 5,
        maxSelectedDocs: plan.maxSelectedDocs ?? 2,
        maxWorkspaceDocs: plan.maxWorkspaceDocs ?? 10,
        maxAiContextChunks: plan.maxAiContextChunks ?? 4,
        maxChunkChars: plan.maxChunkChars ?? 400,
        isActive: activeState,
      });
    } else {
      setEditingPlan(null);
      setFormData({
        code: "",
        name: "",
        priceVnd: 0,
        maxFileMb: 10,
        totalStorageMb: 100,
        dailyUploadLimit: 3,
        totalDocumentLimit: 20,
        dailyAiLimit: 5,
        maxFlashcardsPerGen: 15,
        maxQuizQuestionsPerGen: 20,
        maxOwnedProjects: 3,
        maxJoinedProjects: 5,
        maxSelectedDocs: 2,
        maxWorkspaceDocs: 10,
        maxAiContextChunks: 4,
        maxChunkChars: 400,
        isActive: true,
      });
    }
    setModalOpen(true);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        code: formData.code,
        name: formData.name,
        priceVnd: Number(formData.priceVnd),
        maxFileSizeBytes: Number(formData.maxFileMb) * 1024 * 1024,
        totalStorageBytes: Number(formData.totalStorageMb) * 1024 * 1024,
        dailyUploadLimit: Number(formData.dailyUploadLimit),
        totalDocumentLimit: Number(formData.totalDocumentLimit),
        dailyAiLimit: Number(formData.dailyAiLimit),
        maxFlashcardsPerGeneration: Number(formData.maxFlashcardsPerGen),
        maxQuizQuestionsPerGeneration: Number(formData.maxQuizQuestionsPerGen),
        maxOwnedProjects: Number(formData.maxOwnedProjects),
        maxJoinedProjects: Number(formData.maxJoinedProjects),
        maxSelectedDocs: parseInt(formData.maxSelectedDocs),
        maxWorkspaceDocs: parseInt(formData.maxWorkspaceDocs),
        maxAiContextChunks: parseInt(formData.maxAiContextChunks),
        maxChunkChars: parseInt(formData.maxChunkChars),
        isActive: formData.isActive,
      };

      if (editingPlan) {
        await axiosClient.put(`/api/admin/subscription-plans/${editingPlan.id}`, payload);
      } else {
        await axiosClient.post("/api/admin/subscription-plans", payload);
      }

      setModalOpen(false);
      toast.success(editingPlan ? "Subscription plan updated successfully!" : "New subscription plan created!");
      fetchPlans();
    } catch (err) {
      console.error("Failed to save plan:", err);
      toast.error("Error saving subscription plan: " + (err.response?.data?.message || err.message));
    }
  };

  const handleToggleStatus = async (id) => {
    try {
      await axiosClient.patch(`/api/admin/subscription-plans/${id}/toggle`);
      toast.success("Plan status updated!");
      fetchPlans();
    } catch (err) {
      console.error("Failed to toggle plan status:", err);
      toast.error("Failed to update plan status.");
    }
  };

  const handleOpenDeleteDialog = (plan) => {
    setDeletingPlan(plan);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingPlan) return;
    try {
      setDeleteLoading(true);
      await axiosClient.delete(`/api/admin/subscription-plans/${deletingPlan.id}`);
      toast.success("Subscription plan deleted successfully!");
      setDeleteDialogOpen(false);
      setDeletingPlan(null);
      fetchPlans();
    } catch (err) {
      console.error("Failed to delete plan:", err);
      toast.error("Error deleting plan: " + (err.response?.data?.message || err.message));
    } finally {
      setDeleteLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-orange-50 text-[#f26522]">
              <Layers className="h-5 w-5" aria-hidden="true" />
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              Subscription Plans Management
            </h1>
          </div>
          <p className="mt-2 text-sm font-medium text-slate-500">
            Configure storage capacity, AI limits, file sizes, and workspace quotas for each plan.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={fetchPlans}
            className="rounded-xl border-slate-200 hover:bg-slate-50 cursor-pointer font-bold"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </Button>
          <Button
            onClick={() => handleOpenModal()}
            className="rounded-xl bg-[#f26522] hover:bg-[#d95316] text-white font-bold cursor-pointer shadow-md shadow-orange-500/20"
          >
            <Plus className="w-4 h-4 mr-2" /> Add New Plan
          </Button>
        </div>
      </div>

      {/* Plan Cards Directory Container */}
      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardContent className="p-6 space-y-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between w-full pb-2 border-b border-slate-100">
            <h4 className="text-lg font-bold text-slate-700 whitespace-nowrap">Subscription plans directory</h4>
          </div>

          {loading ? (
            <div className="text-center py-12 text-slate-500 font-medium">Loading subscription plans...</div>
          ) : plans.length === 0 ? (
            <div className="text-center py-12 text-slate-500 font-medium">No subscription plans found. Click Add New Plan to create one!</div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
              {plans.map((plan) => {
                const active = plan.isActive !== undefined ? plan.isActive : (plan.active !== undefined ? plan.active : true);
                const isPro = plan.code === "PRO";
                const isCorePlan = plan.code === "FREE" || plan.code === "PRO";

                return (
                  <div
                    key={plan.id}
                    className={`relative flex flex-col justify-between rounded-3xl p-6 bg-white border transition-all duration-300 ${
                      isPro ? "border-orange-300 shadow-lg shadow-orange-500/5" : "border-slate-200/80 shadow-sm"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-4">
                        <Badge variant="outline" className={`font-black text-xs px-3 py-1 rounded-full ${isPro ? "bg-orange-50 text-[#f26522] border-orange-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                          {plan.code}
                        </Badge>
                        <div className="flex items-center gap-2">
                          <span className={`text-xs font-bold ${active ? "text-emerald-600" : "text-slate-400"}`}>
                            {active ? "Active" : "Inactive"}
                          </span>
                          <Switch
                            checked={active}
                            onCheckedChange={() => handleToggleStatus(plan.id)}
                            className="data-[state=checked]:bg-[#f26522] cursor-pointer"
                          />
                        </div>
                      </div>

                      <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                        {plan.name} {isPro && <Sparkles className="w-4 h-4 text-amber-500 fill-amber-500" />}
                      </h3>
                      <div className="mt-2 text-2xl font-black text-[#f26522]">
                        {formatVND(plan.priceVnd)} <span className="text-xs font-normal text-slate-400">/ month</span>
                      </div>

                      <div className="my-6 space-y-2.5 pt-4 border-t border-slate-100">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <FileUp className="w-4 h-4 text-slate-400" /> Max File Size:
                          </span>
                          <span className="font-bold text-slate-700">{bytesToMB(plan.maxFileSizeBytes)}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium flex items-center gap-1.5">
                            <HardDrive className="w-4 h-4 text-slate-400" /> Total Storage:
                          </span>
                          <span className="font-bold text-slate-700">{bytesToMB(plan.totalStorageBytes)}</span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Daily Uploads:</span>
                          <span className="font-bold text-slate-700">
                            {plan.dailyUploadLimit === -1 ? "Unlimited" : `${plan.dailyUploadLimit} uploads`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Daily AI Requests:</span>
                          <span className="font-bold text-slate-700">
                            {plan.dailyAiLimit === -1 ? "Unlimited" : `${plan.dailyAiLimit ?? 5} requests`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Flashcards / Gen:</span>
                          <span className="font-bold text-slate-700">
                            {plan.maxFlashcardsPerGeneration === -1 ? "Unlimited" : `${plan.maxFlashcardsPerGeneration ?? 15} cards`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Quiz Questions / Gen:</span>
                          <span className="font-bold text-slate-700">
                            {plan.maxQuizQuestionsPerGeneration === -1 ? "Unlimited" : `${plan.maxQuizQuestionsPerGeneration ?? 20} questions`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Owned Workspaces:</span>
                          <span className="font-bold text-slate-700">
                            {plan.maxOwnedProjects === -1 ? "Unlimited" : `${plan.maxOwnedProjects ?? 3} workspaces`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">AI Memory & Context:</span>
                          <span className="font-bold text-slate-700">
                            {plan.maxAiContextChunks > 4 ? "Extended" : "Standard"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Document Analysis Depth:</span>
                          <span className="font-bold text-slate-700">
                            {plan.maxChunkChars >= 600 ? "Deep Analysis" : "Basic Analysis"}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Max Selected Docs / Query:</span>
                          <span className="font-bold text-slate-700">
                            {plan.maxSelectedDocs === -1 ? "Unlimited" : `${plan.maxSelectedDocs ?? 2} docs`}
                          </span>
                        </div>

                        <div className="flex items-center justify-between text-xs">
                          <span className="text-slate-500 font-medium">Max Workspace Docs:</span>
                          <span className="font-bold text-slate-700">
                            {plan.maxWorkspaceDocs ?? 10} docs
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-4">
                      <Button
                        onClick={() => handleOpenModal(plan)}
                        variant="outline"
                        className="flex-1 rounded-xl border-slate-200 hover:bg-slate-50 font-bold text-xs cursor-pointer"
                      >
                        <Edit2 className="w-3.5 h-3.5 mr-2 text-slate-500" /> Configure Plan Limits
                      </Button>
                      <Button
                        onClick={() => handleOpenDeleteDialog(plan)}
                        title="Delete Plan"
                        variant="outline"
                        className="rounded-xl px-3 border-slate-200 font-bold text-xs cursor-pointer hover:bg-rose-50 hover:text-rose-600 hover:border-rose-200 text-slate-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Modal */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-3xl p-6 bg-white">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold text-slate-800">
              Confirm Delete Plan
            </DialogTitle>
            <DialogDescription className="text-slate-500 text-sm mt-1">
              Are you sure you want to delete <strong className="text-slate-800">{deletingPlan?.name} ({deletingPlan?.code})</strong>? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="pt-4 gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setDeleteDialogOpen(false)}
              className="rounded-xl font-bold"
            >
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleConfirmDelete}
              disabled={deleteLoading}
              className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold"
            >
              {deleteLoading ? "Deleting..." : "Delete Plan"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit / Create Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-3xl rounded-2xl p-0 bg-white max-h-[90vh] flex flex-col overflow-hidden shadow-xl border-none">
          <DialogHeader className="px-5 py-3.5 border-b border-slate-100 flex-shrink-0 bg-slate-50/50">
            <DialogTitle className="text-lg font-extrabold text-slate-800 flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#f26522]" />
              {editingPlan ? `Configure ${editingPlan.code} Plan` : "Create New Subscription Plan"}
            </DialogTitle>
            <DialogDescription className="text-[11px] text-slate-400 mt-0.5">
              Configure pricing, limits, AI requests, and storage quotas for this plan.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden min-h-0">
            <div className="p-5 space-y-3.5 overflow-y-auto flex-1 max-h-[72vh] [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
              {/* Section 1: Basic Information */}
              <div className="space-y-1.5">
                <h4 className="text-[11px] font-black uppercase text-[#f26522] tracking-wider">General Information</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Plan Code</label>
                    <Input
                      disabled={!!editingPlan}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="FREE, PRO..."
                      className="h-8.5 rounded-lg uppercase font-bold text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Plan Name</label>
                    <Input
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Pro Plan..."
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Price (VND)</label>
                    <Input
                      type="number"
                      value={formData.priceVnd}
                      onChange={(e) => setFormData({ ...formData, priceVnd: e.target.value })}
                      placeholder="0"
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 2: Storage & File Quotas */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-black uppercase text-[#f26522] tracking-wider">Storage & Upload Limits</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Max File Size (MB)</label>
                    <Input
                      type="number"
                      value={formData.maxFileMb}
                      onChange={(e) => setFormData({ ...formData, maxFileMb: e.target.value })}
                      placeholder="10"
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Total Storage (MB)</label>
                    <Input
                      type="number"
                      value={formData.totalStorageMb}
                      onChange={(e) => setFormData({ ...formData, totalStorageMb: e.target.value })}
                      placeholder="100"
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Daily Uploads (-1 = Unlimited)</label>
                    <Input
                      type="number"
                      value={formData.dailyUploadLimit}
                      onChange={(e) => setFormData({ ...formData, dailyUploadLimit: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 3: AI Quotas */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-black uppercase text-[#f26522] tracking-wider">AI Generation Quotas</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Daily AI Requests (-1 = Unlimited)</label>
                    <Input
                      type="number"
                      value={formData.dailyAiLimit}
                      onChange={(e) => setFormData({ ...formData, dailyAiLimit: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Flashcards / Gen (-1 = Unlimited)</label>
                    <Input
                      type="number"
                      value={formData.maxFlashcardsPerGen}
                      onChange={(e) => setFormData({ ...formData, maxFlashcardsPerGen: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Quiz Questions / Gen (-1 = Unlimited)</label>
                    <Input
                      type="number"
                      value={formData.maxQuizQuestionsPerGen}
                      onChange={(e) => setFormData({ ...formData, maxQuizQuestionsPerGen: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 4: Workspaces & AI Context */}
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <h4 className="text-[11px] font-black uppercase text-[#f26522] tracking-wider">Workspaces & AI Context Depth</h4>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Owned Workspaces (-1 = Unlimited)</label>
                    <Input
                      type="number"
                      value={formData.maxOwnedProjects}
                      onChange={(e) => setFormData({ ...formData, maxOwnedProjects: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Joined Workspaces (-1 = Unlimited)</label>
                    <Input
                      type="number"
                      value={formData.maxJoinedProjects}
                      onChange={(e) => setFormData({ ...formData, maxJoinedProjects: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Max Workspace Docs</label>
                    <Input
                      type="number"
                      value={formData.maxWorkspaceDocs}
                      onChange={(e) => setFormData({ ...formData, maxWorkspaceDocs: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Max Selected Docs / Query</label>
                    <Input
                      type="number"
                      value={formData.maxSelectedDocs}
                      onChange={(e) => setFormData({ ...formData, maxSelectedDocs: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Max AI Context Chunks</label>
                    <Input
                      type="number"
                      value={formData.maxAiContextChunks}
                      onChange={(e) => setFormData({ ...formData, maxAiContextChunks: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex flex-col justify-end">
                    <label className="min-h-[22px] flex items-end pb-0.5 text-[11px] font-bold text-slate-700 leading-tight">Max Chunk Chars</label>
                    <Input
                      type="number"
                      value={formData.maxChunkChars}
                      onChange={(e) => setFormData({ ...formData, maxChunkChars: e.target.value })}
                      className="h-8.5 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Section 5: Activation Switch */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                <div>
                  <span className="text-xs font-bold text-slate-800 block">Activate Plan</span>
                  <span className="text-[10px] text-slate-400">Make this plan active and visible to users</span>
                </div>
                <Switch
                  checked={formData.isActive}
                  onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                  className="data-[state=checked]:bg-[#f26522] cursor-pointer scale-90"
                />
              </div>
            </div>

            <DialogFooter className="p-3 px-5 bg-slate-50 border-t border-slate-100 flex items-center justify-end gap-2 flex-shrink-0">
              <Button type="button" variant="outline" onClick={() => setModalOpen(false)} className="h-8.5 text-xs rounded-lg font-bold border-slate-200 cursor-pointer">
                Cancel
              </Button>
              <Button type="submit" className="h-8.5 text-xs rounded-lg bg-[#f26522] hover:bg-[#d95316] text-white font-bold cursor-pointer px-5">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
