import React from "react";
import { Outlet } from "react-router-dom";
import { motion } from "framer-motion";
import VaultNavBar from "@/components/VaultNavBar";

export default function VaultLayout() {
  return (
    <div className="flex min-h-screen bg-primary txt overflow-hidden">
      {/* Sidebar on desktop */}
      <div className="hidden md:w-64 md:flex-shrink-0" />

      {/* Main content */}
      <div className="flex-1 w-full overflow-auto md:overflow-auto">
        <VaultNavBar />
        
        {/* Content area with proper spacing */}
        <div className="md:ml-0 mt-16 md:mt-0">
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="w-full min-h-screen"
          >
            <Outlet />
          </motion.div>
        </div>
      </div>
    </div>
  );
}
