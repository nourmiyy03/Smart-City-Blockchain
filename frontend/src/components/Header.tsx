import { useEffect, useState } from "react";
import { Bell, Wallet, LogOut } from "lucide-react";
import { ethers } from "ethers";

interface HeaderProps {
  title: string;
  description: string;
  account: string | null;
  isAdmin: boolean;
  onDisconnect: () => void;
  onConnect: (address: string) => Promise<void>;
}

export default function Header({
  title,
  description,
  account,
  isAdmin,
  onDisconnect,
  onConnect,
}: HeaderProps) {
  const [connecting, setConnecting] = useState(false);

  const currentDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  useEffect(() => {
    if (!window.ethereum) return;

    const handleAccountsChanged = (accounts: string[]) => {
      console.log("MetaMask account changed:", accounts);
    };

    window.ethereum.on("accountsChanged", handleAccountsChanged);

    return () => {
      window.ethereum.removeListener(
        "accountsChanged",
        handleAccountsChanged
      );
    };
  }, []);

  async function connectWallet() {
    try {
      if (!window.ethereum) {
        alert("MetaMask is not installed.");
        return;
      }

      setConnecting(true);

      // Request account access explicitly
      await window.ethereum.request({
        method: "wallet_requestPermissions",
        params: [{ eth_accounts: {} }],
      });

      // Get the selected account
      const accounts = await window.ethereum.request({
        method: "eth_requestAccounts",
      });

      if (accounts.length > 0) {
        await onConnect(accounts[0]);
      }

    } catch (error: any) {
      if (error.code === 4001) {
        console.log("Wallet connection rejected by user.");
      } else {
        console.error("Wallet connection failed:", error);
      }
    } finally {
      setConnecting(false);
    }
  }

  function handleDisconnect() {
    onDisconnect();
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

        {/* Date and role */}
        <div className="hidden text-right sm:block">
          <p className="text-sm font-medium text-slate-700">
            {currentDate}
          </p>

          <p
            className={`mt-1 text-xs font-semibold ${
              !account
                ? "text-slate-400"
                : isAdmin
                  ? "text-blue-600"
                  : "text-emerald-600"
            }`}
          >
            {!account
              ? "Wallet Not Connected"
              : isAdmin
                ? "Municipal Administrator"
                : "Citizen Account"}
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

        {/* Wallet / Disconnect */}
        {account ? (
          <div className="flex items-center gap-2">

            {/* Connected account */}
            <div className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm">
              <Wallet size={17} />

              <span>
                {shortenAddress(account)}
              </span>
            </div>

            {/* Disconnect */}
            <button
              onClick={handleDisconnect}
              className="flex items-center justify-center rounded-lg border border-slate-200 px-3 py-2.5 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
              title="Disconnect wallet"
              aria-label="Disconnect wallet"
            >
              <LogOut size={17} />
            </button>

          </div>
        ) : (
          <button
            onClick={connectWallet}
            disabled={connecting}
            className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Wallet size={17} />

            <span>
              {connecting
                ? "Connecting..."
                : "Connect Wallet"}
            </span>
          </button>
        )}

      </div>
    </header>
  );
}