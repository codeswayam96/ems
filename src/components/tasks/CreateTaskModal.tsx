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
  Tag,
  Loader2,
  Plus,
  X,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface EmsUserOption {
  ssoUserId: string;
  appRole: string;
  department: string;
}

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onTaskCreated: () => void;
}

const PRIORITIES = [
  { value: "low", label: "Low", icon: ArrowDown, color: "text-slate-400", bg: "bg-slate-500/10 border-slate-500/30" },
  { value: "medium", label: "Medium", icon: Minus, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  { value: "high", label: "High", icon: ArrowUp, color: "text-orange-400", bg: "bg-orange-500/10 border-orange-500/30" },
  { value: "urgent", label: "Urgent", icon: AlertTriangle, color: "text-red-400", bg: "bg-red-500/10 border-red-500/30" },
];

export function CreateTaskModal({ isOpen, onClose, onTaskCreated }: CreateTaskModalProps) {
  const [loading, setLoading] = useState(false);
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [users, setUsers] = useState<EmsUserOption[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    assignedToSsoId: "",
    priority: "medium",
    dueDate: "",
    tags: [] as string[],
  });

  useEffect(() => {
    if (isOpen) {
      setFetchingUsers(true);
      apiClient
        .get("/users")
        .then((res) => setUsers(res.data))
        .catch(() => toast.error("Failed to load users"))
        .finally(() => setFetchingUsers(false));
    }
  }, [isOpen]);

  const resetForm = () => {
    setFormData({ title: "", description: "", assignedToSsoId: "", priority: "medium", dueDate: "", tags: [] });
    setTagInput("");
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const addTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !formData.tags.includes(tag)) {
      setFormData((f) => ({ ...f, tags: [...f.tags, tag] }));
    }
    setTagInput("");
  };

  const removeTag = (tag: string) => {
    setFormData((f) => ({ ...f, tags: f.tags.filter((t) => t !== tag) }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim() || !formData.assignedToSsoId) {
      toast.error("Please fill all required fields");
      return;
    }

    setLoading(true);
    try {
      await apiClient.post("/tasks", formData);
      toast.success("Task created successfully! 🚀");
      onTaskCreated();
      handleClose();
    } catch (err: any) {
      toast.error(err.response?.data?.error || "Failed to create task");
    } finally {
      setLoading(false);
    }
  };

  const selectedPriority = PRIORITIES.find((p) => p.value === formData.priority);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[560px] p-0 overflow-hidden bg-background border border-border/80 shadow-2xl">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-border/50 bg-gradient-to-br from-violet-500/5 via-transparent to-transparent">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-violet-500/20 flex items-center justify-center">
                <Plus className="w-4 h-4 text-violet-400" />
              </div>
              Create New Task
            </DialogTitle>
            <DialogDescription className="text-muted-foreground text-sm">
              Assign a task to a team member with full details.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-5">
          {/* Title */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Task Title <span className="text-red-400">*</span>
            </label>
            <Input
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g. Design new landing page mockup"
              className="h-10 bg-muted/30"
            />
          </div>

          {/* Description */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground">
              Description <span className="text-red-400">*</span>
            </label>
            <textarea
              rows={3}
              className="flex w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 resize-none"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Describe what needs to be done, expected outcome, and any relevant context..."
            />
          </div>

          {/* Assign To + Due Date */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <User2 className="w-3.5 h-3.5 text-muted-foreground" /> Assign To <span className="text-red-400">*</span>
              </label>
              <div className="relative">
                {fetchingUsers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                <select
                  className="flex h-10 w-full rounded-md border border-input bg-muted/30 px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500/50 disabled:cursor-not-allowed disabled:opacity-50"
                  value={formData.assignedToSsoId}
                  onChange={(e) => setFormData({ ...formData, assignedToSsoId: e.target.value })}
                  disabled={fetchingUsers}
                >
                  <option value="">Select member...</option>
                  {users.map((user) => (
                    <option key={user.ssoUserId} value={user.ssoUserId}>
                      {user.ssoUserId} · {user.appRole} · {user.department}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
                <CalendarDays className="w-3.5 h-3.5 text-muted-foreground" /> Due Date
              </label>
              <Input
                type="date"
                value={formData.dueDate}
                onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                className="h-10 bg-muted/30"
                min={new Date().toISOString().split("T")[0]}
              />
            </div>
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <label className="text-sm font-semibold text-foreground">Priority</label>
            <div className="grid grid-cols-4 gap-2">
              {PRIORITIES.map(({ value, label, icon: Icon, color, bg }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setFormData({ ...formData, priority: value })}
                  className={`flex flex-col items-center gap-1 py-2.5 rounded-lg border text-xs font-medium transition-all ${
                    formData.priority === value
                      ? `${bg} ${color} border-current ring-2 ring-offset-1 ring-offset-background ring-current/30 scale-105`
                      : "border-border/50 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  <Icon className={`w-4 h-4 ${formData.priority === value ? color : ""}`} />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-foreground flex items-center gap-1.5">
              <Tag className="w-3.5 h-3.5 text-muted-foreground" /> Tags
              <span className="text-muted-foreground font-normal text-xs">(optional)</span>
            </label>
            <div className="flex gap-2">
              <Input
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    addTag();
                  }
                }}
                placeholder="Add tag and press Enter..."
                className="h-9 bg-muted/30 text-sm flex-1"
              />
              <Button type="button" onClick={addTag} variant="outline" size="sm" className="h-9 px-3">
                Add
              </Button>
            </div>
            {formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 pt-1">
                {formData.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="bg-violet-500/10 text-violet-300 border-violet-500/30 text-xs gap-1 pr-1"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="rounded-full hover:bg-violet-500/20 p-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center pt-2 border-t border-border/50">
            <div className="text-xs text-muted-foreground">
              Priority:{" "}
              <span className={selectedPriority?.color + " font-medium"}>
                {selectedPriority?.label}
              </span>
            </div>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={handleClose} className="h-9">
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="h-9 gap-2 bg-violet-600 hover:bg-violet-700 shadow-lg shadow-violet-500/20"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" /> Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4" /> Create Task
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
