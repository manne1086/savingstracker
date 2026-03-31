import { Suspense, lazy } from "react";
import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { VaultProvider } from "./contexts/VaultContext";
import { WalletProvider } from "./contexts/WalletContext";
import { ToastProvider } from "./contexts/ToastContext";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const VaultLayout = lazy(() => import("./components/VaultLayout"));
const VaultDashboard = lazy(() => import("./pages/vault/Dashboard"));
const VaultGoals = lazy(() => import("./pages/vault/Goals"));
const VaultRewards = lazy(() => import("./pages/vault/Rewards"));
const VaultProfile = lazy(() => import("./pages/vault/Profile"));
const PageNotFound = lazy(() => import("./pages/PageNotFound"));

const queryClient = new QueryClient();

function AppFallback() {
  return (
    <div className="min-h-screen bg-primary txt flex items-center justify-center">
      <div className="text-center">
        <div className="text-sm txt-dim uppercase tracking-[0.2em]">
          Loading Vault
        </div>
      </div>
    </div>
  );
}

function App() {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <VaultProvider>
            <Suspense fallback={<AppFallback />}>
              <Routes>
                <Route path="/" element={<LandingPage />} />

                <Route path="/vault" element={<VaultLayout />}>
                  <Route index element={<VaultDashboard />} />
                  <Route path="goals" element={<VaultGoals />} />
                  <Route path="rewards" element={<VaultRewards />} />
                  <Route path="profile" element={<VaultProfile />} />
                </Route>

                <Route path="*" element={<PageNotFound />} />
              </Routes>

              <ToastContainer
                position="top-right"
                autoClose={5000}
                hideProgressBar={false}
                closeOnClick
                pauseOnHover
                theme="light"
              />
            </Suspense>
          </VaultProvider>
        </WalletProvider>
      </QueryClientProvider>
    </ToastProvider>
  );
}

export default App;
