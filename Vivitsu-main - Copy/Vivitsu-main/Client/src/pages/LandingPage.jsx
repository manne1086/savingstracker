import { useNavigate } from "react-router-dom";
import { useVault } from "@/contexts/VaultContext";
import { activateVaultSession } from "@/lib/vaultSession";

function truncateAddress(address) {
  if (!address) {
    return "Wallet disconnected";
  }

  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function LandingPage() {
  const navigate = useNavigate();
  const { walletConnected, walletAddress, connectWallet } = useVault();

  const handleConnectWallet = () => {
    connectWallet();
  };

  const handleLaunchApp = () => {
    activateVaultSession();
    navigate("/vault");
  };

  return (
    <div className="min-h-screen bg-[#131313] text-[#e5e2e1] selection:bg-[#e00037] selection:text-[#fff2f1]">
      <nav className="fixed top-0 z-50 w-full bg-[#353534]/60 shadow-[0_20px_40px_rgba(224,0,55,0.08)] backdrop-blur-xl">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-8 py-4 font-['Manrope'] font-semibold tracking-tight">
          <div className="text-2xl font-bold tracking-tighter text-[#e5e2e1]">VaultSave</div>

          <div className="hidden items-center gap-8 md:flex">
            <a className="text-[#e5e2e1] transition-colors hover:text-[#ffb3b3]" href="#features">
              Features
            </a>
            <a className="text-[#e5e2e1] transition-colors hover:text-[#ffb3b3]" href="#how-it-works">
              How It Works
            </a>
            <a className="text-[#e5e2e1] transition-colors hover:text-[#ffb3b3]" href="#milestones">
              Milestones
            </a>
            <a className="text-[#e5e2e1] transition-colors hover:text-[#ffb3b3]" href="#preview">
              Dashboard Preview
            </a>
            <a className="text-[#e5e2e1] transition-colors hover:text-[#ffb3b3]" href="#faq">
              FAQ
            </a>
          </div>

          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleConnectWallet}
              className="hidden items-center gap-2 rounded-xl px-4 py-2 text-[#e5e2e1] transition-all duration-300 hover:bg-[#ffb3b3]/10 hover:text-[#ffb3b3] lg:flex"
            >
              <span className="material-symbols-outlined text-sm">account_balance_wallet</span>
              Connect Wallet
            </button>
            <button
              type="button"
              onClick={handleLaunchApp}
              className="bg-[linear-gradient(135deg,#e00037_0%,#920021_100%)] px-6 py-2.5 font-bold text-[#fff2f1] transition-transform active:scale-90"
              style={{ borderRadius: "1.5rem" }}
            >
              Launch App
            </button>
          </div>
        </div>
      </nav>

      <header className="relative overflow-hidden px-8 pb-20 pt-40">
        <div className="mx-auto grid max-w-7xl grid-cols-1 items-center gap-16 lg:grid-cols-2">
          <div className="z-10 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#2a2a2a] px-3 py-1 text-xs font-bold uppercase tracking-widest text-[#ffb3b3]">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#e00037] opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-[#e00037]" />
              </span>
              Next-Gen Algorand Savings
            </div>

            <h1 className="text-6xl font-extrabold leading-[0.95] tracking-tighter text-[#e5e2e1] md:text-7xl font-['Manrope']">
              Turn every ALGO <span className="text-[#e00037] [text-shadow:0_0_15px_rgba(255,179,179,0.3)]">deposit</span> into long-term wealth.
            </h1>

            <p className="max-w-xl text-xl leading-relaxed text-[#e4beba]">
              Build smarter savings habits with a gamified on-chain vault. Secure non-custodial
              storage meets milestone-based motivation to keep your financial growth on track.
            </p>

            <div className="flex flex-wrap gap-4 pt-4">
              <button
                type="button"
                onClick={handleConnectWallet}
                className="rounded-[1.5rem] bg-[linear-gradient(135deg,#e00037_0%,#920021_100%)] px-8 py-4 text-lg font-bold text-[#fff2f1] shadow-[0_10px_30px_rgba(224,0,55,0.3)] transition-all hover:scale-105"
              >
                Start Saving Now
              </button>
              <a
                href="#preview"
                className="rounded-[1.5rem] border border-[#5b403d] px-8 py-4 text-lg font-bold transition-all hover:bg-[#2a2a2a]"
              >
                View Demo
              </a>
            </div>

            <div className="grid grid-cols-2 gap-6 pt-12 opacity-60 md:grid-cols-4">
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-[#ffb3b3]">lock</span> Non-Custodial
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-[#ffb3b3]">bolt</span> Algorand
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-[#ffb3b3]">verified</span> Smart Contract
              </div>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <span className="material-symbols-outlined text-[#ffb3b3]">monitoring</span> Real-Time
              </div>
            </div>
          </div>

          <div id="preview" className="group relative">
            <div className="absolute -inset-4 rounded-full bg-[#e00037]/10 blur-[100px] transition-all duration-700 group-hover:bg-[#e00037]/20" />
            <div className="relative rounded-[2rem] border border-[#5b403d]/30 bg-[#201f1f] p-8 shadow-2xl">
              <div className="mb-10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#353534]">
                    <span className="material-symbols-outlined text-[#ffb3b3]">shield</span>
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase text-[#e4beba]">Vault Active</p>
                    <p className="text-sm font-bold">ALGO_VAULT_001</p>
                  </div>
                </div>
                <div className="rounded-full border border-[#5b403d]/20 bg-[#0e0e0e] px-4 py-1.5 font-mono text-xs">
                  {truncateAddress(walletConnected ? walletAddress : "0x71f293db8eF2")}
                </div>
              </div>

              <div className="space-y-8">
                <div>
                  <p className="mb-1 text-sm text-[#e4beba]">Total Vault Balance</p>
                  <div className="flex items-baseline gap-2">
                    <h3 className="text-5xl font-extrabold font-['Manrope']">12,450.00</h3>
                    <span className="font-bold text-[#e00037]">ALGO</span>
                  </div>
                </div>

                <div className="rounded-2xl border border-[#5b403d]/10 bg-[#1c1b1b] p-6">
                  <div className="mb-4 flex items-center justify-between">
                    <p className="text-sm font-bold">Next Milestone: Gold Tier</p>
                    <p className="text-sm text-[#ffb3b3]">83%</p>
                  </div>
                  <div className="h-3 w-full overflow-hidden rounded-full bg-[#353534]">
                    <div className="h-full w-[83%] rounded-full bg-[linear-gradient(135deg,#e00037_0%,#920021_100%)]" />
                  </div>
                  <p className="mt-3 text-[10px] uppercase tracking-tight text-[#e4beba]">
                    Remaining: 2,550 ALGO to unlock exclusive badge
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="rounded-[1.5rem] bg-[#353534] py-3 text-sm font-bold">
                    Deposit
                  </button>
                  <button
                    type="button"
                    className="cursor-not-allowed rounded-[1.5rem] bg-[#0e0e0e] py-3 text-sm font-bold opacity-50"
                  >
                    Withdraw
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      <section className="bg-[#0e0e0e] px-8 py-24" id="how-it-works">
        <div className="mx-auto max-w-7xl">
          <div className="mb-16">
            <h2 className="mb-4 text-4xl font-bold md:text-5xl font-['Manrope']">
              Saving is hard when progress <br />
              <span className="text-[#e00037]">feels invisible.</span>
            </h2>
            <p className="max-w-2xl text-[#e4beba]">
              Traditional savings accounts are stagnant. VaultSave turns your accumulation journey
              into a high-stakes progression game where every token counts toward your legacy.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="rounded-xl border-l-4 border-[#e00037]/20 bg-[#201f1f] p-10">
              <span className="material-symbols-outlined mb-6 text-4xl text-[#ffb4ab]">sentiment_dissatisfied</span>
              <h4 className="mb-4 text-xl font-bold">The Friction</h4>
              <ul className="space-y-4 text-[#e4beba]">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-[#ffb4ab]">close</span>
                  Lack of visual motivation
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-[#ffb4ab]">close</span>
                  Fragmented tracking tools
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-[#ffb4ab]">close</span>
                  Temptation to spend prematurely
                </li>
              </ul>
            </div>

            <div className="rounded-xl border-l-4 border-[#ffb3b3] bg-[#201f1f] p-10">
              <span className="material-symbols-outlined mb-6 text-4xl text-[#ffb3b3]">auto_awesome</span>
              <h4 className="mb-4 text-xl font-bold">The VaultSave Solution</h4>
              <ul className="space-y-4 text-[#e4beba]">
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-[#ffb3b3]">check</span>
                  Milestone-based unlocking systems
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-[#ffb3b3]">check</span>
                  Real-time on-chain growth metrics
                </li>
                <li className="flex items-center gap-3">
                  <span className="material-symbols-outlined text-sm text-[#ffb3b3]">check</span>
                  Non-custodial security you control
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#131313] px-8 py-24" id="features">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 flex flex-col justify-between gap-8 md:flex-row md:items-end">
            <div className="max-w-2xl">
              <h2 className="text-4xl font-bold leading-tight md:text-5xl font-['Manrope']">
                Master your capital with <br />
                precision tools.
              </h2>
            </div>
            <div className="pb-2">
              <div className="flex gap-2">
                <div className="h-2 w-2 rounded-full bg-[#ffb3b3]" />
                <div className="h-2 w-2 rounded-full bg-[#5b403d]" />
                <div className="h-2 w-2 rounded-full bg-[#5b403d]" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            <div className="group rounded-xl border border-[#5b403d]/10 bg-[#1c1b1b] p-8 transition-all duration-500 hover:border-[#e00037]/40 hover:bg-[#201f1f]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2a2a2a] transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-[#ffb3b3]">input</span>
              </div>
              <h4 className="mb-3 text-xl font-bold">Smart Deposit Flow</h4>
              <p className="text-sm leading-relaxed text-[#e4beba]">
                A streamlined interface for single-click ALGO deposits directly into your locked
                vault.
              </p>
            </div>

            <div className="group rounded-xl border border-[#5b403d]/10 bg-[#1c1b1b] p-8 transition-all duration-500 hover:border-[#e00037]/40 hover:bg-[#201f1f]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2a2a2a] transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-[#ffb3b3]">monitoring</span>
              </div>
              <h4 className="mb-3 text-xl font-bold">Savings Total Tracker</h4>
              <p className="text-sm leading-relaxed text-[#e4beba]">
                Aggregated views of all your locked assets across multiple time horizons.
              </p>
            </div>

            <div className="group rounded-xl border border-[#5b403d]/10 bg-[#1c1b1b] p-8 transition-all duration-500 hover:border-[#e00037]/40 hover:bg-[#201f1f]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2a2a2a] transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-[#ffb3b3]">military_tech</span>
              </div>
              <h4 className="mb-3 text-xl font-bold">Milestone Badges</h4>
              <p className="text-sm leading-relaxed text-[#e4beba]">
                Earn unique NFT-based badges as you hit critical savings targets in your vault.
              </p>
            </div>

            <div className="group rounded-xl border border-[#5b403d]/10 bg-[#1c1b1b] p-8 transition-all duration-500 hover:border-[#e00037]/40 hover:bg-[#201f1f]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2a2a2a] transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-[#ffb3b3]">history</span>
              </div>
              <h4 className="mb-3 text-xl font-bold">Deposit History Panel</h4>
              <p className="text-sm leading-relaxed text-[#e4beba]">
                Full audit trail of every transaction, verified on the Algorand ledger for total
                transparency.
              </p>
            </div>

            <div className="group rounded-xl border border-[#5b403d]/10 bg-[#1c1b1b] p-8 transition-all duration-500 hover:border-[#e00037]/40 hover:bg-[#201f1f]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2a2a2a] transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-[#ffb3b3]">wallet</span>
              </div>
              <h4 className="mb-3 text-xl font-bold">Wallet Connection</h4>
              <p className="text-sm leading-relaxed text-[#e4beba]">
                Seamlessly connect with Pera, Defly, or WalletConnect with military-grade security.
              </p>
            </div>

            <div className="group rounded-xl border border-[#5b403d]/10 bg-[#1c1b1b] p-8 transition-all duration-500 hover:border-[#e00037]/40 hover:bg-[#201f1f]">
              <div className="mb-6 flex h-12 w-12 items-center justify-center rounded-lg bg-[#2a2a2a] transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined text-[#ffb3b3]">pie_chart</span>
              </div>
              <h4 className="mb-3 text-xl font-bold">Progress Visualization</h4>
              <p className="text-sm leading-relaxed text-[#e4beba]">
                Advanced charting and progress bars that visualize your path to financial freedom.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0e0e0e] px-8 py-24" id="how-it-works-steps">
        <div className="mx-auto max-w-7xl">
          <div className="mb-20 text-center">
            <h2 className="mb-6 text-4xl font-extrabold md:text-5xl font-['Manrope']">
              Four steps to obsidian growth.
            </h2>
            <p className="mx-auto max-w-xl text-[#e4beba]">
              The path to wealth is built on consistent, small actions. We&apos;ve simplified the
              process into a seamless four-step cycle.
            </p>
          </div>

          <div className="relative">
            <div className="absolute left-0 top-1/2 hidden h-px w-full -translate-y-1/2 bg-gradient-to-r from-transparent via-[#5b403d]/30 to-transparent lg:block" />
            <div className="relative grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-4">
              <div className="flex flex-col items-center text-center">
                <div className="relative z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#131313] bg-[#201f1f] text-xl font-bold text-[#ffb3b3]">
                  1
                  <div className="absolute inset-0 animate-pulse rounded-full border border-[#e00037]" />
                </div>
                <h5 className="mb-2 text-lg font-bold">Connect Wallet</h5>
                <p className="text-sm text-[#e4beba]">Securely link your Algorand wallet to the platform.</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#131313] bg-[#201f1f] text-xl font-bold text-[#ffb3b3]">
                  2
                </div>
                <h5 className="mb-2 text-lg font-bold">Deposit ALGO</h5>
                <p className="text-sm text-[#e4beba]">Choose your amount and commit it to your secure vault.</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#131313] bg-[#201f1f] text-xl font-bold text-[#ffb3b3]">
                  3
                </div>
                <h5 className="mb-2 text-lg font-bold">Track Progress</h5>
                <p className="text-sm text-[#e4beba]">Watch your total balance and milestones grow in real-time.</p>
              </div>

              <div className="flex flex-col items-center text-center">
                <div className="z-10 mb-6 flex h-16 w-16 items-center justify-center rounded-full border-4 border-[#131313] bg-[#201f1f] text-xl font-bold text-[#ffb3b3]">
                  4
                </div>
                <h5 className="mb-2 text-lg font-bold">Unlock Milestones</h5>
                <p className="text-sm text-[#e4beba]">Achieve goals and earn exclusive on-chain rewards.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="overflow-hidden bg-[#131313] px-8 py-24" id="milestones">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-center gap-16 lg:flex-row">
            <div className="lg:w-1/3">
              <h2 className="mb-6 text-4xl font-bold font-['Manrope']">
                Save with milestones, <br />
                <span className="text-[#e00037]">not guesswork.</span>
              </h2>
              <p className="mb-8 text-[#e4beba]">
                Each tier represents a psychological breakthrough in your savings journey.
                Gamification turns the chore of saving into a mission for excellence.
              </p>
              <div className="rounded-xl border border-[#5b403d]/10 bg-[#1c1b1b] p-6">
                <div className="mb-2 flex items-center gap-4">
                  <span className="material-symbols-outlined text-[#ffb3b3] [font-variation-settings:'FILL'_1]">workspace_premium</span>
                  <span className="font-bold">Next Unlock: 5,000 ALGO</span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-[#353534]">
                  <div className="h-full w-1/2 bg-[linear-gradient(135deg,#e00037_0%,#920021_100%)]" />
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:w-2/3">
              <div className="rounded-2xl border border-[#5b403d]/10 bg-[#201f1f] p-6 transition-colors hover:bg-[#2a2a2a]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#CD7F32]/30 bg-[#CD7F32]/10">
                  <span className="material-symbols-outlined text-[#CD7F32]">lock_open</span>
                </div>
                <h4 className="mb-1 text-xl font-bold">Bronze Tier</h4>
                <p className="mb-3 font-mono text-sm text-[#e00037]">1,000 ALGO</p>
                <p className="text-xs text-[#e4beba]">Foundational saver. The first step toward a digital obsidian vault.</p>
              </div>

              <div className="rounded-2xl border border-[#5b403d]/10 bg-[#201f1f] p-6 transition-colors hover:bg-[#2a2a2a]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#C0C0C0]/30 bg-[#C0C0C0]/10">
                  <span className="material-symbols-outlined text-[#C0C0C0]">shield</span>
                </div>
                <h4 className="mb-1 text-xl font-bold">Silver Tier</h4>
                <p className="mb-3 font-mono text-sm text-[#e00037]">5,000 ALGO</p>
                <p className="text-xs text-[#e4beba]">The Protector. Your capital core is starting to harden into stone.</p>
              </div>

              <div className="rounded-2xl border border-[#5b403d]/10 bg-[#201f1f] p-6 transition-colors hover:bg-[#2a2a2a]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#FFD700]/30 bg-[#FFD700]/10">
                  <span className="material-symbols-outlined text-[#FFD700]">trophy</span>
                </div>
                <h4 className="mb-1 text-xl font-bold">Gold Tier</h4>
                <p className="mb-3 font-mono text-sm text-[#e00037]">25,000 ALGO</p>
                <p className="text-xs text-[#e4beba]">The Elite. Recognized as a significant force within the ecosystem.</p>
              </div>

              <div className="rounded-2xl border border-[#5b403d]/10 bg-[#201f1f] p-6 transition-colors hover:bg-[#2a2a2a]">
                <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-[#E5E4E2]/30 bg-[#E5E4E2]/10">
                  <span className="material-symbols-outlined text-[#E5E4E2]">diamond</span>
                </div>
                <h4 className="mb-1 text-xl font-bold">Platinum Tier</h4>
                <p className="mb-3 font-mono text-sm text-[#e00037]">100,000 ALGO</p>
                <p className="text-xs text-[#e4beba]">The Obsidian Lord. Peak financial discipline and security status.</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#0e0e0e] px-8 py-24" id="faq">
        <div className="mx-auto max-w-3xl">
          <div className="mb-16 text-center">
            <h2 className="mb-4 text-4xl font-bold font-['Manrope']">Common Enquiries</h2>
            <p className="text-[#e4beba]">Everything you need to know about VaultSave security and mechanics.</p>
          </div>

          <div className="space-y-4">
            <div className="overflow-hidden rounded-xl border border-[#5b403d]/10 bg-[#201f1f]">
              <button type="button" className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-[#2a2a2a]">
                <span className="font-bold">What is VaultSave?</span>
                <span className="material-symbols-outlined text-[#e00037]">expand_more</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#5b403d]/10 bg-[#201f1f]">
              <button type="button" className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-[#2a2a2a]">
                <span className="font-bold">Is VaultSave non-custodial?</span>
                <span className="material-symbols-outlined text-[#e00037]">expand_more</span>
              </button>
              <div className="px-6 pb-6 text-sm text-[#e4beba]">
                Yes. VaultSave uses Algorand Smart Contracts to hold funds. Only your private keys
                can initiate a withdrawal from your designated vault address. We never have access
                to your ALGO.
              </div>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#5b403d]/10 bg-[#201f1f]">
              <button type="button" className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-[#2a2a2a]">
                <span className="font-bold">How do milestones work?</span>
                <span className="material-symbols-outlined text-[#e00037]">expand_more</span>
              </button>
            </div>

            <div className="overflow-hidden rounded-xl border border-[#5b403d]/10 bg-[#201f1f]">
              <button type="button" className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-[#2a2a2a]">
                <span className="font-bold">Are there any fees?</span>
                <span className="material-symbols-outlined text-[#e00037]">expand_more</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden px-8 py-24">
        <div className="absolute inset-0 opacity-10">
          <div className="absolute left-1/4 top-0 h-96 w-96 bg-[#e00037] blur-[150px]" />
          <div className="absolute bottom-0 right-1/4 h-96 w-96 bg-[#ffb3b3] blur-[150px]" />
        </div>

        <div className="relative z-10 mx-auto max-w-4xl text-center">
          <h2 className="mb-8 text-5xl font-extrabold tracking-tight md:text-6xl font-['Manrope']">
            Start building your <br />
            savings streak today.
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-xl text-[#e4beba]">
            Don&apos;t just hold ALGO. Vault it. Join thousands of disciplined savers in the Digital
            Obsidian ecosystem.
          </p>
          <div className="flex flex-col items-center justify-center gap-6 sm:flex-row">
            <button
              type="button"
              onClick={handleLaunchApp}
              className="w-full rounded-2xl bg-[linear-gradient(135deg,#e00037_0%,#920021_100%)] px-12 py-5 text-xl font-bold text-[#fff2f1] shadow-2xl transition-all hover:scale-105 sm:w-auto"
            >
              Launch Vault
            </button>
            <button
              type="button"
              onClick={handleConnectWallet}
              className="w-full rounded-2xl border border-[#5b403d]/30 bg-[#2a2a2a] px-12 py-5 text-xl font-bold transition-all hover:bg-[#201f1f] sm:w-auto"
            >
              Connect Wallet
            </button>
          </div>
        </div>
      </section>

      <footer className="w-full border-t border-[#353534]/20 bg-[#0e0e0e] py-12">
        <div className="mx-auto grid max-w-7xl grid-cols-1 gap-8 px-8 text-sm text-[#e5e2e1] md:grid-cols-4 font-['Inter']">
          <div className="col-span-1 md:col-span-1">
            <div className="mb-6 text-xl font-black text-[#e5e2e1]">VaultSave</div>
            <p className="mb-6 leading-relaxed opacity-60">© 2024 VaultSave. The Digital Obsidian.</p>
          </div>

          <div>
            <h6 className="mb-6 font-bold text-[#e00037]">Features</h6>
            <ul className="space-y-3 opacity-60">
              <li>
                <a className="transition-colors hover:text-[#e00037]" href="#features">
                  Smart Deposits
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-[#e00037]" href="#preview">
                  On-Chain Tracking
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-[#e00037]" href="#milestones">
                  Badges &amp; NFTs
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="mb-6 font-bold text-[#e00037]">Resources</h6>
            <ul className="space-y-3 opacity-60">
              <li>
                <a className="transition-colors hover:text-[#e00037]" href="#faq">
                  Documentation
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-[#e00037]" href="#">
                  Algorand Explorer
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-[#e00037]" href="#">
                  GitHub Repo
                </a>
              </li>
            </ul>
          </div>

          <div>
            <h6 className="mb-6 font-bold text-[#e00037]">Legals</h6>
            <ul className="space-y-3 opacity-60">
              <li>
                <a className="transition-colors hover:text-[#e00037]" href="#">
                  Privacy Policy
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-[#e00037]" href="#">
                  Terms of Service
                </a>
              </li>
              <li>
                <a className="transition-colors hover:text-[#e00037]" href="#">
                  Security Audit
                </a>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default LandingPage;
