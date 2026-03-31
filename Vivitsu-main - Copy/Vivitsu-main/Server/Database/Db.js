// Server/Database/Db.js
import mongoose from "mongoose";
import { handleMissingUsernames } from "../Middlewares/usernameHandler.js";

/**
 * ConnectDB - connects to MongoDB using mongoose.
 *
 * Behavior:
 * - Throws if MONGODB_URI is not defined.
 * - Tries to connect with serverSelectionTimeoutMS to fail fast.
 * - Retries a few times with exponential backoff (useful for transient network issues).
 * - Exposes globalThis.dbClose() to cleanly disconnect during graceful shutdown.
 *
 * Usage:
 *  await ConnectDB();
 */
const DEFAULT_RETRY_COUNT = 3;
const DEFAULT_RETRY_DELAY_MS = 1000; // initial backoff

function wait(ms) {
  return new Promise((res) => setTimeout(res, ms));
}

export const ConnectDB = async ({
  uri = process.env.MONGODB_URI,
  retries = DEFAULT_RETRY_COUNT,
  initialDelayMs = DEFAULT_RETRY_DELAY_MS,
} = {}) => {
  if (!uri) {
    // In development, allow server to run without MongoDB for Vault API
    if (process.env.NODE_ENV === "development") {
      console.log("⚠️  MONGODB_URI not defined - running in development mode without database");
      console.log("📝 Note: Vault API (/api/vault/*) will still work");
      console.log("📝 Note: Auth and user features will be limited");
      globalThis.dbClose = async () => {
        console.log("ℹ️  No database to disconnect");
      };
      return null;
    }

    const err = new Error("MONGODB_URI is not defined in environment");
    console.error("❌", err.message);
    throw err;
  }

  // Optional: tune mongoose global settings if desired
  // mongoose.set('strictQuery', false); // uncomment if you want to suppress strictQuery warnings

  const connectOptions = {
    // Do not pass deprecated options like useNewUrlParser/useUnifiedTopology anymore.
    serverSelectionTimeoutMS: 10000, // fail fast (10s) when server can't be selected
    // socketTimeoutMS: 45000, // optional: socket timeout
    // family: 4, // optional: force IPv4 if DNS issues arise
  };

  let attempt = 0;
  let lastErr = null;

  while (attempt <= retries) {
    try {
      attempt += 1;
      if (attempt > 1) {
        console.log(
          `🔁 Retry ${attempt}/${retries + 1} - attempting MongoDB connection...`
        );
      } else {
        console.log("🔌 Attempting to connect to MongoDB...");
      }

      await mongoose.connect(uri, connectOptions);
      await handleMissingUsernames(); // add username to users without username
      console.log("✅ MongoDB connected");

      // Expose a close function for graceful shutdown
      globalThis.dbClose = async () => {
        try {
          await mongoose.disconnect();
          console.log("✅ MongoDB disconnected");
        } catch (closeErr) {
          console.warn("⚠️ Error while disconnecting MongoDB:", closeErr);
        }
      };

      return mongoose; // success
    } catch (error) {
      lastErr = error;
      const errMsg = error && error.message ? error.message : String(error);
      console.error(`❌ MongoDB connection attempt ${attempt} failed:`, errMsg);

      // if we've exhausted retries, break and throw below
      if (attempt > retries) break;

      // exponential backoff before retrying
      const delay = initialDelayMs * Math.pow(2, attempt - 1);
      console.log(`⏳ Waiting ${delay}ms before next retry...`);

      await wait(delay);
    }
  }

  // All attempts failed — log and throw last error
  console.error("❌ MongoDB connection error: all retries exhausted");
  throw lastErr || new Error("MongoDB connection failed (unknown error)");
};
