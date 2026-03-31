import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  LayoutDashboard,
  ShieldCheck,
  Target,
  Trophy,
  User,
  Users,
} from "lucide-react";

const navItems = [
  { path: "/vault", label: "Dashboard", icon: LayoutDashboard },
  { path: "/vault/goals", label: "Goals", icon: Target },
  { path: "/vault/social", label: "Social", icon: Users },
  { path: "/vault/rewards", label: "Rewards", icon: Trophy },
  { path: "/vault/profile", label: "Profile", icon: User },
];

function isActivePath(currentPath, itemPath) {
  if (itemPath === "/vault") {
    return currentPath === "/vault";
  }

  return currentPath.startsWith(itemPath);
}

export default function VaultNavBar() {
  const location = useLocation();

  return (
    <>
      <aside className="hidden min-h-screen border-r border-white/10 bg-[#0f1014]/90 px-4 py-6 backdrop-blur lg:flex lg:flex-col">
        <Link to="/" className="group mb-8 flex items-center gap-3">
          <motion.div
            className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2f68] to-[#a10d31] text-white shadow-[0_12px_30px_rgba(255,47,104,0.35)]"
            whileHover={{ scale: 1.04 }}
          >
            <ShieldCheck className="h-5 w-5" />
          </motion.div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-[#ff9fb6]/70">
              VaultSave
            </p>
            <p className="text-sm font-semibold text-white transition group-hover:text-[#ff9fb6]">
              Savings vault
            </p>
          </div>
        </Link>

        <nav className="flex flex-col gap-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}>
              <motion.div
                className={`flex items-center gap-3 rounded-2xl px-4 py-3 text-sm transition ${
                  isActivePath(location.pathname, path)
                    ? "border border-[#713042] bg-[#26131a] text-[#ffd2dc]"
                    : "border border-transparent text-[#b4a5ab] hover:bg-white/5 hover:text-white"
                }`}
                whileHover={{ x: 2 }}
              >
                <Icon className="h-4 w-4" />
                <span className="font-medium">{label}</span>
              </motion.div>
            </Link>
          ))}
        </nav>

        <div className="mt-auto rounded-[26px] border border-white/10 bg-white/5 p-4">
          <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8187]">
            Navigation
          </p>
          <p className="mt-2 text-sm leading-6 text-[#d1c4c9]">
            Active routes stay connected to the wallet session and TestNet vault contract.
          </p>
          <Link
            to="/"
            className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-[#ff93ad] transition hover:text-[#ffb0c2]"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to landing
          </Link>
        </div>
      </aside>

      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-[#0f1014]/95 px-2 py-3 backdrop-blur lg:hidden">
        <div className="flex items-center justify-between gap-1">
          <Link
            to="/"
            className="flex min-w-[56px] flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[#b4a5ab] transition hover:text-white"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="text-[11px] font-medium">Home</span>
          </Link>

          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`flex min-w-[56px] flex-1 flex-col items-center justify-center gap-1 rounded-2xl px-2 py-2 text-[11px] font-medium transition ${
                isActivePath(location.pathname, path)
                  ? "bg-[#26131a] text-[#ffd2dc]"
                  : "text-[#b4a5ab] hover:text-white"
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
