const VAULT_SESSION_KEY = "vaultsave_session_active";

export function isVaultSessionActive() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(VAULT_SESSION_KEY) === "1";
}

export function activateVaultSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(VAULT_SESSION_KEY, "1");
}

export function terminateVaultSession() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(VAULT_SESSION_KEY);
}
