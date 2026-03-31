import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Wallet } from "lucide-react";
import { useVault } from "@/contexts/VaultContext";
import VaultNavBar from "@/components/VaultNavBar";

const pageMeta = {
  "/vault": {
    eyebrow: "Dashboard Overview",
    title: "Track your savings vault",
    description:
      "Live wallet state, deposits, and progress data are flowing from the existing blockchain integration.",
  },
  "/vault/goals": {
    eyebrow: "Goal Planning",
    title: "Stay on top of your target",
    description:
      "Goal progress, milestones, and recent deposit history stay routed through the same vault state.",
  },
  "/vault/social": {
    eyebrow: "Community Layer",
    title: "See how your vault stacks up",
    description:
      "Leaderboards and badges remain connected to the active vault context instead of static mock routes.",
  },
  "/vault/rewards": {
    eyebrow: "Rewards Center",
    title: "Review XP, badges, and milestones",
    description:
      "Rewards continue to reflect the on-chain vault state and the current deposit history feed.",
  },
  "/vault/profile": {
    eyebrow: "Vault Identity",
    title: "Manage wallet and account status",
    description:
      "Profile actions still use the live Pera wallet session and current blockchain account state.",
  },
};

function truncateAddress(address) {
  if (!address) {
    return "Connect wallet";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function VaultLayout() {
  const location = useLocation();
  const { walletConnected, walletAddress, connectWallet } = useVault();
  const networkLabel = String(import.meta.env.VITE_NETWORK || "testnet").toUpperCase();
  const meta = pageMeta[location.pathname] || pageMeta["/vault"];

  return (
    <div className="min-h-screen overflow-hidden bg-[#09090c] text-[#f4eef0]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-12%] top-[-10%] h-80 w-80 rounded-full bg-[#ff0f52]/16 blur-3xl" />
        <div className="absolute right-[-6%] top-[14%] h-96 w-96 rounded-full bg-[#5d2030]/18 blur-3xl" />
        <div className="absolute bottom-[-18%] left-[18%] h-80 w-80 rounded-full bg-[#1e1a34]/28 blur-3xl" />
      </div>

      <div className="relative z-10 lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
        <VaultNavBar />

        <div className="min-h-screen px-4 pb-24 pt-4 sm:px-6 lg:px-8 lg:py-6">
          <header className="mb-6 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[#111117]/82 px-5 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.34)] backdrop-blur xl:flex-row xl:items-center xl:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#ff9fb6]/70">
                {meta.eyebrow}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                {meta.title}
              </h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-[#c5b8bd]">
                {meta.description}
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#2a4738] bg-[#10241d] px-3 py-1.5 text-xs font-medium text-[#98f5c2]">
                <span className="h-2 w-2 rounded-full bg-[#43d68b]" />
                {networkLabel}
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d8c8ce]">
                <ShieldCheck className="h-3.5 w-3.5 text-[#ff7d9f]" />
                SavingsVault
              </span>
              <button
                type="button"
                onClick={walletConnected ? undefined : connectWallet}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                  walletConnected
                    ? "border border-white/10 bg-white/5 text-[#f4eef0]"
                    : "bg-gradient-to-r from-[#ff2d63] to-[#c80d40] text-white shadow-[0_16px_35px_rgba(200,13,64,0.35)]"
                }`}
              >
                <Wallet className="h-4 w-4" />
                {truncateAddress(walletConnected ? walletAddress : null)}
              </button>
            </div>
          </header>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
