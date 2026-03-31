import { Suspense, lazy } from "react";
import { Navigate, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { VaultProvider } from "./contexts/VaultContext";
import { WalletProvider } from "./contexts/WalletContext";
import { ToastProvider } from "./contexts/ToastContext";
import { isVaultSessionActive } from "./lib/vaultSession";

const LandingPage = lazy(() => import("./pages/LandingPage"));
const VaultLayout = lazy(() => import("./components/VaultLayout"));
const VaultScreen = lazy(() => import("./pages/vault/VaultScreen"));
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

function LandingRouteGate() {
  if (isVaultSessionActive()) {
    return <Navigate to="/vault" replace />;
  }

  return <LandingPage />;
}

function App() {
  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <VaultProvider>
            <Suspense fallback={<AppFallback />}>
              <Routes>
                <Route path="/" element={<LandingRouteGate />} />

                <Route path="/vault" element={<VaultLayout />}>
                  <Route index element={<VaultScreen screenKey="dashboard" />} />
                  <Route path="dashboard" element={<VaultScreen screenKey="dashboard" />} />
                  <Route path="deposit" element={<VaultScreen screenKey="deposit" />} />
                  <Route
                    path="activity-history"
                    element={<VaultScreen screenKey="activity-history" />}
                  />
                  <Route path="milestones" element={<VaultScreen screenKey="milestones" />} />
                  <Route path="portfolio" element={<VaultScreen screenKey="portfolio" />} />
                  <Route
                    path="insights-analytics"
                    element={<VaultScreen screenKey="insights-analytics" />}
                  />
                  <Route path="vault-status" element={<VaultScreen screenKey="vault-status" />} />
                  <Route path="settings" element={<VaultScreen screenKey="settings" />} />
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
