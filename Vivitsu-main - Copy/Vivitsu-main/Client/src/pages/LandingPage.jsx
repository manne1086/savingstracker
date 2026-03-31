import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  LayoutDashboard,
  ShieldCheck,
  Sparkles,
  Target,
  Trophy,
  Users,
  Wallet,
} from "lucide-react";
import { useVault } from "@/contexts/VaultContext";

const networkLabel = String(import.meta.env.VITE_NETWORK || "testnet").toUpperCase();
const appId = import.meta.env.VITE_SAVINGS_VAULT_APP_ID || "Not configured";

const featureCards = [
  {
    title: "Dashboard",
    body: "Track live deposits, streak progress, and vault health in one place.",
    icon: LayoutDashboard,
    to: "/vault",
  },
  {
    title: "Goals",
    body: "Measure target progress and see how much ALGO is left to save.",
    icon: Target,
    to: "/vault/goals",
  },
  {
    title: "Rewards",
    body: "Surface XP, unlocks, and milestone badges tied to on-chain activity.",
    icon: Trophy,
    to: "/vault/rewards",
  },
  {
    title: "Social",
    body: "Keep the community layer without bringing back the edutech routes.",
    icon: Users,
    to: "/vault/social",
  },
];

function truncateAddress(address) {
  if (!address) {
    return "Wallet disconnected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function LandingPage() {
  const { walletConnected, walletAddress, connectWallet } = useVault();

  return (
    <div className="min-h-screen overflow-hidden bg-[#09090c] text-[#f4eef0]">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute left-[-10%] top-[-8%] h-80 w-80 rounded-full bg-[#ff0f52]/18 blur-3xl" />
        <div className="absolute right-[-6%] top-[14%] h-96 w-96 rounded-full bg-[#6f2136]/20 blur-3xl" />
        <div className="absolute bottom-[-12%] left-[22%] h-72 w-72 rounded-full bg-[#2d1430]/28 blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[#111117]/80 px-5 py-4 shadow-[0_20px_80px_rgba(0,0,0,0.35)] backdrop-blur xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#ff2f68] to-[#a10d31] shadow-[0_12px_30px_rgba(255,47,104,0.35)]">
              <ShieldCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.32em] text-[#ff9fb6]/75">
                VaultSave
              </p>
              <h1 className="text-lg font-semibold tracking-tight text-white">
                Blockchain Savings Vault
              </h1>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#2a4738] bg-[#10241d] px-3 py-1.5 text-xs font-medium text-[#98f5c2]">
              <span className="h-2 w-2 rounded-full bg-[#43d68b]" />
              {networkLabel}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d8c8ce]">
              <Sparkles className="h-3.5 w-3.5 text-[#ff7d9f]" />
              App ID {appId}
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-medium text-[#d8c8ce]">
              <Wallet className="h-3.5 w-3.5 text-[#ff7d9f]" />
              {truncateAddress(walletConnected ? walletAddress : null)}
            </span>
          </div>
        </header>

        <main className="grid flex-1 items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <section>
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, ease: "easeOut" }}
              className="max-w-2xl"
            >
              <span className="mb-4 inline-flex items-center gap-2 rounded-full border border-[#4c1830] bg-[#1d1117] px-3 py-1.5 text-xs font-medium uppercase tracking-[0.24em] text-[#ff9db4]">
                On-chain savings, no edutech routes
              </span>
              <h2 className="text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Bring the new VaultSave UI into the live TestNet app.
              </h2>
              <p className="mt-5 max-w-xl text-base leading-7 text-[#c8b8be] sm:text-lg">
                The new visual system from `new_Client` is now the front door,
                while deposits, wallet connections, profile state, and rewards
                still flow through the working React and Algorand integration.
              </p>

              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                {walletConnected ? (
                  <Link
                    to="/vault"
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff2d63] to-[#c80d40] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(200,13,64,0.35)] transition hover:translate-y-[-1px]"
                  >
                    Open Vault
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={connectWallet}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-[#ff2d63] to-[#c80d40] px-6 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(200,13,64,0.35)] transition hover:translate-y-[-1px]"
                  >
                    Connect Pera Wallet
                    <Wallet className="h-4 w-4" />
                  </button>
                )}

                <Link
                  to="/vault"
                  className="inline-flex items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-6 py-3 text-sm font-semibold text-[#f6eef1] transition hover:border-[#ff658e]/40 hover:bg-white/10"
                >
                  Explore Dashboard
                </Link>
              </div>

              <div className="mt-8 grid gap-4 sm:grid-cols-3">
                <div className="rounded-[24px] border border-white/10 bg-[#121217]/88 p-4">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#8b7d83]">
                    Wallet
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Pera Connect
                  </p>
                  <p className="mt-1 text-sm text-[#b7a8ae]">
                    QR-based TestNet connection stays wired to the live app.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-[#121217]/88 p-4">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#8b7d83]">
                    Blockchain
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    SavingsVault
                  </p>
                  <p className="mt-1 text-sm text-[#b7a8ae]">
                    Deposits, opt-in, rewards, and profile metrics stay on-chain.
                  </p>
                </div>
                <div className="rounded-[24px] border border-white/10 bg-[#121217]/88 p-4">
                  <p className="text-[11px] uppercase tracking-[0.25em] text-[#8b7d83]">
                    Routes
                  </p>
                  <p className="mt-2 text-lg font-semibold text-white">
                    Vault only
                  </p>
                  <p className="mt-1 text-sm text-[#b7a8ae]">
                    Edutech pages stay out of the active app surface.
                  </p>
                </div>
              </div>
            </motion.div>
          </section>

          <section className="relative">
            <motion.div
              initial={{ opacity: 0, scale: 0.97, y: 24 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.5, ease: "easeOut", delay: 0.08 }}
              className="relative rounded-[32px] border border-white/10 bg-[#111117]/86 p-4 shadow-[0_28px_100px_rgba(0,0,0,0.4)] backdrop-blur"
            >
              <div className="mb-3 flex items-center justify-between px-2">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.28em] text-[#9e8f96]">
                    Desired UI imported
                  </p>
                  <h3 className="mt-1 text-xl font-semibold text-white">
                    VaultSave Preview
                  </h3>
                </div>
                <Link
                  to="/vault"
                  className="rounded-full border border-[#ff5f88]/30 bg-[#2a121a] px-3 py-1.5 text-xs font-semibold text-[#ff97af] transition hover:border-[#ff5f88]/50"
                >
                  Launch live routes
                </Link>
              </div>

              <div className="relative overflow-hidden rounded-[28px] border border-[#31131e] bg-[#09090c] p-3">
                <img
                  src="/stitch/vaultsave/images/Dashboard.png"
                  alt="VaultSave dashboard preview"
                  className="w-full rounded-[22px] border border-white/5"
                />
                <div className="pointer-events-none absolute bottom-5 left-5 hidden w-44 rounded-[24px] border border-white/10 bg-[#13131a]/92 p-2 shadow-[0_20px_50px_rgba(0,0,0,0.5)] sm:block">
                  <img
                    src="/stitch/vaultsave/images/VaultSave_Landing_Page.png"
                    alt="VaultSave landing preview"
                    className="max-h-72 w-full rounded-[18px] object-cover object-top"
                  />
                </div>
              </div>
            </motion.div>
          </section>
        </main>

        <section className="relative z-10 mt-14">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8e8086]">
                Functional route map
              </p>
              <h3 className="mt-2 text-2xl font-semibold text-white">
                Live vault features carried over
              </h3>
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {featureCards.map(({ title, body, icon: Icon, to }) => (
              <Link
                key={title}
                to={to}
                className="group rounded-[26px] border border-white/10 bg-[#121217]/88 p-5 transition hover:border-[#ff658e]/40 hover:bg-[#16161d]"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#221018] text-[#ff8ea8]">
                  <Icon className="h-5 w-5" />
                </div>
                <h4 className="mt-4 text-lg font-semibold text-white">{title}</h4>
                <p className="mt-2 text-sm leading-6 text-[#bcaeb4]">{body}</p>
                <div className="mt-5 inline-flex items-center gap-2 text-sm font-medium text-[#ff93ad]">
                  Open route
                  <ArrowRight className="h-4 w-4 transition group-hover:translate-x-1" />
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

export default LandingPage;
