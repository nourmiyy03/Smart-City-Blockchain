
import { useState } from "react";
import { Search, SlidersHorizontal } from "lucide-react";
import IssueTable, { type Issue } from "../components/IssueTable";

interface AllIssuesProps {
  issues: Issue[];
}

export default function AllIssues({ issues }: AllIssuesProps) {
  const [search, setSearch] = useState("");
  const [priority, setPriority] = useState("All");
  const [status, setStatus] = useState("All");

  const filteredIssues = issues.filter((issue) => {
    const searchTerm = search.toLowerCase();

    const matchesSearch =
      issue.issueId.toLowerCase().includes(searchTerm) ||
      issue.issueType.toLowerCase().includes(searchTerm) ||
      issue.location.toLowerCase().includes(searchTerm);

    const matchesPriority =
      priority === "All" || issue.priority === priority;

    const matchesStatus =
      status === "All" || issue.status === status;

    return matchesSearch && matchesPriority && matchesStatus;
  });

  return (
    <div className="space-y-6">

      {/* Page introduction */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">
          All Urban Issues
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Search, filter and consult all reported urban issues.
        </p>
      </section>

      {/* Search and filters */}
      <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">

          {/* Search */}
          <div className="relative">
            <Search
              size={18}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by ID, type or location..."
              className="w-full rounded-lg border border-slate-300 py-3 pl-10 pr-4 text-sm outline-none focus:border-blue-500"
            />
          </div>

          {/* Priority filter */}
          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
          </select>

          {/* Status filter */}
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="All">All statuses</option>
            <option value="Reported">Reported</option>
            <option value="Assigned">Assigned</option>
            <option value="InProgress">In Progress</option>
            <option value="Resolved">Resolved</option>
            <option value="Closed">Closed</option>
          </select>

        </div>

        <div className="mt-4 flex items-center justify-between">
          <p className="text-sm text-slate-500">
            <SlidersHorizontal size={15} className="mr-2 inline" />
            {filteredIssues.length} of {issues.length} issues displayed
          </p>

          <button
            onClick={() => {
              setSearch("");
              setPriority("All");
              setStatus("All");
            }}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Reset filters
          </button>
        </div>
      </section>

      {/* Results */}
      <IssueTable
        issues={filteredIssues}
        title="Issue Registry"
        description="All issues registered on the blockchain"
      />

    </div>
  );
}
