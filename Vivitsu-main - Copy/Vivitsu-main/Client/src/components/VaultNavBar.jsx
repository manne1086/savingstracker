import React from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Home,
  Target,
  Users,
  Trophy,
  User,
  Menu,
  X,
  Wallet,
} from "lucide-react";
import { useState } from "react";

export default function VaultNavBar() {
  const location = useLocation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems = [
    { path: "/vault", label: "Home", icon: Home },
    { path: "/vault/goals", label: "Goals", icon: Target },
    { path: "/vault/social", label: "Social", icon: Users },
    { path: "/vault/rewards", label: "Rewards", icon: Trophy },
    { path: "/vault/profile", label: "Profile", icon: User },
  ];

  const isActive = (path) => location.pathname === path;

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-64 bg-sec border-r border-[var(--border)] z-40 pt-8">
        {/* Logo */}
        <Link
          to="/vault"
          className="px-6 mb-8 flex items-center gap-3 group cursor-pointer"
        >
          <motion.div
            className="w-10 h-10 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-lg"
            whileHover={{ scale: 1.05 }}
          >
            💰
          </motion.div>
          <span className="font-bold text-lg group-hover:txt-red transition-colors">
            Vault
          </span>
        </Link>

        {/* Navigation items */}
        <div className="flex-1 px-4 space-y-1">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link key={path} to={path}>
              <motion.div
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors cursor-pointer
                  ${
                    isActive(path)
                      ? "bg-active-red txt-red"
                      : "txt-dim hover:bg-hover-red hover:txt-red"
                  }
                `}
                whileHover={{ x: 4 }}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </motion.div>
            </Link>
          ))}
        </div>

        {/* Wallet button at bottom */}
        <div className="px-4 pb-6 border-t border-[var(--border)] pt-4">
          <motion.button
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition-colors"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <Wallet className="w-4 h-4" />
            Connect Wallet
          </motion.button>
        </div>
      </nav>

      {/* Mobile Top Bar */}
      <nav className="md:hidden fixed top-0 left-0 right-0 h-16 bg-primary border-b border-[var(--border)] z-50 flex items-center justify-between px-4">
        <Link to="/vault" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-red-600 text-white flex items-center justify-center font-bold text-sm">
            💰
          </div>
          <span className="font-bold">Vault</span>
        </Link>

        <motion.button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-hover-red rounded-lg transition-colors"
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
        >
          {mobileMenuOpen ? (
            <X className="w-6 h-6" />
          ) : (
            <Menu className="w-6 h-6" />
          )}
        </motion.button>
      </nav>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <motion.div
          className="md:hidden fixed top-16 left-0 right-0 bg-primary border-b border-[var(--border)] z-40 p-4 space-y-2"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              onClick={() => setMobileMenuOpen(false)}
            >
              <motion.div
                className={`
                  flex items-center gap-3 px-4 py-3 rounded-lg transition-colors
                  ${
                    isActive(path)
                      ? "bg-active-red txt-red"
                      : "txt-dim hover:bg-hover-red hover:txt-red"
                  }
                `}
              >
                <Icon className="w-5 h-5" />
                <span className="font-medium">{label}</span>
              </motion.div>
            </Link>
          ))}
        </motion.div>
      )}

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 h-20 bg-primary border-t border-[var(--border)] z-40">
        <div className="flex items-end justify-around h-full px-4 pb-4">
          {navItems.map(({ path, label, icon: Icon }) => (
            <Link
              key={path}
              to={path}
              className={`
                flex flex-col items-center justify-center gap-1 py-2 px-2 rounded-lg transition-colors
                ${
                  isActive(path)
                    ? "txt-red"
                    : "txt-dim hover:txt-red"
                }
              `}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs font-medium">{label}</span>
            </Link>
          ))}
        </div>
      </nav>
    </>
  );
}
