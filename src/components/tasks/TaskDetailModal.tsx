"use client";


import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Clock,
  User2,
  UserCheck,
  CalendarDays,
  Tag,
  History,
  Link2,
  FileText,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { PriorityBadge, StatusBadge } from "@/components/StatusBadge";

interface Submission {
  ssoUserId: string;
  contentUrl?: string;
  externalLink?: string;
  notes?: string;
  version: number;
  createdAt: string;
}

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
  submissions?: Submission[];
  createdAt: string;
  updatedAt: string;
}

interface TaskDetailModalProps {
  task: Task | null;
  isOpen: boolean;
  onClose: () => void;
}

function isOverdue(dueDate?: string, status?: string) {
  if (!dueDate || status === "approved") return false;
  return new Date(dueDate) < new Date();
}

export function TaskDetailModal({ task, isOpen, onClose }: TaskDetailModalProps) {
  if (!task) return null;

  const overdue = isOverdue(task.dueDate, task.status);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[620px] p-0 overflow-hidden bg-background border border-border/80 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 z-10 px-6 pt-6 pb-4 border-b border-border/50 bg-background bg-gradient-to-br from-violet-500/5 via-transparent to-transparent">
          <DialogHeader>
            <div className="flex items-start justify-between gap-3">
              <DialogTitle className="text-lg font-bold leading-snug flex-1 pr-4">
                {task.title}
              </DialogTitle>
              <div className="flex items-center gap-2 flex-shrink-0">
                <PriorityBadge priority={task.priority} />
                <StatusBadge status={task.status as any} />
              </div>
            </div>
            {overdue && (
              <div className="flex items-center gap-2 mt-3 rounded-lg bg-red-500/10 border border-red-500/30 px-3 py-2 text-xs text-red-400">
                <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                This task is overdue!
              </div>
            )}
          </DialogHeader>
        </div>

        <div className="px-6 py-5 space-y-6">
          {/* Meta Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <User2 className="w-3 h-3" /> Assigned To
              </div>
              <p className="text-sm font-medium truncate capitalize">
                {task.assignedToUser?.name || task.assignedToSsoId}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <UserCheck className="w-3 h-3" /> Assigned By
              </div>
              <p className="text-sm font-medium truncate capitalize">
                {task.assignedByUser?.name || task.assignedBySsoId}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <CalendarDays className="w-3 h-3" /> Due Date
              </div>
              <p className={`text-sm font-medium ${overdue ? "text-red-400" : ""}`}>
                {task.dueDate
                  ? new Date(task.dueDate).toLocaleDateString("en-GB", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })
                  : "No deadline"}
              </p>
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-3">
              <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
                <Clock className="w-3 h-3" /> Created
              </div>
              <p className="text-sm font-medium">
                {new Date(task.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                })}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5" /> Description
            </div>
            <div className="rounded-lg border border-border/50 bg-muted/20 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{task.description}</p>
            </div>
          </div>

          {/* Tags */}
          {task.tags && task.tags.length > 0 && (
            <div>
              <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
                <Tag className="w-3.5 h-3.5" /> Tags
              </div>
              <div className="flex flex-wrap gap-1.5">
                {task.tags.map((tag) => (
                  <Badge
                    key={tag}
                    variant="outline"
                    className="text-xs bg-violet-500/10 text-violet-300 border-violet-500/30"
                  >
                    {tag}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Submissions */}
          <div>
            <div className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-3 flex items-center gap-1.5">
              <History className="w-3.5 h-3.5" /> Submission History
              {task.submissions && task.submissions.length > 0 && (
                <Badge variant="outline" className="ml-1 text-[10px] h-4 px-1.5">
                  {task.submissions.length}
                </Badge>
              )}
            </div>
            {!task.submissions || task.submissions.length === 0 ? (
              <div className="rounded-lg border border-dashed border-border/50 p-6 text-center">
                <History className="w-8 h-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">No submissions yet</p>
              </div>
            ) : (
              <div className="space-y-3">
                {[...task.submissions].reverse().map((sub, idx) => (
                  <div
                    key={idx}
                    className="rounded-lg border border-border/50 bg-muted/20 p-4 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-violet-500/20 flex items-center justify-center text-xs font-bold text-violet-400">
                          v{sub.version}
                        </div>
                        <span className="text-sm font-medium font-mono">{sub.ssoUserId}</span>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(sub.createdAt).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>

                    {sub.notes && (
                      <p className="text-sm text-muted-foreground leading-relaxed border-l-2 border-violet-500/30 pl-3">
                        {sub.notes}
                      </p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {sub.contentUrl && (
                        <a
                          href={sub.contentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-blue-500/10 text-blue-400 border border-blue-500/30 rounded-md px-2.5 py-1 hover:bg-blue-500/20 transition-colors"
                        >
                          <FileText className="w-3 h-3" /> Content
                        </a>
                      )}
                      {sub.externalLink && (
                        <a
                          href={sub.externalLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 rounded-md px-2.5 py-1 hover:bg-emerald-500/20 transition-colors"
                        >
                          <Link2 className="w-3 h-3" /> External Link
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {task.status === "approved" && (
            <div className="flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 px-4 py-3 text-sm text-emerald-400">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
              This task has been approved and is complete.
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
