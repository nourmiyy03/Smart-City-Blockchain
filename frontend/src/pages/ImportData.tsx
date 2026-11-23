
import { useState } from "react";
import { ethers } from "ethers";
import * as XLSX from "xlsx";
import {
  Upload,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Trash2,
  Send,
  RefreshCw,
  Check,
  X,
} from "lucide-react";

import { getContract } from "../contract";

interface ImportIssue {
  rowNumber: number;
  issueType: string;
  location: string;
  description: string;
  priority: "Low" | "Medium" | "High";
  reportedBy: string;
  selected: boolean;
  errors: string[];
}

interface ImportDataProps {
  onImportCompleted: () => Promise<void>;
}

const requiredColumns = [
  "issueType",
  "location",
  "description",
  "priority",
  "reportedBy",
];

function normalizePriority(value: string): "Low" | "Medium" | "High" | null {
  const normalized = value.trim().toLowerCase();

  if (normalized === "low") return "Low";
  if (normalized === "medium") return "Medium";
  if (normalized === "high") return "High";

  return null;
}

export default function ImportData({
  onImportCompleted,
}: ImportDataProps) {
  const [fileName, setFileName] = useState("");
  const [importIssues, setImportIssues] = useState<ImportIssue[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [currentImport, setCurrentImport] = useState(0);

  const validIssues = importIssues.filter(
    (issue) => issue.errors.length === 0
  );

  const selectedIssues = validIssues.filter(
    (issue) => issue.selected
  );

  const invalidIssues = importIssues.filter(
    (issue) => issue.errors.length > 0
  );

  async function handleFileUpload(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];

    if (!file) return;

    setError("");
    setSuccess("");
    setImportIssues([]);
    setFileName(file.name);

    try {
      const data = await file.arrayBuffer();

      const workbook = XLSX.read(data, { type: "array" });
      const firstSheetName = workbook.SheetNames[0];

      if (!firstSheetName) {
        throw new Error("The Excel file contains no worksheet.");
      }

      const worksheet = workbook.Sheets[firstSheetName];

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(
        worksheet,
        { defval: "" }
      );

      if (rows.length === 0) {
        throw new Error("The selected file contains no data.");
      }

      const actualColumns = Object.keys(rows[0]).map((column) =>
        column.trim()
      );

      const missingColumns = requiredColumns.filter(
        (column) => !actualColumns.includes(column)
      );

      if (missingColumns.length > 0) {
        throw new Error(
          `Missing required columns: ${missingColumns.join(", ")}`
        );
      }

      const formattedIssues: ImportIssue[] = rows.map((row, index) => {
        const issueType = String(row.issueType ?? "").trim();
        const location = String(row.location ?? "").trim();
        const description = String(row.description ?? "").trim();
        const priorityValue = String(row.priority ?? "");
        const reportedBy = String(row.reportedBy ?? "").trim();

        const normalizedPriority = normalizePriority(priorityValue);

        const errors: string[] = [];

        if (!issueType) errors.push("Issue type is required.");
        if (!location) errors.push("Location is required.");
        if (!description) errors.push("Description is required.");
        if (!reportedBy) errors.push("Reporter is required.");

        if (!normalizedPriority) {
          errors.push("Priority must be Low, Medium, or High.");
        }

        return {
          rowNumber: index + 2,
          issueType,
          location,
          description,
          priority: normalizedPriority ?? "Low",
          reportedBy,
          selected: errors.length === 0,
          errors,
        };
      });

      setImportIssues(formattedIssues);
    } catch (err: any) {
      console.error("File reading failed:", err);
      setError(err.message || "Failed to read the selected file.");
      setFileName("");
    }

    // Allow selecting the same file again
    event.target.value = "";
  }

  function toggleIssueSelection(rowNumber: number) {
    setImportIssues((previous) =>
      previous.map((issue) =>
        issue.rowNumber === rowNumber && issue.errors.length === 0
          ? { ...issue, selected: !issue.selected }
          : issue
      )
    );
  }

  function toggleAllSelection(checked: boolean) {
    setImportIssues((previous) =>
      previous.map((issue) =>
        issue.errors.length === 0
          ? { ...issue, selected: checked }
          : issue
      )
    );
  }

  function removeFile() {
    setFileName("");
    setImportIssues([]);
    setError("");
    setSuccess("");
    setCurrentImport(0);
  }

  async function handleImport() {
    setError("");
    setSuccess("");

    if (selectedIssues.length === 0) {
      setError("Please select at least one valid issue to import.");
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

      let importedCount = 0;

      for (let i = 0; i < selectedIssues.length; i++) {
        const issue = selectedIssues[i];

        setCurrentImport(i + 1);

        // Convert priority name to Solidity enum index
        const priorityIndex = {
          Low: 0,
          Medium: 1,
          High: 2,
        }[issue.priority];

        // Generate a unique issue ID
        const issueId = `ISSUE-${Date.now()}-${i + 1}`;

        const transaction = await contract.createIssue(
          issueId,
          issue.issueType,
          issue.location,
          issue.description,
          priorityIndex,
          issue.reportedBy
        );

        await transaction.wait();

        importedCount++;
      }

      setSuccess(
        `Successfully imported ${importedCount} issue(s) to the blockchain.`
      );

      setImportIssues([]);
      setFileName("");
      setCurrentImport(0);

      await onImportCompleted();
    } catch (err: any) {
      console.error("Import failed:", err);

      setError(
        err.reason ||
          err.shortMessage ||
          err.message ||
          "Import failed."
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
          Import Urban Issues
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          Import multiple urban issues from Excel or CSV files directly
          into the blockchain registry.
        </p>
      </section>

      {/* File upload */}
      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="mb-5 flex items-center gap-3">
          <div className="rounded-lg bg-blue-50 p-3 text-blue-600">
            <FileSpreadsheet size={22} />
          </div>

          <div>
            <h3 className="font-bold text-slate-900">
              Upload Spreadsheet
            </h3>

            <p className="text-sm text-slate-500">
              Select an Excel or CSV file containing urban issues.
            </p>
          </div>
        </div>

        {!fileName ? (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-slate-50 px-6 py-12 transition hover:border-blue-400 hover:bg-blue-50">
            <Upload size={36} className="mb-4 text-slate-400" />

            <p className="font-semibold text-slate-700">
              Click to upload your file
            </p>

            <p className="mt-2 text-sm text-slate-500">
              Excel (.xlsx, .xls) or CSV (.csv)
            </p>

            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleFileUpload}
              className="hidden"
            />
          </label>
        ) : (
          <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-blue-100 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <FileSpreadsheet className="text-blue-600" size={28} />

              <div>
                <p className="font-medium text-slate-800">
                  {fileName}
                </p>

                <p className="text-xs text-slate-500">
                  {importIssues.length} row(s) detected
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={removeFile}
              disabled={loading}
              className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-red-600 transition hover:bg-red-50 disabled:opacity-50"
            >
              <Trash2 size={16} />
              Remove file
            </button>
          </div>
        )}
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          <AlertCircle size={18} className="shrink-0" />
          {error}
        </div>
      )}

      {/* Success */}
      {success && (
        <div className="flex items-start gap-2 rounded-lg border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">
          <CheckCircle2 size={18} className="shrink-0" />
          {success}
        </div>
      )}

      {/* Import statistics */}
      {importIssues.length > 0 && (
        <>
          <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Total Rows</p>
              <p className="mt-2 text-2xl font-bold text-slate-900">
                {importIssues.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Valid Rows</p>
              <p className="mt-2 text-2xl font-bold text-emerald-600">
                {validIssues.length}
              </p>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
              <p className="text-sm text-slate-500">Invalid Rows</p>
              <p className="mt-2 text-2xl font-bold text-red-600">
                {invalidIssues.length}
              </p>
            </div>
          </section>

          {/* Preview table */}
          <section className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">
            <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 p-5">
              <div>
                <h3 className="font-bold text-slate-900">
                  Data Preview
                </h3>

                <p className="mt-1 text-sm text-slate-500">
                  Review the imported rows before registering them.
                </p>
              </div>

              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CheckCircle2 size={16} className="text-emerald-600" />
                {selectedIssues.length} selected
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-xs uppercase text-slate-500">
                  <tr>
                    <th className="px-4 py-4">
                      <input
                        type="checkbox"
                        checked={
                          validIssues.length > 0 &&
                          selectedIssues.length === validIssues.length
                        }
                        onChange={(e) =>
                          toggleAllSelection(e.target.checked)
                        }
                        disabled={loading || validIssues.length === 0}
                        aria-label="Select all valid rows"
                      />
                    </th>

                    <th className="px-4 py-4">Row</th>
                    <th className="px-4 py-4">Issue Type</th>
                    <th className="px-4 py-4">Location</th>
                    <th className="px-4 py-4">Description</th>
                    <th className="px-4 py-4">Priority</th>
                    <th className="px-4 py-4">Reporter</th>
                    <th className="px-4 py-4">Validation</th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-slate-100">
                  {importIssues.map((issue) => {
                    const isValid = issue.errors.length === 0;

                    return (
                      <tr
                        key={issue.rowNumber}
                        className={
                          isValid
                            ? "hover:bg-slate-50"
                            : "bg-red-50/50"
                        }
                      >
                        <td className="px-4 py-4">
                          <input
                            type="checkbox"
                            checked={issue.selected}
                            onChange={() =>
                              toggleIssueSelection(issue.rowNumber)
                            }
                            disabled={!isValid || loading}
                            aria-label={`Select row ${issue.rowNumber}`}
                          />
                        </td>

                        <td className="px-4 py-4 text-slate-500">
                          {issue.rowNumber}
                        </td>

                        <td className="px-4 py-4 font-medium text-slate-800">
                          {issue.issueType || "—"}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {issue.location || "—"}
                        </td>

                        <td className="max-w-xs px-4 py-4 text-slate-600">
                          {issue.description || "—"}
                        </td>

                        <td className="px-4 py-4">
                          {issue.priority}
                        </td>

                        <td className="px-4 py-4 text-slate-600">
                          {issue.reportedBy || "—"}
                        </td>

                        <td className="px-4 py-4">
                          {isValid ? (
                            <span className="flex items-center gap-1 text-xs font-medium text-emerald-600">
                              <Check size={14} />
                              Valid
                            </span>
                          ) : (
                            <div className="min-w-40">
                              <span className="flex items-center gap-1 text-xs font-medium text-red-600">
                                <X size={14} />
                                Invalid
                              </span>

                              <ul className="mt-1 list-inside list-disc text-xs text-red-600">
                                {issue.errors.map((message, index) => (
                                  <li key={index}>{message}</li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Import action */}
          <section className="flex flex-wrap items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <div>
              <p className="font-semibold text-slate-900">
                Ready to import?
              </p>

              <p className="mt-1 text-sm text-slate-500">
                {selectedIssues.length} valid issue(s) selected for
                blockchain registration.
              </p>
            </div>

            <button
              type="button"
              onClick={handleImport}
              disabled={loading || selectedIssues.length === 0}
              className="flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <RefreshCw size={17} className="animate-spin" />
                  Importing {currentImport}/{selectedIssues.length}...
                </>
              ) : (
                <>
                  <Send size={17} />
                  Import Selected Issues
                </>
              )}
            </button>
          </section>
        </>
      )}
    </div>
  );
}
