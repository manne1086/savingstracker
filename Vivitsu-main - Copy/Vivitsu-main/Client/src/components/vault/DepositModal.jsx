import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, AlertCircle } from "lucide-react";
import { useWallet } from "@/contexts/WalletContext";

export const DepositModal = ({ 
  isOpen = false, 
  onClose = () => {},
}) => {
  const { address, isConnected, isConnecting, connect, depositALGO, error: walletError } = useWallet();
  
  const [amount, setAmount] = useState("");
  const [selectedQuick, setSelectedQuick] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState(null); // "success", "error", or null
  const [errorMessage, setErrorMessage] = useState(null);

  const quickAmounts = [1, 5, 10, 50];

  useEffect(() => {
    // Close on Escape key
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const handleQuickAmount = (value) => {
    setSelectedQuick(value);
    setAmount(value.toString());
    setErrorMessage(null);
  };

  const handleCustomAmount = (e) => {
    const value = e.target.value;
    setAmount(value);
    setSelectedQuick(null);
    setErrorMessage(null);
  };

  const handleConnectWallet = async () => {
    try {
      setErrorMessage(null);
      await connect();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Failed to connect wallet");
    }
  };

  const handleConfirm = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid amount");
      return;
    }

    if (!isConnected) {
      setErrorMessage("Please connect your wallet first");
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    
    try {
      const txnId = await depositALGO(parseFloat(amount));
      console.log("Deposit successful:", txnId);
      setStatus("success");
      
      setTimeout(() => {
        setAmount("");
        setSelectedQuick(null);
        setStatus(null);
        setErrorMessage(null);
        onClose();
      }, 2000);
    } catch (error) {
      const errMsg = error instanceof Error ? error.message : "Deposit failed";
      setErrorMessage(errMsg);
      setStatus("error");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 bg-black/50 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm z-50"
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", damping: 20 }}
          >
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-lg font-semibold txt">Deposit ALGO</h2>
                <motion.button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <X className="w-5 h-5 txt-dim" />
                </motion.button>
              </div>

              {/* Content */}
              <div className="p-6 space-y-6">
                {/* Quick amount buttons */}
                <div>
                  <label className="block text-xs font-semibold txt-dim mb-3 uppercase">
                    Quick Amount
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {quickAmounts.map((value) => (
                      <motion.button
                        key={value}
                        onClick={() => handleQuickAmount(value)}
                        className={`
                          py-2 px-3 rounded-lg font-semibold text-sm transition-all
                          ${
                            selectedQuick === value
                              ? "bg-red-500 text-white"
                              : "bg-gray-100 dark:bg-gray-700 txt hover:bg-gray-200 dark:hover:bg-gray-600"
                          }
                        `}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                      >
                        {value}
                      </motion.button>
                    ))}
                  </div>
                </div>

                {/* Custom input */}
                <div>
                  <label className="block text-xs font-semibold txt-dim mb-2 uppercase">
                    Custom Amount
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      value={amount}
                      onChange={handleCustomAmount}
                      placeholder="Enter custom amount..."
                      className="w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 txt placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-red-500"
                    />
                    <span className="absolute right-4 top-2.5 text-xs font-medium txt-dim">
                      ALGO
                    </span>
                  </div>
                </div>

                {/* Wallet status and connection */}
                {isConnected && address ? (
                  <motion.div
                    className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700"
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <p className="text-xs txt-dim mb-1">✓ Connected Wallet</p>
                    <p className="text-sm font-semibold txt font-mono">
                      {address.slice(0, 10)}...{address.slice(-7)}
                    </p>
                  </motion.div>
                ) : (
                  <motion.button
                    onClick={handleConnectWallet}
                    disabled={isConnecting}
                    className={`
                      w-full py-2 px-4 rounded-lg font-semibold text-sm transition-colors flex items-center justify-center gap-2
                      ${
                        isConnecting
                          ? "bg-gray-400 dark:bg-gray-600 text-gray-600 cursor-not-allowed"
                          : "bg-blue-500 hover:bg-blue-600 text-white"
                      }
                    `}
                    whileHover={{ scale: !isConnecting ? 1.02 : 1 }}
                    whileTap={{ scale: !isConnecting ? 0.98 : 1 }}
                  >
                    {isConnecting ? (
                      <>
                        <motion.div
                          className="w-4 h-4 border-2 border-white border-r-transparent rounded-full"
                          animate={{ rotate: 360 }}
                          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                        />
                        Connecting...
                      </>
                    ) : (
                      "Connect Pera Wallet"
                    )}
                  </motion.button>
                )}

                {/* Error messages */}
                {(errorMessage || walletError) && (
                  <motion.div
                    className="p-3 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 flex items-start gap-2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                    <span className="text-sm font-medium text-red-700 dark:text-red-300">
                      {errorMessage || walletError}
                    </span>
                  </motion.div>
                )}

                {/* Status messages */}
                {status === "success" && (
                  <motion.div
                    className="p-3 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 flex items-center gap-2"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                  >
                    <span className="text-lg">✅</span>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Deposit Successful! Transaction submitted.
                    </span>
                  </motion.div>
                )}
              </div>

              {/* Footer */}
              <div className="flex gap-3 p-6 border-t border-gray-200 dark:border-gray-700">
                <motion.button
                  onClick={onClose}
                  className="flex-1 py-2 px-4 rounded-lg border border-gray-300 dark:border-gray-600 txt font-semibold hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  disabled={isLoading}
                >
                  Cancel
                </motion.button>
                <motion.button
                  onClick={handleConfirm}
                  disabled={isLoading || !isConnected || !amount || parseFloat(amount) <= 0}
                  className={`
                    flex-1 py-2 px-4 rounded-lg font-semibold transition-all
                    ${
                      isLoading || !isConnected || !amount || parseFloat(amount) <= 0
                        ? "bg-gray-300 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                        : "bg-red-500 hover:bg-red-600 text-white"
                    }
                  `}
                  whileHover={{ scale: (isLoading || !isConnected || !amount || parseFloat(amount) <= 0) ? 1 : 1.02 }}
                  whileTap={{ scale: (isLoading || !isConnected || !amount || parseFloat(amount) <= 0) ? 1 : 0.98 }}
                >
                  {isLoading ? (
                    <div className="flex items-center justify-center gap-2">
                      <motion.div
                        className="w-4 h-4 border-2 border-white border-r-transparent rounded-full"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                      />
                      Processing...
                    </div>
                  ) : (
                    "Confirm Deposit"
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default DepositModal;
