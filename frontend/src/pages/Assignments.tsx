
import { useState, type FormEvent } from "react";
import { ethers } from "ethers";
import {
  ClipboardList,
  MapPin,
  AlertTriangle,
  Users,
  Send,
} from "lucide-react";

import { getContract } from "../contract";
import type { Issue } from "../components/IssueTable";

interface AssignmentsProps {
  issues: Issue[];
  onAssigned: () => Promise<void>;
}

const teams = [
  "Road Maintenance Team",
  "Electrical Maintenance Team",
  "Water Services Team",
  "Waste Management Team",
  "Traffic Management Team",
];

export default function Assignments({
  issues,
  onAssigned,
}: AssignmentsProps) {
  const [selectedIssueId, setSelectedIssueId] = useState("");
  const [selectedTeam, setSelectedTeam] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Only issues waiting for assignment
  const pendingIssues = issues.filter(
    (issue) => issue.status === "Reported"
  );

  const selectedIssue = pendingIssues.find(
    (issue) => issue.issueId === selectedIssueId
  );

  async function handleAssignment(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedIssueId || !selectedTeam) {
      setError("Please select an issue and an intervention team.");
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

      const transaction = await contract.assignTeam(
        selectedIssueId,
        selectedTeam
      );

      await transaction.wait();

      setSuccess(
        `Issue ${selectedIssueId} was assigned to ${selectedTeam}.`
      );

      setSelectedIssueId("");
      setSelectedTeam("");

      // Reload the issues from the blockchain
      await onAssigned();

    } catch (err: any) {
      console.error("Team assignment failed:", err);
      setError(
        err.reason || err.shortMessage || err.message || "Assignment failed."
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-6">

      {/* Page introduction */}
      <section>
        <h2 className="text-xl font-bold text-slate-900">
          Team Assignments
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Assign municipal intervention teams to reported urban issues.
        </p>
      </section>

      {/* Pending issues summary */}
      <section className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-amber-50 p-3 text-amber-600">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Awaiting Assignment
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {pendingIssues.length}
              </p>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
              <Users size={22} />
            </div>
            <div>
              <p className="text-sm text-slate-500">
                Available Teams
              </p>
              <p className="text-2xl font-bold text-slate-900">
                {teams.length}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Assignment form */}
      <section className="max-w-3xl rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-6 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <ClipboardList size={22} />
          </div>
          <div>
            <h3 className="font-bold text-slate-900">
              New Team Assignment
            </h3>
            <p className="text-sm text-slate-500">
              Select an issue and assign an intervention team.
            </p>
          </div>
        </div>

        {pendingIssues.length === 0 ? (
          <div className="rounded-lg bg-slate-50 px-5 py-8 text-center">
            <ClipboardList
              size={32}
              className="mx-auto mb-3 text-slate-400"
            />
            <p className="font-medium text-slate-700">
              No pending issues
            </p>
            <p className="mt-1 text-sm text-slate-500">
              All reported issues have been assigned.
            </p>
          </div>
        ) : (
          <form onSubmit={handleAssignment} className="space-y-5">

            {/* Issue selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Select Urban Issue
              </label>

              <select
                required
                value={selectedIssueId}
                onChange={(e) => setSelectedIssueId(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Choose an issue</option>

                {pendingIssues.map((issue) => (
                  <option key={issue.issueId} value={issue.issueId}>
                    {issue.issueId} — {issue.issueType}
                  </option>
                ))}
              </select>
            </div>

            {/* Selected issue details */}
            {selectedIssue && (
              <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
                <p className="mb-3 text-sm font-semibold text-blue-900">
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
                    <strong>Priority:</strong> {selectedIssue.priority}
                  </p>

                  <p>
                    <strong>Status:</strong> {selectedIssue.status}
                  </p>
                </div>
              </div>
            )}

            {/* Team selection */}
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-700">
                Intervention Team
              </label>

              <select
                required
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
              >
                <option value="">Select an intervention team</option>

                {teams.map((team) => (
                  <option key={team} value={team}>
                    {team}
                  </option>
                ))}
              </select>
            </div>

            {/* Feedback */}
            {error && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
                {error}
              </div>
            )}

            {success && (
              <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-700">
                {success}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || !selectedIssueId || !selectedTeam}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <Send size={17} />
              {loading ? "Waiting for transaction..." : "Assign Team"}
            </button>

          </form>
        )}
      </section>

    </div>
  );
}
