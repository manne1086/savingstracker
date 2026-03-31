import dotenv from "dotenv";
import mongoose from "mongoose";
import path from "path";
import { fileURLToPath } from "url";
import { chat } from "../Controller/ChatController.js";
import fs from 'fs';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars
dotenv.config({ path: path.join(__dirname, "../.env") });

async function verifyChat() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in .env");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // Mock Req/Res
        const req = {
            user: { _id: "6966838b5c56b23ac7d241f6" }, // Srakshin
            body: {
                message: "who is hruthik reddy allam"
            },
            protocol: "http",
            get: () => "localhost:3000"
        };

        const res = {
            status: function (code) {
                this.statusCode = code;
                return this;
            },
            json: function (data) {
                const dumpPath = path.join(__dirname, "verify_output.json");
                fs.writeFileSync(dumpPath, JSON.stringify(data, null, 2), "utf-8");
                console.log(`Response written to ${dumpPath}`);
                return this;
            }
        };

        console.log(`Sending message: "${req.body.message}"...`);
        await chat(req, res);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected.");
    }
}

verifyChat();
