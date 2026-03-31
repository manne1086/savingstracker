import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  ArrowDownToLine,
  BarChart3,
  History,
  LayoutDashboard,
  PieChart,
  Settings2,
  ShieldCheck,
  Trophy,
} from "lucide-react";

const navItems = [
  { path: "/vault", label: "Dashboard", icon: LayoutDashboard },
  { path: "/vault/deposit", label: "Deposit", icon: ArrowDownToLine },
  { path: "/vault/activity-history", label: "Activity", icon: History },
  { path: "/vault/milestones", label: "Milestones", icon: Trophy },
  { path: "/vault/portfolio", label: "Portfolio", icon: PieChart },
  { path: "/vault/insights-analytics", label: "Insights", icon: BarChart3 },
  { path: "/vault/vault-status", label: "Vault Status", icon: ShieldCheck },
  { path: "/vault/settings", label: "Settings", icon: Settings2 },
];

const EDGE_TRIGGER_WIDTH = 16;
const SIDEBAR_WIDTH = 248;
const SIDEBAR_HIDE_THRESHOLD = SIDEBAR_WIDTH + 24;

function isActivePath(currentPath, itemPath) {
  if (itemPath === "/vault") {
    return currentPath === "/vault" || currentPath === "/vault/dashboard";
  }

  return currentPath.startsWith(itemPath);
}

export default function VaultNavBar() {
  const location = useLocation();
  const [sidebarVisible, setSidebarVisible] = React.useState(false);
  const [sidebarHovered, setSidebarHovered] = React.useState(false);

  React.useEffect(() => {
    const handleMouseMove = (event) => {
      if (window.innerWidth < 1024) {
        return;
      }

      if (event.clientX <= EDGE_TRIGGER_WIDTH) {
        setSidebarVisible(true);
        return;
      }

      if (!sidebarHovered && event.clientX > SIDEBAR_HIDE_THRESHOLD) {
        setSidebarVisible(false);
      }
    };

    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarVisible(false);
        setSidebarHovered(false);
      }
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("resize", handleResize);
    };
  }, [sidebarHovered]);

  return (
    <>
      <div
        aria-hidden="true"
        className="fixed inset-y-0 left-0 z-40 hidden w-4 lg:block"
        onMouseEnter={() => setSidebarVisible(true)}
      />

      <aside
        className={`fixed left-0 top-0 z-50 hidden h-screen w-[248px] border-r border-[#6a2a3f]/45 bg-[#0a0a0d]/95 px-4 py-6 backdrop-blur transition-transform duration-300 lg:flex lg:flex-col ${
          sidebarVisible ? "translate-x-0 pointer-events-auto" : "-translate-x-full pointer-events-none"
        }`}
        onMouseEnter={() => {
          setSidebarHovered(true);
          setSidebarVisible(true);
        }}
        onMouseLeave={() => {
          setSidebarHovered(false);
          setSidebarVisible(false);
        }}
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -left-12 top-24 h-44 w-44 rounded-full bg-[#ff2f68]/18 blur-3xl"
          animate={{ scale: [1, 1.15, 1], x: [0, 12, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-8 bottom-14 h-36 w-36 rounded-full bg-[#6c1730]/18 blur-3xl"
          animate={{ scale: [1, 1.12, 1], y: [0, -10, 0] }}
          transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
        />
        <Link to="/vault" className="group mb-7 flex items-center gap-3">
          <motion.div
            className="relative flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2f68] via-[#e01449] to-[#a10d31] text-white shadow-[0_12px_30px_rgba(255,47,104,0.45)]"
            whileHover={{ scale: 1.06, rotate: -2 }}
          >
            <ShieldCheck className="h-5 w-5" />
          </motion.div>
          <p className="text-sm font-semibold uppercase tracking-[0.22em] text-white transition group-hover:text-[#ff9fb6]">
            VaultSave
          </p>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ path, label, icon: Icon }, idx) => (
            <Link key={path} to={path}>
              <motion.div
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  isActivePath(location.pathname, path)
                    ? "border border-[#9a3658] bg-gradient-to-r from-[#3a131f] to-[#271018] text-[#ffd9e4] shadow-[0_10px_24px_rgba(200,13,64,0.24)]"
                    : "border border-transparent text-[#bfaab2] hover:bg-[#1b1216] hover:text-white"
                }`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.25, delay: idx * 0.03 }}
                whileHover={{ x: 3, scale: 1.01 }}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </motion.div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-[26px] border border-[#5f2739]/45 bg-[#140d12] p-4 shadow-[0_16px_40px_rgba(0,0,0,0.35)]">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#b08795]">
            Navigation
          </p>
          <p className="mt-2 text-sm leading-6 text-[#dfc8d0]">
            Active routes stay connected to the wallet session and TestNet vault contract.
          </p>
          <Link
            to="/vault"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ff93ad] transition hover:text-[#ffc0d1]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to dashboard
          </Link>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-[#5f2739]/45 bg-[#0b0a0d]/95 px-2 py-3 backdrop-blur lg:hidden">
        <div className="no-scrollbar flex items-center gap-1 overflow-x-auto">
          <Link
            to="/vault"
            className="flex min-w-[62px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[#bfaab2] transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-[11px] font-medium">Vault</span>
          </Link>

          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex min-w-[74px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                isActivePath(location.pathname, path)
                  ? "bg-[#3a131f] text-[#ffd9e4]"
                  : "text-[#bfaab2] hover:text-white"
              }`}
            >
              <Icon className="h-4 w-4" />
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
