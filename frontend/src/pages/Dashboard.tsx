import { useEffect, useState } from "react";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  ClipboardList,
} from "lucide-react";

import { ethers } from "ethers";

import Sidebar from "../components/Sidebar";
import Header from "../components/Header";
import StatCard from "../components/StatCard";
import IssueTable, { type Issue } from "../components/IssueTable";
import { getContract } from "../contract";
import CreateIssue from "../components/CreateIssue";
import AllIssues from "./AllIssues";
import Assignments from "./Assignments";



export default function Dashboard() {

  const [activePage, setActivePage] = useState("Dashboard");
  const [totalIssues, setTotalIssues] = useState(0);
  const [issues, setIssues] = useState<Issue[]>([]);


  async function loadBlockchainData() {
    try {
      if (!window.ethereum) {
        console.error("MetaMask is not installed.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);

      const contract = getContract(provider);

      // Get total number of issues
      const count = await contract.getIssueCount();

      setTotalIssues(Number(count));

      // Get all issues
      const blockchainIssues = await contract.getAllIssues();

      console.log("Blockchain issues:", blockchainIssues);

      const formattedIssues: Issue[] = blockchainIssues.map(
        (issue: any) => ({
          issueId: issue.issueId,
          issueType: issue.issueType,
          location: issue.location,
          priority: ["Low", "Medium", "High"][Number(issue.priority)],
          status: [
            "Reported",
            "Assigned",
            "InProgress",
            "Resolved",
            "Closed",
          ][Number(issue.status)],
          reportDate: new Date(
            Number(issue.reportDate) * 1000
          ).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
          }),
        })
      );

      setIssues(formattedIssues);

    } catch (error) {
      console.error("Failed to load blockchain data:", error);
    }
  }
  

  useEffect(() => {
    loadBlockchainData();
  }, []);
  

  const reportedIssues = issues.filter(
    (issue) => issue.status === "Reported"
  ).length;

  const inProgressIssues = issues.filter(
    (issue) => issue.status === "InProgress"
  ).length;

  const resolvedIssues = issues.filter(
    (issue) =>
      issue.status === "Resolved" || issue.status === "Closed"
  ).length;

  return (
    <div className="min-h-screen bg-slate-50">

      {/* Sidebar */}
      <Sidebar
        activePage={activePage}
        setActivePage={setActivePage}
      />

      {/* Main Content */}
      <main className="ml-64 min-h-screen">

        {/* Header */}
        <Header
          title={activePage}
          description="Monitor and manage urban services across your city."
        />

      <div className="space-y-8 p-8">

        {activePage === "Create Issue" ? (

          <CreateIssue
            onIssueCreated={async () => {
              await loadBlockchainData();
              setActivePage("Dashboard");
            }}
          />

        ) : activePage === "All Issues" ? (

          <AllIssues issues={issues} />

        ) : activePage === "Assignments" ? (

          <Assignments
            issues={issues}
            onAssigned={loadBlockchainData}
          />

        ) : (

          <>
            {/* Welcome Section */}
            <section>
              <h2 className="text-xl font-bold text-slate-900">
                Welcome to UrbanChain
              </h2>

              <p className="mt-1 text-sm text-slate-500">
                Here's what's happening with your city's urban services.
              </p>
            </section>

            {/* Statistics */}
            <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

              <StatCard
                title="Total Issues"
                value={totalIssues}
                icon={ClipboardList}
                color="#2563eb"
              />

              <StatCard
                title="Reported"
                value={reportedIssues}
                icon={AlertTriangle}
                color="#d97706"
              />

              <StatCard
                title="In Progress"
                value={inProgressIssues}
                icon={Clock}
                color="#7c3aed"
              />

              <StatCard
                title="Resolved"
                value={resolvedIssues}
                icon={CheckCircle2}
                color="#059669"
              />

            </section>

            {/* Recent Issues */}
            <section>
              <IssueTable issues={issues} />
            </section>
          </>

        )}

      </div>
      </main>
    </div>
  );
}
