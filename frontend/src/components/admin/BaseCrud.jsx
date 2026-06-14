import React, { useEffect, useMemo, useState } from "react";
import axiosClient from "@/api/axiosClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, Trash2, Pencil } from "lucide-react";
import { useModal } from "@/components/share/useModal";
import { toast } from "sonner";

export default function BaseCrud({
  title,
  description,
  icon: Icon,
  entityName,
  apiUrl,
  fetchUrl,
  columns,
  formFields,
  initialFormState,
  searchFilter,
  hideHeader = false,
  cardTitle,
  onFieldChange,
}) {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(initialFormState);
  const [isEditing, setIsEditing] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const { confirm } = useModal();

  const loadData = async () => {
    try {
      setLoading(true);
      const response = await axiosClient.get(fetchUrl || apiUrl);
      setData(response.data || []);
    } catch (error) {
      console.error(`Failed to load ${entityName}s:`, error);
      toast.error(`Failed to load ${entityName}s.`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    const keyword = query.trim().toLowerCase();
    if (!keyword) {
      return data;
    }
    return data.filter((item) => searchFilter(item, keyword));
  }, [data, query, searchFilter]);

  const handleSubmit = async () => {
    try {
      if (isEditing) {
        await axiosClient.put(`${apiUrl}/${editingId}`, form);
        toast.success(`${entityName} updated successfully`);
      } else {
        await axiosClient.post(apiUrl, form);
        toast.success(`${entityName} created successfully`);
      }
      setDialogOpen(false);
      setForm(initialFormState);
      setIsEditing(false);
      setEditingId(null);
      loadData();
    } catch (error) {
      console.error(`Failed to save ${entityName}:`, error);
      toast.error(`Unable to save ${entityName}. Please check the form.`);
    }
  };

  const handleDelete = async (id) => {
    const confirmed = await confirm({
      title: `Delete ${entityName}`,
      message: `Delete this ${entityName.toLowerCase()}?`,
    });

    if (!confirmed) return;

    try {
      await axiosClient.delete(`${apiUrl}/${id}`);
      setData((prev) => prev.filter((item) => item.id !== id));
      toast.success(`${entityName} deleted successfully`);
    } catch (error) {
      console.error(`Failed to delete ${entityName}:`, error);
      toast.error(`Unable to delete ${entityName}.`);
    }
  };

  const handleEditClick = (item) => {
    setIsEditing(true);
    setEditingId(item.id);

    const editForm = {};
    Object.keys(initialFormState).forEach((key) => {
      if (key === "schoolId") {
        editForm[key] = item.school?.id || item.major?.school?.id || "";
      } else if (key === "majorId") {
        editForm[key] = item.major?.id || "";
      } else {
        editForm[key] = item[key] !== undefined && item[key] !== null ? item[key] : "";
      }
    });

    setForm(editForm);
    setDialogOpen(true);
    if (onFieldChange) {
      onFieldChange("__init__", null, editForm, setForm);
    }
  };

  const handleFieldChange = (fieldName, val) => {
    let finalVal = val;
    const field = formFields.find((f) => f.name === fieldName);
    if (field?.uppercase && typeof finalVal === "string") {
      finalVal = finalVal.toUpperCase();
    }
    const updatedForm = { ...form, [fieldName]: finalVal };
    setForm(updatedForm);
    if (onFieldChange) {
      onFieldChange(fieldName, finalVal, updatedForm, setForm);
    }
  };

  return (
    <div className={hideHeader ? "" : "p-6 space-y-6"}>
      {!hideHeader && (
        <div className="flex items-center gap-3">
          {Icon && <Icon className="w-8 h-8 text-[#f26522]" />}
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-slate-800">
              {title}
            </h1>
            {description && (
              <p className="text-sm text-slate-500">{description}</p>
            )}
          </div>
        </div>
      )}

      <Card className="rounded-2xl border-slate-100 shadow-sm">
        <CardHeader className="flex flex-col gap-3 border-b border-slate-100 sm:flex-row sm:items-center sm:justify-between">
          <CardTitle className="text-lg text-slate-700">
            {cardTitle || (hideHeader ? title : `${entityName} directory`)}
          </CardTitle>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative w-full sm:w-80">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={`Search ${entityName.toLowerCase()}s...`}
                className="pl-9 rounded-xl bg-slate-50 border-transparent focus-visible:border-[#f26522]/40 focus-visible:ring-[#f26522]/20"
              />
            </div>
            <Button
              className="rounded-xl bg-[#f26522] text-white hover:bg-[#d95316] flex items-center gap-2"
              onClick={() => {
                setIsEditing(false);
                setEditingId(null);
                setForm(initialFormState);
                setDialogOpen(true);
                if (onFieldChange) {
                  onFieldChange("__init__", null, initialFormState, setForm);
                }
              }}
            >
              <Plus className="w-4 h-4" />
              Add {entityName.toLowerCase()}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <div className="rounded-xl border border-slate-100 overflow-hidden">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow>
                  {columns.map((col, idx) => (
                    <TableHead
                      key={idx}
                      className={`font-semibold ${col.className || ""}`}
                    >
                      {col.header}
                    </TableHead>
                  ))}
                  <TableHead className="text-right font-semibold">
                    Action
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="py-8 text-center text-slate-500"
                    >
                      Loading {entityName.toLowerCase()}s...
                    </TableCell>
                  </TableRow>
                ) : filteredData.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length + 1}
                      className="py-8 text-center text-slate-500"
                    >
                      No {entityName.toLowerCase()}s found.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredData.map((item) => (
                    <TableRow key={item.id} className="hover:bg-slate-50/60">
                      {columns.map((col, idx) => (
                        <TableCell key={idx} className={col.cellClassName || ""}>
                          {col.render(item)}
                        </TableCell>
                      ))}
                      <TableCell className="text-right space-x-1">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleEditClick(item)}
                          className="text-slate-500 hover:text-[#f26522] hover:bg-orange-50"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDelete(item.id)}
                          className="text-slate-500 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="rounded-2xl">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit" : "Add"} {entityName.toLowerCase()}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Modify" : "Create"} a {entityName.toLowerCase()} record.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4">
            {formFields.map((field) => (
              <div key={field.name} className="grid gap-2">
                <Label>{field.label}</Label>
                {field.type === "select" ? (
                  <select
                    value={form[field.name] || ""}
                    onChange={(event) => handleFieldChange(field.name, event.target.value)}
                    className="w-full h-10 px-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#f26522] text-slate-700 text-sm"
                  >
                    <option value="">Select {field.label.toLowerCase()}...</option>
                    {field.options?.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : field.type === "textarea" ? (
                  <textarea
                    value={form[field.name] || ""}
                    onChange={(event) => handleFieldChange(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    className="w-full p-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-[#f26522] text-slate-700 text-sm"
                    rows={3}
                  />
                ) : (
                  <Input
                    value={form[field.name] || ""}
                    onChange={(event) => handleFieldChange(field.name, event.target.value)}
                    placeholder={field.placeholder}
                    className="rounded-xl border-slate-200 focus-visible:ring-[#f26522]"
                  />
                )}
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-[#f26522] text-white hover:bg-[#d95316]"
              onClick={handleSubmit}
            >
              Save {entityName.toLowerCase()}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
