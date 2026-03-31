import React from "react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { useVault } from "@/contexts/VaultContext";
import { terminateVaultSession } from "@/lib/vaultSession";

const stitchScreens = {
  dashboard: {
    title: "Dashboard",
    codePath: "/stitch/vaultsave/code/Dashboard.html",
    imagePath: "/stitch/vaultsave/images/Dashboard.png",
  },
  deposit: {
    title: "Deposit",
    codePath: "/stitch/vaultsave/code/Deposit.html",
    imagePath: "/stitch/vaultsave/images/Deposit.png",
  },
  "activity-history": {
    title: "Activity / History",
    codePath: "/stitch/vaultsave/code/Activity_History.html",
    imagePath: "/stitch/vaultsave/images/Activity_History.png",
  },
  milestones: {
    title: "Milestones",
    codePath: "/stitch/vaultsave/code/Milestones.html",
    imagePath: "/stitch/vaultsave/images/Milestones.png",
  },
  portfolio: {
    title: "Portfolio",
    codePath: "/stitch/vaultsave/code/Portfolio.html",
    imagePath: "/stitch/vaultsave/images/Portfolio.png",
  },
  "insights-analytics": {
    title: "Insights / Analytics",
    codePath: "/stitch/vaultsave/code/Insights_Analytics.html",
    imagePath: "/stitch/vaultsave/images/Insights_Analytics.png",
  },
  "vault-status": {
    title: "Vault Status",
    codePath: "/stitch/vaultsave/code/Vault_Status.html",
    imagePath: "/stitch/vaultsave/images/Vault_Status.png",
  },
  settings: {
    title: "Settings",
    codePath: "/stitch/vaultsave/code/Settings.html",
    imagePath: "/stitch/vaultsave/images/Settings.png",
  },
};

export default function VaultScreen({ screenKey }) {
  const navigate = useNavigate();
  const { walletConnected, disconnectWallet } = useVault();
  const screen = stitchScreens[screenKey] || stitchScreens.dashboard;
  const isInsightsScreen = screenKey === "insights-analytics";

  useEffect(() => {
    const handleFrameMessage = async (event) => {
      if (event.origin !== window.location.origin) {
        return;
      }

      if (event.data?.type === "vaultsave:navigate") {
        const targetPath = String(event.data?.path || "");
        if (targetPath.startsWith("/vault/")) {
          navigate(targetPath);
        }
        return;
      }

      if (event.data?.type !== "vaultsave:terminate-session") {
        return;
      }

      terminateVaultSession();

      if (walletConnected) {
        await disconnectWallet();
      }

      navigate("/", { replace: true });
    };

    window.addEventListener("message", handleFrameMessage);
    return () => {
      window.removeEventListener("message", handleFrameMessage);
    };
  }, [disconnectWallet, navigate, walletConnected]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      className={`w-full ${isInsightsScreen ? "px-0 sm:px-0 lg:px-0" : ""}`}
    >
      <motion.div
        className={`overflow-hidden border bg-[#0a0a0e] ${
          isInsightsScreen
            ? "rounded-none border-transparent shadow-none"
            : "rounded-[24px] border-[#6a2a3f]/50 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
        }`}
        whileHover={
          isInsightsScreen
            ? undefined
            : { y: -2, boxShadow: "0 36px 95px rgba(0,0,0,0.6), 0 0 40px rgba(224,0,55,0.16)" }
        }
        transition={{ duration: 0.25, ease: "easeOut" }}
      >
        {!isInsightsScreen && (
          <motion.div
            className="h-[2px] w-full bg-gradient-to-r from-transparent via-[#ff2f68] to-transparent"
            animate={{ opacity: [0.45, 1, 0.45] }}
            transition={{ duration: 2.6, repeat: Infinity, ease: "easeInOut" }}
          />
        )}
        <iframe
          key={screen.codePath}
          title={`Stitch ${screen.title}`}
          src={screen.codePath}
          className={`w-full border-0 ${
            isInsightsScreen ? "h-[calc(100vh-80px)] min-h-[760px]" : "h-[calc(100vh-220px)] min-h-[560px]"
          }`}
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
        />
      </motion.div>
    </motion.div>
  );
}
