"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useMeetings, useMeetingMutations, useDepartments, useEmployees } from "@/hooks/queries";
import type { MeetingMinute, MeetingMinuteFilters, MeetingStatus, MeetingVisibility, ExternalAttendee } from "@/lib/api/meetings.api";
import { RichTextEditor } from "@/components/RichTextEditor";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  CalendarCheck, Plus, Loader2, AlertCircle, Calendar, Building2,
  ChevronLeft, Save, Send, Trash2, Edit3, Clock, User, FileText,
  Filter, X, MapPin, Users, UserPlus, ListChecks, Globe, ShieldCheck, Lock, Search,
} from "lucide-react";

type View = "list" | "create" | "edit" | "detail";

const STATUS_OPTIONS: { value: MeetingStatus | ""; label: string }[] = [
  { value: "", label: "All Status" },
  { value: "draft", label: "Draft" },
  { value: "published", label: "Published" },
];

const VISIBILITY_OPTIONS: { value: MeetingVisibility | ""; label: string }[] = [
  { value: "", label: "All Visibility" },
  { value: "everyone", label: "Everyone" },
  { value: "department_only", label: "Department Only" },
  { value: "admins_only", label: "Admins Only" },
  { value: "private", label: "Private" },
];

const VISIBILITY_BADGE: Record<MeetingVisibility, { cls: string; label: string; icon: React.ElementType }> = {
  everyone: { cls: "bg-green-50 text-green-700 border-green-200", label: "Everyone", icon: Globe },
  department_only: { cls: "bg-blue-50 text-blue-700 border-blue-200", label: "Dept Only", icon: Building2 },
  admins_only: { cls: "bg-amber-50 text-amber-700 border-amber-200", label: "Admins Only", icon: ShieldCheck },
  private: { cls: "bg-red-50 text-red-700 border-red-200", label: "Private", icon: Lock },
};

export default function AdminMeetingsPage() {
  const { user } = useAuth();
  const [view, setView] = useState<View>("list");
  const [selected, setSelected] = useState<MeetingMinute | null>(null);
  const [filters, setFilters] = useState<MeetingMinuteFilters>({ page: 1, limit: 15 });

  const { minutes, pagination, isLoading, error } = useMeetings(filters);
  const { departments } = useDepartments();
  const { createMeeting, updateMeeting, deleteMeeting } = useMeetingMutations();

  const openCreate = () => { setSelected(null); setView("create"); };
  const openEdit = (m: MeetingMinute) => { setSelected(m); setView("edit"); };
  const openDetail = (m: MeetingMinute) => { setSelected(m); setView("detail"); };
  const goList = () => { setSelected(null); setView("list"); };

  const handleSave = async (data: Record<string, unknown>, status: MeetingStatus) => {
    const payload = { ...data, status };
    if (view === "create") {
      await createMeeting.mutateAsync(payload);
    } else if (selected) {
      await updateMeeting.mutateAsync({ id: selected._id, data: payload });
    }
    goList();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this meeting minute?")) return;
    await deleteMeeting.mutateAsync(id);
    goList();
  };

  if (view === "create" || view === "edit") {
    return (
      <MeetingForm
        initial={view === "edit" ? selected : null}
        departments={departments}
        onSave={handleSave}
        onCancel={goList}
        isSaving={createMeeting.isPending || updateMeeting.isPending}
      />
    );
  }

  if (view === "detail" && selected) {
    return (
      <MeetingDetail
        minute={selected}
        onBack={goList}
        onEdit={() => openEdit(selected)}
        onDelete={() => handleDelete(selected._id)}
        isOwner={selected.author?._id === user?.id || hasPermission("meetings:update:all")}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-primary/10"><CalendarCheck className="w-5 h-5 text-primary" /></div>
          <div>
            <h1 className="text-xl font-bold">Meeting Minutes</h1>
            <p className="text-sm text-muted-foreground">Record and manage meeting minutes</p>
          </div>
        </div>
        <Button onClick={openCreate} className="gap-2"><Plus className="w-4 h-4" />New Meeting</Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex items-center gap-3 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-background"
            value={filters.department || ""}
            onChange={(e) => setFilters((f) => ({ ...f, department: e.target.value || undefined, page: 1 }))}
          >
            <option value="">All Departments</option>
            {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-background"
            value={filters.status || ""}
            onChange={(e) => setFilters((f) => ({ ...f, status: (e.target.value || undefined) as MeetingStatus | undefined, page: 1 }))}
          >
            {STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
          <select
            className="border rounded-lg px-3 py-2 text-sm bg-background"
            value={filters.visibility || ""}
            onChange={(e) => setFilters((f) => ({ ...f, visibility: (e.target.value || undefined) as MeetingVisibility | undefined, page: 1 }))}
          >
            {VISIBILITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>
      </Card>

      {/* List */}
      {isLoading ? (
        <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
      ) : error ? (
        <Card className="p-6 text-center text-red-600"><AlertCircle className="w-5 h-5 mx-auto mb-2" />{error}</Card>
      ) : minutes.length === 0 ? (
        <Card className="p-12 text-center">
          <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-muted-foreground">No meeting minutes found</p>
        </Card>
      ) : (
        <div className="space-y-3">
          {minutes.map((m) => (
            <Card
              key={m._id}
              className="p-4 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all"
              onClick={() => openDetail(m)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className="font-semibold text-sm truncate">{m.title}</h3>
                    <Badge variant={m.status === "published" ? "default" : "secondary"} className="text-[10px]">
                      {m.status}
                    </Badge>
                    {m.visibility && m.visibility !== "everyone" && (() => {
                      const vb = VISIBILITY_BADGE[m.visibility];
                      const VIcon = vb.icon;
                      return (
                        <Badge variant="outline" className={`${vb.cls} text-[10px] flex items-center gap-0.5`}>
                          <VIcon className="w-2.5 h-2.5" />{vb.label}
                        </Badge>
                      );
                    })()}
                  </div>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{m.department?.name}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{m.author?.name}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(m.attendees?.length || 0) + (m.externalAttendees?.length || 0)} attendees</span>
                  </div>
                </div>
                {m.actionItems?.length > 0 && (
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    <ListChecks className="w-3 h-3 mr-1" />{m.actionItems.length} actions
                  </Badge>
                )}
              </div>
            </Card>
          ))}

          {/* Pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 pt-4">
              <Button
                variant="outline" size="sm"
                disabled={pagination.page <= 1}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) - 1 }))}
              >Previous</Button>
              <span className="text-sm text-muted-foreground py-2">
                Page {pagination.page} of {pagination.totalPages}
              </span>
              <Button
                variant="outline" size="sm"
                disabled={pagination.page >= pagination.totalPages}
                onClick={() => setFilters((f) => ({ ...f, page: (f.page || 1) + 1 }))}
              >Next</Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Detail View ──────────────────────────────────────────────────────────────

function MeetingDetail({ minute: m, onBack, onEdit, onDelete, isOwner }: {
  minute: MeetingMinute; onBack: () => void; onEdit: () => void; onDelete: () => void; isOwner: boolean;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onBack}><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
        {isOwner && (
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={onEdit}><Edit3 className="w-3.5 h-3.5 mr-1" />Edit</Button>
            <Button variant="outline" size="sm" className="text-red-600" onClick={onDelete}><Trash2 className="w-3.5 h-3.5 mr-1" />Delete</Button>
          </div>
        )}
      </div>

      <Card className="p-6 space-y-5">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold">{m.title}</h2>
          <div className="flex items-center gap-2">
            <Badge variant={m.status === "published" ? "default" : "secondary"}>{m.status}</Badge>
            {(() => {
              const vb = VISIBILITY_BADGE[m.visibility || "everyone"];
              const VIcon = vb.icon;
              return (
                <Badge variant="outline" className={`${vb.cls} flex items-center gap-1`}>
                  <VIcon className="w-3 h-3" />{vb.label}
                </Badge>
              );
            })()}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div><span className="text-muted-foreground block text-xs mb-1">Date</span>{new Date(m.date).toLocaleDateString()}</div>
          {m.location && <div><span className="text-muted-foreground block text-xs mb-1">Location</span>{m.location}</div>}
          <div><span className="text-muted-foreground block text-xs mb-1">Department</span>{m.department?.name}</div>
          <div><span className="text-muted-foreground block text-xs mb-1">Recorded by</span>{m.author?.name}</div>
        </div>

        {m.publishedAt && (
          <p className="text-xs text-muted-foreground"><Clock className="w-3 h-3 inline mr-1" />Published {new Date(m.publishedAt).toLocaleString()}</p>
        )}

        {/* Attendees */}
        {(m.attendees?.length > 0 || m.externalAttendees?.length > 0) && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><Users className="w-4 h-4" />Attendees</h3>
            <div className="flex flex-wrap gap-2">
              {m.attendees?.map((a) => (
                <Badge key={a._id} variant="secondary" className="text-xs"><User className="w-3 h-3 mr-1" />{a.name}</Badge>
              ))}
              {m.externalAttendees?.map((a, i) => (
                <Badge key={i} variant="outline" className="text-xs"><UserPlus className="w-3 h-3 mr-1" />{a.name}{a.organization ? ` (${a.organization})` : ""}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Agenda */}
        {m.agenda?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2">Agenda</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
              {m.agenda.map((item, i) => <li key={i}>{item}</li>)}
            </ol>
          </div>
        )}

        {/* Content */}
        <div>
          <h3 className="text-sm font-semibold mb-2">Minutes</h3>
          <div
            className="prose prose-sm max-w-none [&_[data-text-size='h1']]:text-[1.75rem] [&_[data-text-size='h1']]:font-bold [&_[data-text-size='h2']]:text-[1.35rem] [&_[data-text-size='h2']]:font-semibold [&_[data-text-size='h3']]:text-[1.125rem] [&_[data-text-size='h3']]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li>p]:m-0"
            dangerouslySetInnerHTML={{ __html: m.content }}
          />
        </div>

        {/* Action Items */}
        {m.actionItems?.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold mb-2 flex items-center gap-1.5"><ListChecks className="w-4 h-4" />Action Items</h3>
            <div className="border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-secondary/50"><tr>
                  <th className="text-left px-3 py-2 font-medium">Task</th>
                  <th className="text-left px-3 py-2 font-medium">Assignee</th>
                  <th className="text-left px-3 py-2 font-medium">Due Date</th>
                  <th className="text-left px-3 py-2 font-medium">Status</th>
                </tr></thead>
                <tbody>{m.actionItems.map((ai) => (
                  <tr key={ai._id} className="border-t">
                    <td className="px-3 py-2">{ai.task}</td>
                    <td className="px-3 py-2">{ai.assignee?.name}</td>
                    <td className="px-3 py-2">{ai.dueDate ? new Date(ai.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-3 py-2">
                      <Badge variant={ai.status === "done" ? "default" : ai.status === "in-progress" ? "secondary" : "outline"} className="text-[10px]">
                        {ai.status}
                      </Badge>
                    </td>
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

// Helper functions to parse/build attendee meeting minutes inside content field
const parseMeetingSummary = (html: string) => {
  if (typeof window === "undefined" || !html) return "";
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const summarySec = doc.querySelector(".meeting-summary-section .summary-content");
    if (summarySec) {
      return summarySec.innerHTML;
    }
  } catch (err) {
    console.error("Error parsing summary:", err);
  }
  return "";
};

const parseAttendeeMinutes = (html: string, attendeeIds: string[]) => {
  const map: Record<string, string> = {};
  if (typeof window === "undefined" || !html) return map;
  try {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const sections = doc.querySelectorAll("[data-attendee-id]");
    if (sections.length > 0) {
      sections.forEach((sec) => {
        const id = sec.getAttribute("data-attendee-id");
        const contentDiv = sec.querySelector(".attendee-content");
        if (id && contentDiv) {
          map[id] = contentDiv.innerHTML;
        }
      });
    } else if (attendeeIds.length > 0) {
      // If there's no summary section and no attendee section, the entire thing might be legacy content.
      // But let's check if there's any attendee sections at all. If not, assign to first attendee.
      const hasSummary = doc.querySelector(".meeting-summary-section");
      if (!hasSummary) {
        map[attendeeIds[0]] = html;
      }
    }
  } catch (err) {
    console.error("Error parsing attendee minutes:", err);
  }
  return map;
};

const buildContentHtml = (summaryHtml: string, map: Record<string, string>, selectedEmps: any[]) => {
  let html = "";
  if (summaryHtml && summaryHtml.replace(/<[^>]*>/g, "").trim()) {
    html += `
<div class="meeting-summary-section border-b pb-5 mb-5">
  <h3 class="summary-title font-bold text-lg text-foreground mb-2">Meeting Summary</h3>
  <div class="summary-content">
    ${summaryHtml}
  </div>
</div>
    `.trim() + "\n";
  }
  
  html += selectedEmps
    .map((emp) => {
      const text = map[emp._id] || "";
      return `
<div data-attendee-id="${emp._id}" class="attendee-minutes-section border-b pb-4 mb-4 last:border-b-0 last:pb-0 last:mb-0">
  <h3 class="attendee-name font-semibold text-base text-primary flex items-center gap-2 mb-2">
    <span class="w-2 h-2 rounded-full bg-primary inline-block"></span>
    ${emp.name}'s Minutes
  </h3>
  <div class="attendee-content pl-4">
    ${text || "<p class='text-muted-foreground italic'>No minutes recorded.</p>"}
  </div>
</div>
      `.trim();
    })
    .join("\n");

  return html;
};

const hasText = (html: string) => {
  if (!html) return false;
  return html.replace(/<[^>]*>/g, "").trim().length > 0;
};

// ─── Form ─────────────────────────────────────────────────────────────────────

function MeetingForm({ initial, departments, onSave, onCancel, isSaving }: {
  initial: MeetingMinute | null;
  departments: { _id: string; name: string }[];
  onSave: (data: Record<string, unknown>, status: MeetingStatus) => Promise<void>;
  onCancel: () => void;
  isSaving: boolean;
}) {
  const { employees } = useEmployees();
  const [title, setTitle] = useState(initial?.title || "");
  const [date, setDate] = useState(initial?.date ? initial.date.slice(0, 10) : new Date().toISOString().slice(0, 10));
  const [location, setLocation] = useState(initial?.location || "");
  const [department, setDepartment] = useState(initial?.department?._id || "");
  const [attendees, setAttendees] = useState<string[]>(initial?.attendees?.map((a) => a._id) || []);
  const [extAttendees, setExtAttendees] = useState<ExternalAttendee[]>(initial?.externalAttendees || []);
  const [agenda, setAgenda] = useState<string[]>(initial?.agenda || [""]);
  const [summary, setSummary] = useState(() => parseMeetingSummary(initial?.content || ""));
  const [attendeeContent, setAttendeeContent] = useState<Record<string, string>>(() => {
    return parseAttendeeMinutes(initial?.content || "", initial?.attendees?.map((a) => a._id) || []);
  });
  const [actionItems, setActionItems] = useState(
    initial?.actionItems?.map((ai) => ({
      task: ai.task, assignee: ai.assignee?._id || "", dueDate: ai.dueDate?.slice(0, 10) || "", status: ai.status,
    })) || []
  );
  const [visibility, setVisibility] = useState<MeetingVisibility>((initial?.visibility || "everyone") as MeetingVisibility);
  const [allowedViewers, setAllowedViewers] = useState<string[]>(initial?.allowedViewers?.map((v) => v._id) || []);
  const [viewerSearch, setViewerSearch] = useState("");
  const [attendeeSearch, setAttendeeSearch] = useState("");

  const selectedAttendees = employees.filter((emp) => attendees.includes(emp._id));

  const hasAnyContent = hasText(summary) || (selectedAttendees.length > 0 && selectedAttendees.some((emp) => hasText(attendeeContent[emp._id] || "")));

  useEffect(() => {
    if (attendees.length > 0) {
      const firstDeptId = selectedAttendees.find((e) => e.department?._id)?.department?._id;
      if (firstDeptId) {
        setDepartment(firstDeptId);
      }
    } else {
      setDepartment("");
    }
    // Clean up assignees who are no longer in attendees list
    setActionItems((prev) =>
      prev.map((item) =>
        item.assignee && !attendees.includes(item.assignee)
          ? { ...item, assignee: "" }
          : item
      )
    );
  }, [attendees, employees, selectedAttendees]);

  const buildPayload = () => {
    const combinedContent = buildContentHtml(summary, attendeeContent, selectedAttendees);
    return {
      title, date, location, department, attendees, externalAttendees: extAttendees,
      agenda: agenda.filter(Boolean), content: combinedContent, actionItems: actionItems.filter((ai) => ai.task),
      visibility, allowedViewers: visibility === "private" ? allowedViewers : [],
    };
  };

  const addAgendaItem = () => setAgenda((a) => [...a, ""]);
  const removeAgendaItem = (i: number) => setAgenda((a) => a.filter((_, idx) => idx !== i));
  const updateAgendaItem = (i: number, v: string) => setAgenda((a) => a.map((item, idx) => idx === i ? v : item));

  const addActionItem = () => setActionItems((a) => [...a, { task: "", assignee: "", dueDate: "", status: "pending" as const }]);
  const removeActionItem = (i: number) => setActionItems((a) => a.filter((_, idx) => idx !== i));
  const updateActionItem = (i: number, field: string, value: string) =>
    setActionItems((a) => a.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const addExtAttendee = () => setExtAttendees((a) => [...a, { name: "" }]);
  const removeExtAttendee = (i: number) => setExtAttendees((a) => a.filter((_, idx) => idx !== i));
  const updateExtAttendee = (i: number, field: string, value: string) =>
    setExtAttendees((a) => a.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={onCancel}><ChevronLeft className="w-4 h-4 mr-1" />Back</Button>
        <h1 className="text-lg font-bold">{initial ? "Edit" : "New"} Meeting Minute</h1>
      </div>

      <Card className="p-6 space-y-5">
        {/* Basic fields */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Title *</label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Weekly standup" />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Date *</label>
            <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Location</label>
            <Input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="Room 301 / Zoom link" />
          </div>
        </div>

        {/* Internal Attendees */}
        <div className="space-y-2">
          <label className="text-sm font-medium block">Internal Attendees</label>
          
          {attendees.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mb-2">
              {attendees.map((id) => {
                const emp = employees.find((e) => e._id === id);
                return (
                  <Badge
                    key={id}
                    variant="secondary"
                    className="text-xs py-1 pr-1.5 flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-all"
                    onClick={() => setAttendees((prev) => prev.filter((x) => x !== id))}
                  >
                    <User className="w-3 h-3 text-muted-foreground" />
                    {emp?.name || id}
                    <X className="w-3.5 h-3.5 text-muted-foreground hover:text-inherit" />
                  </Badge>
                );
              })}
            </div>
          )}

          <div className="relative">
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <Input
              value={attendeeSearch}
              onChange={(e) => setAttendeeSearch(e.target.value)}
              placeholder="Search internal employees to add as attendees..."
              className="pl-9"
            />
          </div>

          {attendeeSearch && (
            <div className="border rounded-lg max-h-48 overflow-y-auto bg-popover shadow-sm">
              {employees
                .filter((e) => !attendees.includes(e._id) && e.name.toLowerCase().includes(attendeeSearch.toLowerCase()))
                .slice(0, 10)
                .map((e) => (
                  <button
                    key={e._id}
                    type="button"
                    className="w-full text-left px-4 py-2 text-sm hover:bg-secondary/60 transition-colors flex flex-col"
                    onClick={() => {
                      setAttendees((prev) => [...prev, e._id]);
                      setAttendeeSearch("");
                    }}
                  >
                    <span className="font-medium">{e.name}</span>
                    <span className="text-xs text-muted-foreground">{e.email}</span>
                  </button>
                ))}
              {employees.filter((e) => !attendees.includes(e._id) && e.name.toLowerCase().includes(attendeeSearch.toLowerCase())).length === 0 && (
                <div className="p-3 text-xs text-muted-foreground text-center">No employees found</div>
              )}
            </div>
          )}
        </div>

        {/* External Attendees */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">External Attendees</label>
            <Button type="button" variant="outline" size="sm" onClick={addExtAttendee}><UserPlus className="w-3.5 h-3.5 mr-1" />Add</Button>
          </div>
          {extAttendees.map((ea, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <Input placeholder="Name *" value={ea.name} onChange={(e) => updateExtAttendee(i, "name", e.target.value)} className="flex-1" />
              <Input placeholder="Email" value={ea.email || ""} onChange={(e) => updateExtAttendee(i, "email", e.target.value)} className="flex-1" />
              <Input placeholder="Organization" value={ea.organization || ""} onChange={(e) => updateExtAttendee(i, "organization", e.target.value)} className="flex-1" />
              <Button type="button" variant="ghost" size="icon" onClick={() => removeExtAttendee(i)}><X className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>

        {/* Agenda */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium">Agenda Items</label>
            <Button type="button" variant="outline" size="sm" onClick={addAgendaItem}><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
          </div>
          {agenda.map((item, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <span className="text-sm text-muted-foreground pt-2 w-6">{i + 1}.</span>
              <Input value={item} onChange={(e) => updateAgendaItem(i, e.target.value)} placeholder="Agenda topic" className="flex-1" />
              {agenda.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeAgendaItem(i)}><X className="w-4 h-4" /></Button>}
            </div>
          ))}
        </div>

        {/* Meeting Summary */}
        <div className="space-y-2">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Meeting Summary</label>
            <span className="text-xs text-muted-foreground">General summary or overview of the meeting.</span>
          </div>
          <RichTextEditor
            value={summary}
            onChange={setSummary}
            placeholder="Write a general summary of the meeting..."
          />
        </div>

        {/* Attendee-specific Meeting Minutes */}
        <div className="space-y-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium">Meeting Minutes by Attendee *</label>
            <span className="text-xs text-muted-foreground">Please record specific minutes/notes for each internal attendee.</span>
          </div>

          {selectedAttendees.length === 0 ? (
            <div className="border border-dashed rounded-lg p-6 text-center text-sm text-muted-foreground bg-secondary/5">
              Add internal attendees above to start recording meeting minutes.
            </div>
          ) : (
            <div className="space-y-6">
              {selectedAttendees.map((emp) => (
                <div key={emp._id} className="border rounded-lg p-4 space-y-3 bg-secondary/10">
                  <div className="flex items-center gap-2 font-medium text-sm text-primary">
                    <User className="w-4 h-4 text-muted-foreground" />
                    <span>{emp.name}</span>
                    <span className="text-xs text-muted-foreground font-normal">({emp.email})</span>
                  </div>
                  <RichTextEditor
                    value={attendeeContent[emp._id] || ""}
                    onChange={(val) => {
                      setAttendeeContent((prev) => ({
                        ...prev,
                        [emp._id]: val,
                      }));
                    }}
                    placeholder={`Write meeting minutes for ${emp.name}...`}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Action Items */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="text-sm font-medium flex items-center gap-1.5"><ListChecks className="w-4 h-4" />Action Items</label>
            <Button type="button" variant="outline" size="sm" onClick={addActionItem}><Plus className="w-3.5 h-3.5 mr-1" />Add</Button>
          </div>
          {actionItems.map((ai, i) => (
            <div key={i} className="flex gap-2 mb-2 items-start">
              <Input placeholder="Task *" value={ai.task} onChange={(e) => updateActionItem(i, "task", e.target.value)} className="flex-[2]" />
              <select className="border rounded-lg px-2 py-2 text-sm bg-background flex-1" value={ai.assignee} onChange={(e) => updateActionItem(i, "assignee", e.target.value)}>
                <option value="">Assignee</option>
                {selectedAttendees.map((emp) => <option key={emp._id} value={emp._id}>{emp.name}</option>)}
              </select>
              <Input type="date" value={ai.dueDate} onChange={(e) => updateActionItem(i, "dueDate", e.target.value)} className="flex-1" />
              <select className="border rounded-lg px-2 py-2 text-sm bg-background w-28" value={ai.status} onChange={(e) => updateActionItem(i, "status", e.target.value)}>
                <option value="pending">Pending</option>
                {/* in-progress and done options can also be here */}
                <option value="in-progress">In Progress</option>
                <option value="done">Done</option>
              </select>
              <Button type="button" variant="ghost" size="icon" onClick={() => removeActionItem(i)}><X className="w-4 h-4" /></Button>
            </div>
          ))}
        </div>

        {/* Visibility */}
        <div className="space-y-2">
          <label className="text-sm font-medium flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Visibility
          </label>
          <div className="flex items-center gap-2">
            {(["everyone", "department_only", "admins_only", "private"] as MeetingVisibility[]).map((v) => {
              const vb = VISIBILITY_BADGE[v];
              const VIcon = vb.icon;
              const isActive = visibility === v;
              return (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setVisibility(v);
                    if (v !== "private") setAllowedViewers([]);
                  }}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
                    isActive
                       ? `${vb.cls} border-current shadow-sm ring-1 ring-current/20`
                       : "border-input text-muted-foreground hover:text-foreground hover:bg-secondary/60"
                  }`}
                >
                  <VIcon className="w-3.5 h-3.5" />
                  {vb.label}
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-muted-foreground">
            {visibility === "everyone" && "Visible to all authenticated users."}
            {visibility === "department_only" && "Only visible to members of the meeting's department."}
            {visibility === "admins_only" && "Only visible to admins and superadmins."}
            {visibility === "private" && "Only visible to superadmins, the author, and selected viewers below."}
          </p>
        </div>

        {/* Allowed Viewers (private only) */}
        {visibility === "private" && (
          <div className="space-y-2">
            <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider flex items-center gap-1">
              <Users className="w-3.5 h-3.5" /> Allowed Viewers
            </label>
            {allowedViewers.length > 0 && (
              <div className="flex flex-wrap gap-1.5">
                {allowedViewers.map((id) => {
                  const emp = employees.find((e) => e._id === id);
                  return (
                    <Badge
                      key={id}
                      variant="outline"
                      className="text-xs py-0.5 pr-1 bg-secondary/50 flex items-center gap-1 cursor-pointer hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition-colors"
                      onClick={() => setAllowedViewers((v) => v.filter((x) => x !== id))}
                    >
                      {emp?.name || id}
                      <X className="w-3 h-3" />
                    </Badge>
                  );
                })}
              </div>
            )}
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" />
              <Input
                value={viewerSearch}
                onChange={(e) => setViewerSearch(e.target.value)}
                placeholder="Search employees to add..."
                className="pl-8 h-8 text-xs"
              />
            </div>
            {viewerSearch && (
              <div className="border rounded-lg max-h-32 overflow-y-auto">
                {employees
                  .filter((e) => !allowedViewers.includes(e._id) && e.name.toLowerCase().includes(viewerSearch.toLowerCase()))
                  .slice(0, 8)
                  .map((e) => (
                    <button
                      key={e._id}
                      type="button"
                      className="w-full text-left px-3 py-1.5 text-xs hover:bg-secondary/60 transition-colors"
                      onClick={() => {
                        setAllowedViewers((v) => [...v, e._id]);
                        setViewerSearch("");
                      }}
                    >
                      {e.name} <span className="text-muted-foreground">({e.email})</span>
                    </button>
                  ))}
              </div>
            )}
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 pt-4 border-t">
          <Button variant="outline" onClick={onCancel} disabled={isSaving}>Cancel</Button>
          <Button variant="outline" onClick={() => onSave(buildPayload(), "draft")} disabled={isSaving || !title || !department || !hasAnyContent}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Save className="w-4 h-4 mr-1" />}Save Draft
          </Button>
          <Button onClick={() => onSave(buildPayload(), "published")} disabled={isSaving || !title || !department || !hasAnyContent}>
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Send className="w-4 h-4 mr-1" />}Publish
          </Button>
        </div>
      </Card>
    </div>
  );
}
