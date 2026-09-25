"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useComplianceReport } from "@/hooks/queries";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  ChevronLeft,
  Users,
  CheckCircle2,
  AlertCircle,
  Search,
  Download,
  ExternalLink,
  ShieldCheck,
  Building2,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function CompliancePage() {
  const router = useRouter();
  const { data, isLoading } = useComplianceReport();

  const [search, setSearch] = useState("");
  const [selectedDepartment, setSelectedDepartment] = useState("all");

  if (isLoading) {
    return (
      <div className="space-y-4 max-w-5xl">
        <div className="h-10 rounded-xl bg-muted animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
        <div className="h-64 rounded-xl bg-muted animate-pulse" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-16">
        <AlertCircle className="w-8 h-8 text-destructive mx-auto mb-2" />
        <p className="text-sm text-muted-foreground">Failed to load compliance audit data.</p>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => router.push("/admin/policies")}
        >
          Return to Policies
        </Button>
      </div>
    );
  }

  const complianceRate =
    data.totalEmployees > 0
      ? Math.round((data.fullyCompliant / data.totalEmployees) * 100)
      : 100;

  // Extract distinct departments from non-compliant employees
  const departments = Array.from(
    new Set(
      data.nonCompliant
        .map((e) => e.department?.name)
        .filter((d): d is string => Boolean(d))
    )
  );

  const filteredEmployees = data.nonCompliant.filter((emp) => {
    const matchesSearch =
      search.trim() === "" ||
      emp.name.toLowerCase().includes(search.toLowerCase()) ||
      emp.email.toLowerCase().includes(search.toLowerCase()) ||
      (emp.position && emp.position.toLowerCase().includes(search.toLowerCase())) ||
      (emp.department?.name &&
        emp.department.name.toLowerCase().includes(search.toLowerCase()));

    const matchesDept =
      selectedDepartment === "all" ||
      emp.department?.name === selectedDepartment;

    return matchesSearch && matchesDept;
  });

  const exportReportToCsv = () => {
    if (!data) return;
    const headers = [
      "Employee Name",
      "Email",
      "Department",
      "Position",
      "Completion Rate",
      "Missing Policies",
      "Accepted Policies",
    ];

    const rows = data.nonCompliant.map((e) => [
      `"${e.name.replace(/"/g, '""')}"`,
      `"${e.email}"`,
      `"${e.department?.name || "General"}"`,
      `"${e.position || ""}"`,
      `"${e.completionRatio} (${e.completionPercentage}%)"`,
      `"${e.missingPolicies.map((p) => `${p.title} (v${p.version})`).join("; ")}"`,
      `"${e.acceptedPolicies.map((p) => `${p.title} (v${p.version})`).join("; ")}"`,
    ]);

    const csvContent = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `policy-compliance-report-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Compliance audit exported to CSV");
  };

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push("/admin/policies")}
            className="gap-1.5"
          >
            <ChevronLeft className="w-4 h-4" />
            Policies
          </Button>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">
            Organization Compliance Audit
          </h1>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={exportReportToCsv}
          className="gap-1.5 self-start sm:self-center"
        >
          <Download className="w-4 h-4" />
          Export Audit Report
        </Button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="p-5 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400">
              <Users className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Total Active Staff
            </span>
          </div>
          <p className="text-3xl font-bold text-foreground">{data.totalEmployees}</p>
        </Card>

        <Card className="p-5 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Fully Compliant Staff
            </span>
          </div>
          <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400">
            {data.fullyCompliant}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              ({complianceRate}%)
            </span>
          </p>
        </Card>

        <Card className="p-5 border-border">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 rounded-xl bg-red-500/10 text-red-600 dark:text-red-400">
              <AlertCircle className="w-5 h-5" />
            </div>
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Non-Compliant Staff
            </span>
          </div>
          <p className="text-3xl font-bold text-red-600 dark:text-red-400">
            {data.nonCompliant.length}{" "}
            <span className="text-sm font-normal text-muted-foreground">
              (
              {data.totalEmployees > 0
                ? Math.round((data.nonCompliant.length / data.totalEmployees) * 100)
                : 0}
              %)
            </span>
          </p>
        </Card>
      </div>

      {/* Per-policy breakdown */}
      <Card className="p-6">
        <h2 className="text-base font-semibold text-foreground mb-1">
          Required Policies Acceptance Overview
        </h2>
        <p className="text-xs text-muted-foreground mb-4">
          Tracking adherence to each mandatory company governance document.
        </p>

        {data.policies.length === 0 ? (
          <div className="text-center py-8 border border-dashed rounded-xl">
            <ShieldCheck className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
            <p className="text-sm font-medium text-foreground">
              No mandatory policies configured
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              Mark policies as &quot;Required&quot; in editor to track staff compliance.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {data.policies.map((p) => {
              const rate =
                data.totalEmployees > 0
                  ? Math.round((p.acceptedCount / data.totalEmployees) * 100)
                  : 100;
              return (
                <div
                  key={p._id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card hover:bg-muted/20 transition-colors"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {p.title}
                      </p>
                      <Badge variant="outline" className="text-[10px] font-mono">
                        v{p.version}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {p.pendingCount > 0 ? (
                        <span className="text-red-600 dark:text-red-400 font-medium">
                          {p.pendingCount} staff pending acknowledgment
                        </span>
                      ) : (
                        <span className="text-emerald-600 dark:text-emerald-400 font-medium">
                          100% staff compliance achieved
                        </span>
                      )}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 self-end sm:self-center shrink-0">
                    <div className="w-36 h-2 bg-muted rounded-full overflow-hidden border border-border/40">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          rate === 100 ? "bg-emerald-500" : "bg-primary"
                        }`}
                        style={{ width: `${rate}%` }}
                      />
                    </div>
                    <span className="text-xs font-semibold text-foreground w-14 text-right">
                      {p.acceptedCount}/{data.totalEmployees}
                    </span>
                    <Badge
                      variant={rate === 100 ? "default" : "secondary"}
                      className={`text-xs font-mono ${
                        rate === 100 ? "bg-emerald-600 text-white" : ""
                      }`}
                    >
                      {rate}%
                    </Badge>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => router.push(`/admin/policies/${p._id}`)}
                      title="Inspect policy"
                      className="h-7 w-7 text-muted-foreground hover:text-foreground"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Non-compliant employees list */}
      <Card className="p-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              Non-Compliant Staff Directory ({data.nonCompliant.length})
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Employees who have not acknowledged all mandatory active policies at their current published version.
            </p>
          </div>
        </div>

        {/* Filter inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search employee, email, position…"
              className="pl-9 h-8 text-xs"
            />
          </div>

          {departments.length > 0 && (
            <div className="flex items-center gap-1.5 overflow-x-auto">
              <Button
                variant={selectedDepartment === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedDepartment("all")}
                className="h-8 text-xs shrink-0"
              >
                All Departments
              </Button>
              {departments.map((dept) => (
                <Button
                  key={dept}
                  variant={selectedDepartment === dept ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedDepartment(dept)}
                  className="h-8 text-xs shrink-0"
                >
                  {dept}
                </Button>
              ))}
            </div>
          )}
        </div>

        {filteredEmployees.length === 0 ? (
          <div className="text-center py-10 border border-dashed rounded-xl">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-sm font-semibold text-foreground">
              {search.trim() || selectedDepartment !== "all"
                ? "No matching staff found in filter"
                : "No non-compliant staff found!"}
            </p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {search.trim() || selectedDepartment !== "all"
                ? "Try clearing your search query or department filter."
                : "All active team members have acknowledged all mandatory policies."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredEmployees.map((emp) => (
              <div
                key={String(emp._id)}
                className="p-4 rounded-xl border border-border bg-card space-y-3 hover:bg-muted/10 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-foreground">{emp.name}</p>
                      {emp.department && (
                        <Badge
                          variant="outline"
                          className="text-[10px] gap-1 px-1.5 py-0.5 text-muted-foreground"
                        >
                          <Building2 className="w-3 h-3" />
                          {emp.department.name}
                        </Badge>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {emp.email}
                      {emp.position && ` · ${emp.position}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center">
                    <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">
                      {emp.completionRatio} Accepted
                    </span>
                    <Badge
                      variant="outline"
                      className="text-xs font-mono bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                    >
                      {emp.completionPercentage}%
                    </Badge>
                  </div>
                </div>

                {/* Missing policies badges */}
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-medium text-red-600 dark:text-red-400 mr-1 flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> Missing:
                  </span>
                  {emp.missingPolicies.map((mp) => (
                    <Badge
                      key={String(mp._id)}
                      variant="outline"
                      className="text-[11px] font-normal bg-red-500/10 text-red-700 dark:text-red-400 border-red-500/20"
                    >
                      {mp.title} (v{mp.version})
                    </Badge>
                  ))}

                  {emp.acceptedPolicies.length > 0 && (
                    <>
                      <span className="text-[11px] font-medium text-emerald-600 dark:text-emerald-400 ml-2 mr-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Accepted:
                      </span>
                      {emp.acceptedPolicies.map((ap) => (
                        <Badge
                          key={String(ap._id)}
                          variant="outline"
                          className="text-[11px] font-normal bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                        >
                          {ap.title} (v{ap.version})
                        </Badge>
                      ))}
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
