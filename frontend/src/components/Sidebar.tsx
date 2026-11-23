import {
  LayoutDashboard,
  AlertTriangle,
  ClipboardList,
  History,
  FileSpreadsheet,
  Settings,
  Building2,
  PlusCircle,
} from "lucide-react";

interface SidebarProps {
  activePage: string;
  setActivePage: (page: string) => void;
}

const navigation = [
  {
    title: "OVERVIEW",
    items: [
      { label: "Dashboard", icon: LayoutDashboard },
    ],
  },
  {
    title: "MANAGEMENT",
    items: [
      { label: "Create Issue", icon: PlusCircle },
      { label: "All Issues", icon: AlertTriangle },
      { label: "Assignments", icon: ClipboardList },
      { label: "History", icon: History },
      { label: "Import Data", icon: FileSpreadsheet },
    ],
  },
];

export default function Sidebar({
  activePage,
  setActivePage,
}: SidebarProps) {
  return (
    <aside className="fixed left-0 top-0 flex h-screen w-64 flex-col bg-slate-950 text-white">

      {/* Logo */}
      <div className="flex h-20 items-center gap-3 border-b border-slate-800 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-600">
          <Building2 size={22} />
        </div>

        <div>
          <h1 className="text-lg font-bold tracking-wide">
            UrbanChain
          </h1>
          <p className="text-xs text-slate-400">
            Smart City Platform
          </p>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-8 px-4 py-8">
        {navigation.map((section) => (
          <div key={section.title}>
            <p className="mb-3 px-3 text-xs font-semibold tracking-widest text-slate-500">
              {section.title}
            </p>

            <div className="space-y-1">
              {section.items.map((item) => {
                const Icon = item.icon;
                const isActive = activePage === item.label;

                return (
                  <button
                    key={item.label}
                    onClick={() => setActivePage(item.label)}
                    className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
                      isActive
                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/30"
                        : "text-slate-400 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <Icon size={19} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Bottom settings */}
      <div className="border-t border-slate-800 p-4">
        <button
          onClick={() => setActivePage("Settings")}
          className={`flex w-full items-center gap-3 rounded-lg px-3 py-3 text-sm transition-colors ${
            activePage === "Settings"
              ? "bg-blue-600 text-white"
              : "text-slate-400 hover:bg-slate-800 hover:text-white"
          }`}
        >
          <Settings size={19} />
          <span>Settings</span>
        </button>

        <p className="mt-4 px-3 text-xs text-slate-600">
          UrbanChain © 2026
        </p>
      </div>
    </aside>
  );
}
