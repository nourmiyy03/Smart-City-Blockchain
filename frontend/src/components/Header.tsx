import { useState } from "react";
import { Bell, Wallet } from "lucide-react";
import { ethers } from "ethers";

interface HeaderProps {
  title: string;
  description: string;
}

export default function Header({
  title,
  description,
}: HeaderProps) {
  const [account, setAccount] = useState<string | null>(null);
  const [connecting, setConnecting] = useState(false);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed.");
        return;
      }

      setConnecting(true);

      const provider = new ethers.BrowserProvider(window.ethereum);

      const accounts = await provider.send("eth_requestAccounts", []);

      setAccount(accounts[0]);

    } catch (error) {
      console.error("Wallet connection failed:", error);
    } finally {
      setConnecting(false);
    }
  }

  function shortenAddress(address: string) {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  }

  return (
    <header className="flex items-center justify-between border-b border-slate-200 bg-white px-8 py-5">

      {/* Page information */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          {title}
        </h1>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>
      </div>

      {/* Header actions */}
      <div className="flex items-center gap-5">

        {/* Date */}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-700">
            {currentDate}
          </p>

          <p className="text-xs text-slate-400">
            Municipal Administration
          </p>
        </div>

        {/* Notifications */}
        <button
          className="relative rounded-lg border border-slate-200 p-2.5 text-slate-600 transition hover:bg-slate-50"
          aria-label="Notifications"
        >
          <Bell size={19} />

          <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500" />
        </button>

        {/* Wallet */}
        <button
          onClick={connectWallet}
          disabled={connecting}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Wallet size={17} />

          <span>
            {connecting
              ? "Connecting..."
              : account
                ? shortenAddress(account)
                : "Connect Wallet"}
          </span>
        </button>

      </div>
    </header>
  );
}