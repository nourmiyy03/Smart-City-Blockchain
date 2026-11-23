
import { useState } from "react";
import { ethers } from "ethers";
import {
  RefreshCw,
  ClipboardList,
  MapPin,
  AlertCircle,
  CheckCircle2,
  Send,
  Clock,
} from "lucide-react";

import { getContract } from "../contract";
import type { Issue } from "../components/IssueTable";

interface StatusManagementProps {
  issues: Issue[];
  onStatusUpdated: () => Promise<void>;
}

const statusLabels = [
  "Reported",
  "Assigned",
  "InProgress",
  "Resolved",
  "Closed",
];

const nextStatuses: Record<string, string> = {
  Assigned: "InProgress",
  InProgress: "Resolved",
  Resolved: "Closed",
};

const statusDescriptions: Record<string, string> = {
  InProgress: "The intervention team has started working on the issue.",
  Resolved: "The reported urban issue has been resolved.",
  Closed: "The issue has been officially closed.",
};

function getStatusUpdateError(err: any): string {
  const errorData = JSON.stringify(err, Object.getOwnPropertyNames(err));

  if (
    errorData.includes("OwnableUnauthorizedAccount") ||
    errorData.includes("0x118cdaa7")
  ) {
    return "Access denied: Only the municipal administrator can update issue statuses.";
  }

  if (err.code === "ACTION_REJECTED") {
    return "Transaction rejected by the user.";
  }

  return (
    err.reason ||
    err.shortMessage ||
    err.message ||
    "Status update failed."
  );
}

export default function StatusManagement({
  issues,
  onStatusUpdated,
}: StatusManagementProps) {
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedIssue = issues.find(
    (issue) => issue.issueId === selectedIssueId
  );

  const nextStatus = selectedIssue
    ? nextStatuses[selectedIssue.status]
    : undefined;

  const manageableIssues = issues.filter(
    (issue) => nextStatuses[issue.status]
  );

  async function handleStatusUpdate(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedIssue || !nextStatus) {
      setError("Please select an issue with an updatable status.");
      return;
    }

    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask.");
      }

      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      const contract = getContract(signer);

      // Convert the status name to its Solidity enum index
      const statusIndex = statusLabels.indexOf(nextStatus);

      const transaction = await contract.updateStatus(
        selectedIssueId,
        statusIndex,
        comment
      );

      await transaction.wait();

      setSuccess(
        `${selectedIssueId} status successfully updated to ${nextStatus}.`
      );

      setSelectedIssueId("");
      setComment("");

      // Refresh the issues from the blockchain
      await onStatusUpdated();
    } catch (err: any) {
      console.error("Status update failed:", err);

      setError(getStatusUpdateError(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Page introduction */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">
          Status Management
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Track and update the progress of municipal interventions.
        </p>
      </section>

      {/* Statistics */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Assigned</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {issues.filter((issue) => issue.status === "Assigned").length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">In Progress</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {issues.filter((issue) => issue.status === "InProgress").length}
          </p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Resolved / Closed</p>
          <p className="mt-2 text-2xl font-bold text-slate-900">
            {issues.filter(
              (issue) =>
                issue.status === "Resolved" || issue.status === "Closed"
            ).length}
          </p>
        </div>
      </section>

      {/* Status update form */}
      <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <RefreshCw size={22} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              Update Issue Status
            </h3>

            <p className="text-sm text-slate-500">
              Select an issue and advance it to the next stage.
            </p>
          </div>
        </div>

        {manageableIssues.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-5 py-8 text-center">
            <ClipboardList
              size={32}
              className="mx-auto mb-3 text-slate-400"
            />

            <p className="font-medium text-slate-700">
              No issues available for status updates
            </p>

            <p className="mt-1 text-sm text-slate-500">
              Assign a team first, then you can update its progress.
            </p>
          </div>
        ) : (
          <form onSubmit={handleStatusUpdate} className="space-y-5">
            {/* Issue selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Urban Issue
              </label>

              <select
                required
                value={selectedIssueId}
                onChange={(e) => {
                  setSelectedIssueId(e.target.value);
                  setError("");
                  setSuccess("");
                }}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Choose an issue</option>

                {manageableIssues.map((issue) => (
                  <option key={issue.issueId} value={issue.issueId}>
                    {issue.issueId} — {issue.issueType} ({issue.status})
                  </option>
                ))}
              </select>
            </div>

            {/* Selected issue details */}
            {selectedIssue && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="mb-3 font-semibold text-blue-900">
                  Selected Issue Details
                </p>

                <div className="space-y-2 text-sm text-slate-700">
                  <p>
                    <strong>Type:</strong> {selectedIssue.issueType}
                  </p>

                  <p className="flex items-center gap-2">
                    <MapPin size={15} />
                    {selectedIssue.location}
                  </p>

                  <p>
                    <strong>Current Status:</strong>{" "}
                    {selectedIssue.status}
                  </p>

                  <p>
                    <strong>Next Status:</strong>{" "}
                    {nextStatus}
                  </p>
                </div>
              </div>
            )}

            {/* Next status preview */}
            {nextStatus && (
              <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
                <div className="flex items-center gap-2 text-emerald-800">
                  <CheckCircle2 size={18} />

                  <p className="font-semibold">
                    Next stage: {nextStatus}
                  </p>
                </div>

                <p className="mt-2 text-sm text-emerald-700">
                  {statusDescriptions[nextStatus]}
                </p>
              </div>
            )}

            {/* Comment */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Action Comment
              </label>

              <textarea
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                placeholder="Describe the intervention or provide an update..."
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              />
            </div>

            {/* Feedback */}
            {error && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-700">
                <AlertCircle size={18} className="shrink-0" />
                {error}
              </div>
            )}

            {success && (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                <CheckCircle2 size={18} className="shrink-0" />
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !selectedIssueId || !nextStatus}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />
              {loading
                ? "Waiting for transaction..."
                : "Update Issue Status"}
            </button>
          </form>
        )}
      </section>

      <div className="flex items-center gap-2 text-xs text-slate-500">
        <Clock size={15} />
        Every successful status update is recorded in the blockchain history.
      </div>
    </div>
  );
}
