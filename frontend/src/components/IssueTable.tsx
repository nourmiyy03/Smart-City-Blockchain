
import { MapPin, CalendarDays } from "lucide-react";

export interface Issue {
  issueId: string;
  issueType: string;
  location: string;
  priority: "Low" | "Medium" | "High";
  status: "Reported" | "Assigned" | "InProgress" | "Resolved" | "Closed";
  reportDate: string;
}

interface IssueTableProps {
  issues: Issue[];
  title?: string;
  description?: string;
}

const priorityStyles = {
  Low: "bg-slate-100 text-slate-600",
  Medium: "bg-amber-100 text-amber-700",
  High: "bg-red-100 text-red-700",
};

const statusStyles = {
  Reported: "bg-blue-100 text-blue-700",
  Assigned: "bg-violet-100 text-violet-700",
  InProgress: "bg-amber-100 text-amber-700",
  Resolved: "bg-emerald-100 text-emerald-700",
  Closed: "bg-slate-100 text-slate-600",
};

export default function IssueTable({
  issues,
  title = "Recent Issues",
  description = "Overview of recently reported urban issues",
}: IssueTableProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

      <div className="border-b border-slate-200 px-6 py-5">
        <h2 className="text-lg font-bold text-slate-900">
          {title}
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-slate-50 text-xs uppercase tracking-wider text-slate-500">
            <tr>
              <th className="px-6 py-4 font-semibold">Issue ID</th>
              <th className="px-6 py-4 font-semibold">Issue Type</th>
              <th className="px-6 py-4 font-semibold">Location</th>
              <th className="px-6 py-4 font-semibold">Priority</th>
              <th className="px-6 py-4 font-semibold">Status</th>
              <th className="px-6 py-4 font-semibold">Report Date</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100">
            {issues.length > 0 ? (
              issues.map((issue) => (
                <tr key={issue.issueId} className="transition hover:bg-slate-50">
                  <td className="whitespace-nowrap px-6 py-4 text-sm font-semibold text-blue-600">
                    {issue.issueId}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm font-medium text-slate-800">
                    {issue.issueType}
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <MapPin size={15} />
                      {issue.location}
                    </div>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${priorityStyles[issue.priority]}`}>
                      {issue.priority}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4">
                    <span className={`rounded-full px-3 py-1 text-xs font-semibold ${statusStyles[issue.status]}`}>
                      {issue.status}
                    </span>
                  </td>

                  <td className="whitespace-nowrap px-6 py-4 text-sm text-slate-500">
                    <div className="flex items-center gap-2">
                      <CalendarDays size={15} />
                      {issue.reportDate}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-sm text-slate-400">
                  No issues found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="border-t border-slate-100 px-6 py-4 text-xs text-slate-500">
        Showing {issues.length} issues
      </div>
    </div>
  );
}
