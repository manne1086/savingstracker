import { Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import { VaultProvider } from "./contexts/VaultContext";
import { WalletProvider } from "./contexts/WalletContext";
import { ToastProvider } from "./contexts/ToastContext";
import VaultLayout from "./components/VaultLayout";
import VaultDashboard from "./pages/vault/Dashboard";
import VaultGoals from "./pages/vault/Goals";
import VaultSocial from "./pages/vault/Social";
import VaultRewards from "./pages/vault/Rewards";
import VaultProfile from "./pages/vault/Profile";
import PageNotFound from "./pages/PageNotFound";

function App() {
  const queryClient = new QueryClient();

  return (
    <ToastProvider>
      <QueryClientProvider client={queryClient}>
        <WalletProvider>
          <VaultProvider>
            <Routes>
            {/* Vault Routes */}
            <Route path="/vault" element={<VaultLayout />}>
              <Route index element={<VaultDashboard />} />
              <Route path="goals" element={<VaultGoals />} />
              <Route path="social" element={<VaultSocial />} />
              <Route path="rewards" element={<VaultRewards />} />
              <Route path="profile" element={<VaultProfile />} />
            </Route>

            {/* Fallback */}
            <Route path="/" element={<VaultLayout />}>
              <Route index element={<VaultDashboard />} />
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
          </VaultProvider>
        </WalletProvider>
      </QueryClientProvider>
    </ToastProvider>
  );
}

export default App;
