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
import { getContract, getContractOwner } from "../contract";
import CreateIssue from "../components/CreateIssue";
import AllIssues from "./AllIssues";
import Assignments from "./Assignments";
import History from "./History";
import StatusManagement from "./StatusManagement";
import ImportData from "./ImportData";

export default function Dashboard() {
  const [activePage, setActivePage] = useState("Dashboard");
  const [totalIssues, setTotalIssues] = useState(0);
  const [issues, setIssues] = useState<Issue[]>([]);

  // User role information
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const [walletConnected, setWalletConnected] = useState(false);

  async function handleWalletConnected(address: string) {
    try {
      const currentAddress = ethers.getAddress(address);

      const provider = new ethers.BrowserProvider(window.ethereum);

      const ownerAddress = ethers.getAddress(
        await getContractOwner(provider)
      );

      setUserAddress(currentAddress);
      setIsAdmin(currentAddress === ownerAddress);
      setWalletConnected(true);

      console.log("Connected account:", currentAddress);
      console.log("Contract owner:", ownerAddress);
      console.log(
        "User role:",
        currentAddress === ownerAddress ? "Admin" : "Citizen"
      );

    } catch (error) {
      console.error("Failed to update wallet information:", error);
    }
  }

  async function loadBlockchainData() {
    try {
      if (!window.ethereum) {
        console.error("MetaMask is not installed.");
        return;
      }

      const provider = new ethers.BrowserProvider(window.ethereum);
      const contract = getContract(provider);

      const count = await contract.getIssueCount();
      setTotalIssues(Number(count));

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

  // Check whether the connected MetaMask account is the contract owner
  useEffect(() => {
    if (!window.ethereum) return;

    let isMounted = true;

    async function checkUserRole(accounts?: string[]) {
      try {
        const connectedAccounts: string[] =
          accounts ??
          (await window.ethereum.request({
            method: "eth_accounts",
          }));

        if (!isMounted) return;

        if (connectedAccounts.length === 0) {
          setWalletConnected(false);
          setUserAddress(null);
          setIsAdmin(false);
          return;
        }

        setWalletConnected(true);

        const provider = new ethers.BrowserProvider(window.ethereum);

        const currentAddress = ethers.getAddress(connectedAccounts[0]);
        const ownerAddress = ethers.getAddress(
          await getContractOwner(provider)
        );

        if (!isMounted) return;

        setUserAddress(currentAddress);
        setIsAdmin(currentAddress === ownerAddress);

        console.log("Connected account:", currentAddress);
        console.log("Contract owner:", ownerAddress);
        console.log(
          "User role:",
          currentAddress === ownerAddress ? "Admin" : "Citizen"
        );
      } catch (error) {
        console.error("Failed to check user role:", error);
        if (isMounted) {
          setUserAddress(null);
          setIsAdmin(false);
        }
      }
    }

    // Check the currently connected account
    checkUserRole();

    // Recheck the role when the MetaMask account changes
    const handleAccountsChanged = (accounts: string[]) => {
      checkUserRole(accounts);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      isMounted = false;
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  useEffect(() => {
    loadBlockchainData();
  }, []);

  // Redirect citizens away from administrative pages
  useEffect(() => {
    const adminPages = [
      "Assignments",
      "Status Management",
      "Import Data",
    ];

    if (!isAdmin && adminPages.includes(activePage)) {
      setActivePage("Dashboard");
    }
  }, [isAdmin, activePage]);

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
        isAdmin={isAdmin}
      />

      {/* Main Content */}
      <main className="ml-64 min-h-screen">

        {/* Header */}
        <Header
          title={activePage}
          description=""
          account={userAddress}
          isAdmin={isAdmin}
          onConnect={handleWalletConnected}
          onDisconnect={() => {
            setUserAddress(null);
            setIsAdmin(false);
            setWalletConnected(false);
            setActivePage("Dashboard");
          }}
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

          ) : activePage === "Assignments" && isAdmin ? (

            <Assignments
              issues={issues}
              onAssigned={loadBlockchainData}
            />

          ) : activePage === "History" ? (

            <History issues={issues} />

          ) : activePage === "Status Management" && isAdmin ? (

            <StatusManagement
              issues={issues}
              onStatusUpdated={loadBlockchainData}
            />

          ) : activePage === "Import Data" && isAdmin ? (

            <ImportData onImportCompleted={loadBlockchainData} />

          ) : (

            <>
              {/* Welcome Section */}
              <section>
                <div>
                <h2 className="text-xl font-bold text-slate-900">
                  Welcome to UrbanChain
                </h2>

                <p className="mt-1 text-sm text-slate-500">
                  Here's what's happening with your city's urban services.
                </p>

                <p className="mt-2 text-xs text-slate-500">
                  Connected account: {userAddress || "Not connected"}

                </p>
                <p className="mt-2 text-xs text-slate-500">Role: {isAdmin ? "Administrator" : "Citizen"}</p>
              </div>


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
