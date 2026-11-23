
import { useEffect, useState } from "react";
import { ethers } from "ethers";
import {
  History as HistoryIcon,
  MapPin,
  Clock,
  User,
  ClipboardList,
  Users,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  CircleDot,
} from "lucide-react";

import { getContract } from "../contract";
import type { Issue } from "../components/IssueTable";

interface HistoryProps {
  issues: Issue[];
}

interface HistoryEntry {
  timestamp: bigint;
  status: number;
  action: string;
  comment: string;
  assignedTo: string;
  actor: string;
}

const statusLabels = [
  "Reported",
  "Assigned",
  "InProgress",
  "Resolved",
  "Closed",
];

function getStatusColor(status: string) {
  switch (status) {
    case "Reported":
      return "bg-amber-100 text-amber-700";
    case "Assigned":
      return "bg-blue-100 text-blue-700";
    case "InProgress":
      return "bg-indigo-100 text-indigo-700";
    case "Resolved":
      return "bg-emerald-100 text-emerald-700";
    case "Closed":
      return "bg-slate-200 text-slate-700";
    default:
      return "bg-slate-100 text-slate-600";
  }
}

function formatDate(timestamp: bigint) {
  return new Date(Number(timestamp) * 1000).toLocaleString("en-US", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function History({ issues }: HistoryProps) {
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [historyEntries, setHistoryEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selectedIssue = issues.find(
    (issue) => issue.issueId === selectedIssueId
  );

  async function loadHistory(issueId: string) {
    if (!issueId) {
      setHistoryEntries([]);
      return;
    }

    try {
      setLoading(true);
      setError("");
      setHistoryEntries([]);

      if (!window.ethereum) {
        throw new Error("Please install MetaMask.");
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = getContract(provider);

      const blockchainHistory = await contract.getHistory(issueId);

      const formattedHistory: HistoryEntry[] = blockchainHistory.map(
        (entry: any) => ({
          timestamp: entry.timestamp,
          status: Number(entry.status),
          action: entry.action,
          comment: entry.comment,
          assignedTo: entry.assignedTo,
          actor: entry.actor,
        })
      );

      // Display the most recent action first
      setHistoryEntries(formattedHistory.reverse());
    } catch (err: any) {
      console.error("Failed to load issue history:", err);
      setError(
        err.reason ||
          err.shortMessage ||
          err.message ||
          "Failed to load history."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedIssueId) {
      loadHistory(selectedIssueId);
    } else {
      setHistoryEntries([]);
      setError("");
    }
  }, [selectedIssueId]);

  return (
    <div className="space-y-6">
      {/* Page introduction */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">
          Issue History
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Track every action performed on an urban issue, recorded on the
          blockchain.
        </p>
      </section>

      {/* Issue selection */}
      <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <ClipboardList size={22} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              Select an Urban Issue
            </h3>
            <p className="text-sm text-slate-500">
              Choose an issue to view its complete history.
            </p>
          </div>
        </div>

        <select
          value={selectedIssueId}
          onChange={(e) => setSelectedIssueId(e.target.value)}
          className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
        >
          <option value="">Choose an issue</option>

          {issues.map((issue) => (
            <option key={issue.issueId} value={issue.issueId}>
              {issue.issueId} — {issue.issueType}
            </option>
          ))}
        </select>

        {selectedIssue && (
          <div className="mt-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-start gap-3">
              <MapPin size={18} className="mt-1 text-blue-600" />

              <div>
                <p className="font-semibold text-blue-900">
                  {selectedIssue.issueType}
                </p>
                <p className="mt-1 text-sm text-slate-600">
                  {selectedIssue.location}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  Issue ID: {selectedIssue.issueId}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Loading */}
      {loading && (
        <div className="flex items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white p-8 text-slate-600">
          <RefreshCw size={20} className="animate-spin" />
          Loading blockchain history...
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={20} className="shrink-0" />
          <p>{error}</p>
        </div>
      )}

      {/* No issue selected */}
      {!selectedIssueId && !loading && (
        <div className="rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <HistoryIcon size={38} className="mx-auto mb-3 text-slate-400" />
          <h3 className="font-semibold text-slate-800">
            No issue selected
          </h3>
          <p className="mt-1 text-sm text-slate-500">
            Select an urban issue above to explore its history.
          </p>
        </div>
      )}

      {/* History timeline */}
      {selectedIssueId && !loading && !error && (
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h3 className="font-bold text-slate-900">
                Activity Timeline
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                {historyEntries.length} recorded action(s)
              </p>
            </div>

            <button
              type="button"
              onClick={() => loadHistory(selectedIssueId)}
              className="flex items-center gap-2 rounded-lg border border-slate-300 px-3 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50"
            >
              <RefreshCw size={15} />
              Refresh
            </button>
          </div>

          {historyEntries.length === 0 ? (
            <div className="py-8 text-center">
              <HistoryIcon
                size={32}
                className="mx-auto mb-3 text-slate-400"
              />
              <p className="font-medium text-slate-700">
                No history available
              </p>
              <p className="mt-1 text-sm text-slate-500">
                No actions have been recorded for this issue.
              </p>
            </div>
          ) : (
            <div className="relative space-y-6">
              {historyEntries.map((entry, index) => {
                const status = statusLabels[entry.status] ?? "Unknown";
                const isLast = index === historyEntries.length - 1;

                return (
                  <div
                    key={`${entry.timestamp.toString()}-${index}`}
                    className="relative flex gap-4"
                  >
                    {/* Timeline line and icon */}
                    <div className="relative flex flex-col items-center">
                      <div className="z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-blue-50 text-blue-600">
                        {entry.action === "CREATED" ? (
                          <ClipboardList size={18} />
                        ) : entry.action === "TEAM_ASSIGNED" ? (
                          <Users size={18} />
                        ) : (
                          <CircleDot size={18} />
                        )}
                      </div>

                      {!isLast && (
                        <div className="absolute top-10 h-full w-0.5 bg-slate-200" />
                      )}
                    </div>

                    {/* Entry details */}
                    <div className="min-w-0 flex-1 pb-5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <h4 className="font-semibold text-slate-900">
                          {entry.action.replaceAll("_", " ")}
                        </h4>

                        <span
                          className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(status)}`}
                        >
                          {status}
                        </span>
                      </div>

                      <p className="mt-2 text-sm text-slate-600">
                        {entry.comment || "No comment provided."}
                      </p>

                      <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-slate-500">
                        <span className="flex items-center gap-1.5">
                          <Clock size={14} />
                          {formatDate(entry.timestamp)}
                        </span>

                        {entry.assignedTo && (
                          <span className="flex items-center gap-1.5">
                            <Users size={14} />
                            {entry.assignedTo}
                          </span>
                        )}
                      </div>

                      <div className="mt-3 flex items-center gap-2 rounded-lg bg-slate-50 p-3">
                        <User size={15} className="shrink-0 text-slate-400" />
                        <div className="min-w-0">
                          <p className="text-xs text-slate-500">
                            Action performed by
                          </p>
                          <p
                            className="truncate font-mono text-xs text-slate-700"
                            title={entry.actor}
                          >
                            {entry.actor}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* Blockchain information */}
      <div className="flex items-center gap-2 text-xs text-slate-500">
        <CheckCircle2 size={15} className="text-emerald-600" />
        History retrieved directly from the UrbanIssueRegistry smart contract.
      </div>
    </div>
  );
}
