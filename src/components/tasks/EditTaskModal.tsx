"use client";

import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import {
  AlertTriangle,
  ArrowUp,
  ArrowDown,
  Minus,
  User2,
  CalendarDays,
  Loader2,
  Pencil,
  CheckCircle2,
  Upload,
  Link2,
  FileText,
  Clock,
  XCircle,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Task {
  _id: string;
  title: string;
  description: string;
  status: "pending" | "in_progress" | "submitted" | "approved" | "rejected";
  priority: "low" | "medium" | "high" | "urgent";
  assignedToSsoId: string;
  assignedBySsoId: string;
  assignedToUser?: { id: string | number; name: string; email: string; role: string };
  assignedByUser?: { id: string | number; name: string; email: string; role: string };
  dueDate?: string;
  tags?: string[];
}

interface EmsUserOption {
  ssoUserId: string;
  appRole: string;
  department: string;
}

interface EditTaskModalProps {
  task: Task | null;
  isOpen: boolean;
  isManager: boolean;
  onClose: () => void;
  onUpdated: () => void;
}

const PRIORITIES = [
  { value: "low", label: "Low", icon: ArrowDown, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30" },
  { value: "medium", label: "Medium", icon: Minus, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  { value: "high", label: "High", icon: ArrowUp, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  { value: "urgent", label: "Urgent", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
];

const MANAGER_STATUSES = [
  { value: "pending", label: "To Do", icon: Clock, color: "text-slate-400" },
  { value: "in_progress", label: "In Progress", icon: Loader2, color: "text-blue-400" },
  { value: "submitted", label: "Submitted", icon: Upload, color: "text-purple-400" },
  { value: "approved", label: "Approved", icon: CheckCircle2, color: "text-emerald-400" },
  { value: "rejected", label: "Rejected", icon: XCircle, color: "text-red-400" },
];

const EMPLOYEE_STATUSES = [
  { value: "in_progress", label: "Mark In Progress", icon: Loader2, color: "text-blue-400" },
  { value: "submitted", label: "Submit for Review", icon: Upload, color: "text-purple-400" },
];

export function EditTaskModal({ task, isOpen, isManager, onClose, onUpdated }: EditTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<EmsUserOption[]>([]);
  const [activeTab, setActiveTab] = useState<"details" | "submit">("details");

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToSsoId: "",
    priority: "medium",
    status: "pending",
    dueDate: "",
  });

  const [submission, setSubmission] = useState({
    contentUrl: "",
    externalLink: "",
    notes: "",
  });

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description,
        assignedToSsoId: task.assignedToSsoId,
        priority: task.priority,
        status: task.status,
        dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "",
      });
      setActiveTab("details");
    }
  }, [task]);

  useEffect(() => {
    if (isOpen && isManager) {
      apiClient.get("/users").then((res) => setUsers(res.data)).catch(() => {});
    }
  }, [isOpen, isManager]);

  const handleManagerUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    setLoading(true);
    try {
      await apiClient.patch(`/tasks/${task._id}`, formData);
      toast.success("Task updated successfully!");
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update task");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    if (!task) return;
    setLoading(true);
    try {
      await apiClient.patch(`/tasks/${task._id}`, { status: newStatus });
      toast.success(`Status updated to "${newStatus.replace("_", " ")}"`);
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to update status");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!task) return;
    if (!submission.notes.trim()) {
      toast.error("Please add submission notes");
      return;
    }
    setLoading(true);
    try {
      await apiClient.patch(`/tasks/${task._id}`, { submission });
      toast.success("Work submitted for review! ✅");
      onUpdated();
      onClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to submit work");
    } finally {
      setLoading(false);
    }
  };

  if (!task) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[580px] p-0 overflow-hidden bg-background border border-border/80 shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-br from-blue-500/5 via-transparent to-transparent">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Pencil className="w-4 h-4 text-blue-400" />
              </div>
              {isManager ? "Edit Task" : "Update Task"}
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm truncate">
              {task.title}
            </DialogDescription>
          </DialogHeader>
        </div>

        {/* Tab Bar (only for employees) */}
        {!isManager && (
          <div className="flex border-b border-border/50 px-6 bg-muted/20">
            {[
              { id: "details", label: "Details", icon: FileText },
              { id: "submit", label: "Submit Work", icon: Upload },
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id as any)}
                className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors -mb-px ${
                  activeTab === id
                    ? "border-violet-500 text-violet-400"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        )}

        <div className="px-6 py-5">
          {/* MANAGER VIEW */}
          {isManager && (
            <form onSubmit={handleManagerUpdate} className="space-y-5">
              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Title</label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="h-10 bg-muted/30"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold">Description</label>
                <textarea
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 resize-none"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <User2 className="w-3.5 h-3.5 text-muted-foreground" /> Assignee
                  </label>
                  <select
                    className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50"
                    value={formData.assignedToSsoId}
                    onChange={(e) => setFormData({ ...formData, assignedToSsoId: e.target.value })}
                  >
                    {users.map((u) => (
                      <option key={u.ssoUserId} value={u.ssoUserId}>
                        {u.ssoUserId} · {u.appRole}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-semibold flex items-center gap-1.5">
                    <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" /> Due Date
                  </label>
                  <Input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    className="h-10 bg-muted/30"
                  />
                </div>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Status</label>
                <div className="flex flex-wrap gap-2">
                  {MANAGER_STATUSES.map(({ value, label, icon: Icon, color }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, status: value })}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${
                        formData.status === value
                          ? `${color} border-current bg-current/10 ring-1 ring-current/20`
                          : "border-border/50 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon className={`w-3.5 h-3.5 ${formData.status === value ? color : ""}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <label className="text-sm font-semibold">Priority</label>
                <div className="grid grid-cols-4 gap-2">
                  {PRIORITIES.map(({ value, label, icon: Icon, color, bg }) => (
                    <button
                      key={value}
                      type="button"
                      onClick={() => setFormData({ ...formData, priority: value })}
                      className={`flex flex-col items-center gap-1 py-2 rounded-lg border text-xs font-medium transition-all ${
                        formData.priority === value
                          ? `${bg} ${color} border-current scale-105`
                          : "border-border/50 text-muted-foreground hover:bg-muted/50"
                      }`}
                    >
                      <Icon className={`w-4 h-4 ${formData.priority === value ? color : ""}`} />
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
                <Button type="button" variant="outline" onClick={onClose} className="h-9">Cancel</Button>
                <Button type="submit" disabled={loading} className="h-9 gap-2 bg-violet-600 hover:bg-violet-700">
                  {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Saving...</> : <><Pencil className="w-4 h-4" /> Save Changes</>}
                </Button>
              </div>
            </form>
          )}

          {/* EMPLOYEE — DETAILS TAB */}
          {!isManager && activeTab === "details" && (
            <div className="space-y-5">
              <div className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1 font-medium uppercase tracking-wide">Description</p>
                  <p className="text-sm leading-relaxed">{task.description}</p>
                </div>
                <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/30">
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Due Date</p>
                    <p className="text-sm font-medium">
                      {task.dueDate ? new Date(task.dueDate).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : "No deadline"}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Assigned By</p>
                    <p className="text-sm font-medium font-mono">{task.assignedBySsoId}</p>
                  </div>
                </div>
                {task.tags && task.tags.length > 0 && (
                  <div className="pt-2 border-t border-border/30">
                    <p className="text-xs text-muted-foreground mb-2">Tags</p>
                    <div className="flex flex-wrap gap-1">
                      {task.tags.map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs bg-violet-500/10 text-violet-300 border-violet-500/30">{tag}</Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-sm font-semibold">Quick Status Update</p>
                <div className="flex flex-wrap gap-2">
                  {EMPLOYEE_STATUSES.map(({ value, label, icon: Icon, color }) => (
                    <Button
                      key={value}
                      variant="outline"
                      size="sm"
                      onClick={() => handleStatusUpdate(value)}
                      disabled={loading || task.status === value || task.status === "approved"}
                      className={`gap-2 h-9 text-xs ${task.status === value ? `${color} border-current bg-current/10` : ""}`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                    </Button>
                  ))}
                </div>
                {task.status === "approved" && (
                  <p className="text-xs text-emerald-400 flex items-center gap-1 mt-1">
                    <CheckCircle2 className="w-3.5 h-3.5" /> This task has been approved — no further updates allowed.
                  </p>
                )}
              </div>

              <div className="flex justify-end border-t border-border/50 pt-3">
                <Button variant="outline" onClick={onClose} className="h-9">Close</Button>
              </div>
            </div>
          )}

          {/* EMPLOYEE — SUBMIT WORK TAB */}
          {!isManager && activeTab === "submit" && (
            <form onSubmit={handleSubmitWork} className="space-y-4">
              {task.status === "approved" && (
                <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                  This task is approved. Submissions are locked.
                </div>
              )}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground" /> Content / File URL
                </label>
                <Input
                  value={submission.contentUrl}
                  onChange={(e) => setSubmission({ ...submission, contentUrl: e.target.value })}
                  placeholder="https://drive.google.com/..."
                  className="h-10 bg-muted/30"
                  disabled={task.status === "approved"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  <Link2 className="w-3.5 h-3.5 text-muted-foreground" /> External Link
                </label>
                <Input
                  value={submission.externalLink}
                  onChange={(e) => setSubmission({ ...submission, externalLink: e.target.value })}
                  placeholder="https://figma.com/..."
                  className="h-10 bg-muted/30"
                  disabled={task.status === "approved"}
                />
              </div>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-muted-foreground" /> Notes <span className="text-red-400">*</span>
                </label>
                <textarea
                  rows={3}
                  className="flex w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 resize-none disabled:opacity-50"
                  value={submission.notes}
                  onChange={(e) => setSubmission({ ...submission, notes: e.target.value })}
                  placeholder="Describe what you've done, any blockers, links used, etc..."
                  disabled={task.status === "approved"}
                />
              </div>
              <div className="flex justify-between items-center pt-2 border-t border-border/50">
                <p className="text-xs text-muted-foreground">Submitting will change status to <span className="text-purple-400 font-medium">Submitted</span>.</p>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" onClick={onClose} className="h-9">Cancel</Button>
                  <Button
                    type="submit"
                    disabled={loading || task.status === "approved"}
                    className="h-9 gap-2 bg-violet-600 hover:bg-violet-700"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 animate-spin" /> Submitting...</> : <><Upload className="w-4 h-4" /> Submit Work</>}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
