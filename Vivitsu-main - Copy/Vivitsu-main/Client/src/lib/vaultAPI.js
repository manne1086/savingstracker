/**
 * SavingsVault API Client (Frontend)
 * Provides typed access to backend API endpoints
 */

const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  import.meta.env.REACT_APP_API_BASE_URL ||
  "http://localhost:3000";
const API_VAULT_PREFIX = `${API_BASE_URL}/api/vault`;

// ════════════════════════════════════════════════════════════════
// ERROR HANDLING
// ════════════════════════════════════════════════════════════════

class VaultAPIError extends Error {
  constructor(message, code, status) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

const handleResponse = async (response) => {
  const data = await response.json();

  if (!response.ok) {
    throw new VaultAPIError(
      data.error || 'API request failed',
      data.code || 'UNKNOWN_ERROR',
      response.status
    );
  }

  return data;
};

// ════════════════════════════════════════════════════════════════
// API FUNCTIONS
// ════════════════════════════════════════════════════════════════

/**
 * Get vault balance for an address
 * GET /api/vault/balance?address=xxx
 */
export const getVaultBalance = async (address) => {
  try {
    const response = await fetch(
      `${API_VAULT_PREFIX}/balance?address=${encodeURIComponent(address)}`
    );
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching vault balance:', error);
    throw error;
  }
};

/**
 * Get deposit history for an address
 * GET /api/vault/history?address=xxx&limit=20&offset=0
 */
export const getDepositHistory = async (address, limit = 20, offset = 0) => {
  try {
    const url = new URL(`${API_VAULT_PREFIX}/history`);
    url.searchParams.append('address', address);
    url.searchParams.append('limit', limit.toString());
    url.searchParams.append('offset', offset.toString());

    const response = await fetch(url.toString());
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching deposit history:', error);
    throw error;
  }
};

/**
 * Get milestone data for an address
 * GET /api/vault/milestones?address=xxx
 */
export const getMilestones = async (address) => {
  try {
    const response = await fetch(
      `${API_VAULT_PREFIX}/milestones?address=${encodeURIComponent(address)}`
    );
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching milestones:', error);
    throw error;
  }
};

/**
 * Get leaderboard (top savers)
 * GET /api/vault/leaderboard?limit=20
 */
export const getLeaderboard = async (limit = 20) => {
  try {
    const response = await fetch(
      `${API_VAULT_PREFIX}/leaderboard?limit=${limit}`
    );
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching leaderboard:', error);
    throw error;
  }
};

/**
 * Get community statistics
 * GET /api/vault/stats
 */
export const getVaultStats = async () => {
  try {
    const response = await fetch(`${API_VAULT_PREFIX}/stats`);
    return await handleResponse(response);
  } catch (error) {
    console.error('Error fetching vault stats:', error);
    throw error;
  }
};

/**
 * Verify a transaction was confirmed on-chain
 * POST /api/vault/verify-txn
 */
export const verifyTransaction = async (txnId) => {
  try {
    const response = await fetch(`${API_VAULT_PREFIX}/verify-txn`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ txnId }),
    });
    return await handleResponse(response);
  } catch (error) {
    console.error('Error verifying transaction:', error);
    throw error;
  }
};

// ════════════════════════════════════════════════════════════════
// TYPED EXPORTS
// ════════════════════════════════════════════════════════════════

export { VaultAPIError };

export const vaultAPI = {
  getVaultBalance,
  getDepositHistory,
  getMilestones,
  getLeaderboard,
  getVaultStats,
  verifyTransaction,
};
