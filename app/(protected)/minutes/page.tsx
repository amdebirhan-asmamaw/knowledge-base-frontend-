"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { listPublicMeetingMinutes, type MeetingMinute, type MeetingMinuteListResponse } from "@/lib/api/meetings.api";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { PageHeader } from "@/components/PageShell";
import {
  CalendarCheck, Calendar, Building2, User, Users, UserPlus,
  ListChecks, Clock, ChevronLeft, ChevronRight, Loader2, AlertCircle,
} from "lucide-react";

export default function PublicMinutesPage() {
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<MeetingMinute | null>(null);

  const { data, isLoading, error } = useQuery<MeetingMinuteListResponse>({
    queryKey: ["meetings", "public", { page }],
    queryFn: () => listPublicMeetingMinutes({ page, limit: 15 }),
  });

  const minutes = data?.minutes || [];
  const pagination = data?.pagination || { page: 1, limit: 15, total: 0, totalPages: 1 };

  if (selected) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Button variant="ghost" size="sm" className="-ml-2 mb-6 gap-1 text-muted-foreground" onClick={() => setSelected(null)}>
          <ChevronLeft className="w-4 h-4" /> Back to Minutes
        </Button>

        <Card className="overflow-hidden">
          <div className="h-0.5 bg-primary" />
          <div className="p-6 space-y-5">
            <div className="flex items-start justify-between gap-4">
              <h2 className="text-lg font-bold text-foreground">{selected.title}</h2>
              <Badge variant="secondary">Published</Badge>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 p-4 bg-secondary/40 rounded-xl text-xs">
              <div>
                <span className="text-muted-foreground block mb-1">Date</span>
                <span className="font-medium text-foreground">{new Date(selected.date).toLocaleDateString()}</span>
              </div>
              {selected.location && (
                <div>
                  <span className="text-muted-foreground block mb-1">Location</span>
                  <span className="font-medium text-foreground">{selected.location}</span>
                </div>
              )}
              <div>
                <span className="text-muted-foreground block mb-1">Department</span>
                <span className="font-medium text-foreground">{selected.department?.name}</span>
              </div>
              <div>
                <span className="text-muted-foreground block mb-1">Recorded by</span>
                <span className="font-medium text-foreground">{selected.author?.name}</span>
              </div>
            </div>

            {selected.publishedAt && (
              <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-3 h-3" />
                Published {new Date(selected.publishedAt).toLocaleString()}
              </p>
            )}

            {(selected.attendees?.length > 0 || selected.externalAttendees?.length > 0) && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <Users className="w-3.5 h-3.5" /> Attendees
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selected.attendees?.map((a) => (
                    <Badge key={a._id} variant="secondary" className="text-xs gap-1">
                      <User className="w-3 h-3" />{a.name}
                    </Badge>
                  ))}
                  {selected.externalAttendees?.map((a, i) => (
                    <Badge key={i} variant="outline" className="text-xs gap-1">
                      <UserPlus className="w-3 h-3" />{a.name}{a.organization ? ` (${a.organization})` : ""}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {selected.agenda?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Agenda</h3>
                <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                  {selected.agenda.map((item, i) => <li key={i}>{item}</li>)}
                </ol>
              </div>
            )}

            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Minutes</h3>
              <div
                className="prose prose-sm max-w-none [&_[data-text-size='h1']]:text-[1.75rem] [&_[data-text-size='h1']]:font-bold [&_[data-text-size='h2']]:text-[1.35rem] [&_[data-text-size='h2']]:font-semibold [&_[data-text-size='h3']]:text-[1.125rem] [&_[data-text-size='h3']]:font-semibold [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_li>p]:m-0"
                dangerouslySetInnerHTML={{ __html: selected.content }}
              />
            </div>

            {selected.actionItems?.length > 0 && (
              <div>
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5">
                  <ListChecks className="w-3.5 h-3.5" /> Action Items
                </h3>
                <div className="border border-border rounded-xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-secondary/50">
                      <tr>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground">Task</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground">Assignee</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground">Due Date</th>
                        <th className="text-left px-4 py-2.5 text-xs font-semibold text-foreground">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selected.actionItems.map((ai) => (
                        <tr key={ai._id} className="border-t border-border">
                          <td className="px-4 py-2.5 text-sm">{ai.task}</td>
                          <td className="px-4 py-2.5 text-sm">{ai.assignee?.name}</td>
                          <td className="px-4 py-2.5 text-sm">{ai.dueDate ? new Date(ai.dueDate).toLocaleDateString() : "—"}</td>
                          <td className="px-4 py-2.5">
                            <Badge
                              variant={ai.status === "done" ? "default" : ai.status === "in-progress" ? "secondary" : "outline"}
                              className="text-[10px]"
                            >
                              {ai.status}
                            </Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <PageHeader
        icon={<CalendarCheck className="w-5 h-5" style={{ color: "#2563eb" }} />}
        title="Meeting Minutes"
        subtitle="Published minutes from your department"
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-center">
          <AlertCircle className="w-5 h-5 text-red-500 mx-auto mb-2" />
          <p className="text-sm text-red-700">Failed to load minutes.</p>
        </div>
      ) : minutes.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border p-16 text-center">
          <CalendarCheck className="w-10 h-10 text-muted-foreground/30 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">No meeting minutes available for your department.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {minutes.map((m) => (
            <Card
              key={m._id}
              className="p-5 cursor-pointer hover:border-primary/30 hover:shadow-md transition-all group"
              onClick={() => setSelected(m)}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm text-foreground truncate mb-1.5 group-hover:text-primary transition-colors">
                    {m.title}
                  </h3>
                  <div className="flex items-center flex-wrap gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><Calendar className="w-3 h-3" />{new Date(m.date).toLocaleDateString()}</span>
                    <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{m.department?.name}</span>
                    <span className="flex items-center gap-1"><User className="w-3 h-3" />{m.author?.name}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{(m.attendees?.length || 0) + (m.externalAttendees?.length || 0)} attendees</span>
                  </div>
                </div>
                {m.actionItems?.length > 0 && (
                  <Badge variant="outline" className="text-[10px] shrink-0 gap-1">
                    <ListChecks className="w-3 h-3" />{m.actionItems.length}
                  </Badge>
                )}
              </div>
            </Card>
          ))}

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-3 pt-4">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage((p) => p - 1)} className="gap-1">
                <ChevronLeft className="w-3.5 h-3.5" /> Previous
              </Button>
              <span className="text-xs text-muted-foreground">Page {page} of {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage((p) => p + 1)} className="gap-1">
                Next <ChevronRight className="w-3.5 h-3.5" />
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
