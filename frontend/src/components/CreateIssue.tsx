
import { useState } from "react";
import { ethers } from "ethers";
import { getContract } from "../contract";
import { AlertTriangle, Send } from "lucide-react";

interface CreateIssueProps {
  onIssueCreated: () => void;
}

export default function CreateIssue({
  onIssueCreated,
}: CreateIssueProps) {

  const [issueType, setIssueType] = useState("");
  const [location, setLocation] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("1");
  const [reportedBy, setReportedBy] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [customIssueType, setCustomIssueType] = useState("");

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");

    try {
      if (!window.ethereum) {
        throw new Error("Please install MetaMask.");
      }

      setLoading(true);

      const provider = new ethers.BrowserProvider(window.ethereum);

      const signer = await provider.getSigner();

      const contract = getContract(signer);

      const issueId = `ISSUE-${Date.now()}`;

      const finalIssueType =
        issueType === "Other" ? customIssueType.trim() : issueType;

      if (!finalIssueType) {
        setError("Please specify the issue type.");
        return;
      }

      const transaction = await contract.createIssue(
        issueId,
        finalIssueType,
        location,
        description,
        Number(priority),
        reportedBy
        );

      await transaction.wait();

      setCustomIssueType("");

      alert(`Issue created successfully! ID: ${issueId}`);

      setIssueType("");
      setLocation("");
      setDescription("");
      setPriority("1");
      setReportedBy("");

      onIssueCreated();

    } catch (err: any) {
      console.error("Issue creation failed:", err);
      setError(err.reason || err.message || "Transaction failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-8 shadow-sm">

      <div className="mb-8">
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600">
          <AlertTriangle size={24} />
        </div>

        <h2 className="text-xl font-bold text-slate-900">
          Report an Urban Issue
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Submit a new issue to the municipal administration.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Issue Type
          </label>

          <select
            required
            value={issueType}
            onChange={(e) => setIssueType(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="">Select issue type</option>
            <option value="Road Damage">Road Damage</option>
            <option value="Broken Streetlight">Broken Streetlight</option>
            <option value="Water Leakage">Water Leakage</option>
            <option value="Garbage Collection">Garbage Collection</option>
            <option value="Damaged Traffic Signal">Damaged Traffic Signal</option>
            <option value="Other">Other</option>
            
          </select>

          {issueType === "Other" && (
                <div>
                    <label className="mb-2 block text-sm font-medium text-slate-700">
                    Specify Issue Type
                    </label>
                    <input
                    type="text"
                    value={customIssueType}
                    onChange={(e) => setCustomIssueType(e.target.value)}
                    placeholder="Enter the type of urban issue..."
                    required
                    className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none transition focus:border-blue-500"
                    />
                </div>
                )}


        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Location
          </label>

          <input
            required
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Iberia, Tangier"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Description
          </label>

          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the urban issue..."
            className="w-full resize-none rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Priority
          </label>

          <select
            value={priority}
            onChange={(e) => setPriority(e.target.value)}
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          >
            <option value="0">Low</option>
            <option value="1">Medium</option>
            <option value="2">High</option>
          </select>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-slate-700">
            Reported By
          </label>

          <input
            required
            value={reportedBy}
            onChange={(e) => setReportedBy(e.target.value)}
            placeholder="Citizen name or identifier"
            className="w-full rounded-lg border border-slate-300 px-4 py-3 text-sm outline-none focus:border-blue-500"
          />
        </div>

        {error && (
          <div className="rounded-lg bg-red-50 p-4 text-sm text-red-700">
            {error}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Send size={17} />
          {loading ? "Waiting for transaction..." : "Submit Issue"}
        </button>

      </form>
    </div>
  );
}
