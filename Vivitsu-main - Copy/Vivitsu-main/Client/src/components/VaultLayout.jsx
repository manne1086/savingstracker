import React from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { ShieldCheck, Wallet } from "lucide-react";
import { useVault } from "@/contexts/VaultContext";
import VaultNavBar from "@/components/VaultNavBar";

const pageMeta = {
  "/vault": {
    title: "Dashboard",
  },
  "/vault/dashboard": {
    title: "Dashboard",
  },
  "/vault/deposit": {
    title: "Deposit",
  },
  "/vault/activity-history": {
    title: "Activity / History",
  },
  "/vault/milestones": {
    title: "Milestones",
  },
  "/vault/portfolio": {
    title: "Portfolio",
  },
  "/vault/insights-analytics": {
    title: "Insights / Analytics",
  },
  "/vault/vault-status": {
    title: "Vault Status",
  },
  "/vault/settings": {
    title: "Settings",
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
  const isInsightsPage = location.pathname === "/vault/insights-analytics";

  return (
    <div className="min-h-screen overflow-hidden bg-[#060607] text-[#f6f0f2]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <motion.div
          className="absolute left-[-14%] top-[-16%] h-96 w-96 rounded-full bg-[#ff1f5b]/20 blur-3xl"
          animate={{ scale: [1, 1.15, 1], x: [0, 18, 0], y: [0, 10, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-8%] top-[8%] h-[28rem] w-[28rem] rounded-full bg-[#8d0f35]/24 blur-3xl"
          animate={{ scale: [1, 1.12, 1], x: [0, -20, 0], y: [0, -14, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-22%] left-[22%] h-96 w-96 rounded-full bg-[#3b1224]/30 blur-3xl"
          animate={{ scale: [1, 1.18, 1], y: [0, -14, 0] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="relative z-10">
        <VaultNavBar />

        <div
          className={`min-h-screen pb-24 ${
            isInsightsPage ? "px-0 pt-0 sm:px-0 lg:px-0 lg:py-0" : "px-4 pt-4 sm:px-6 lg:px-8 lg:py-6"
          }`}
        >
          {!isInsightsPage && (
            <motion.header
              initial={{ opacity: 0, y: -16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="mb-6 flex flex-col gap-4 rounded-[28px] border border-[#7f2743]/45 bg-[#0f0f13]/86 px-5 py-4 shadow-[0_24px_80px_rgba(0,0,0,0.5)] backdrop-blur xl:flex-row xl:items-center xl:justify-between"
            >
              <div>
                <h1 className="text-2xl font-semibold tracking-tight text-white sm:text-3xl">
                  {meta.title}
                </h1>
              </div>

              <div className="flex flex-wrap items-center gap-3">
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#6f1f37]/70 bg-[#2b0f1b] px-3 py-1.5 text-xs font-medium text-[#ffb9cb]"
                >
                  <span className="h-2 w-2 rounded-full bg-[#ff2f68] animate-pulse" />
                  {networkLabel}
                </motion.span>
                <motion.span
                  whileHover={{ scale: 1.03 }}
                  className="inline-flex items-center gap-2 rounded-full border border-[#5b2336]/55 bg-[#1f1218] px-3 py-1.5 text-xs font-medium text-[#e3c9d2]"
                >
                  <ShieldCheck className="h-3.5 w-3.5 text-[#ff7d9f]" />
                  SavingsVault
                </motion.span>
                <motion.button
                  type="button"
                  onClick={walletConnected ? undefined : connectWallet}
                  whileHover={{ scale: 1.03, y: -1 }}
                  whileTap={{ scale: 0.97 }}
                  className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition ${
                    walletConnected
                      ? "border border-[#5f2739]/55 bg-[#1b1216] text-[#f4eef0]"
                      : "bg-gradient-to-r from-[#ff2d63] via-[#e01449] to-[#a90e34] text-white shadow-[0_18px_38px_rgba(200,13,64,0.45)]"
                  }`}
                >
                  <Wallet className="h-4 w-4" />
                  {truncateAddress(walletConnected ? walletAddress : null)}
                </motion.button>
              </div>
            </motion.header>
          )}

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: "easeOut", delay: 0.05 }}
            className="w-full"
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
