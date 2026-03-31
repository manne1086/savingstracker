import mongoose from "mongoose";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
import User from "../Model/UserModel.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function diagnoseChat() {
    console.log("=== DIAGNOSTIC START ===");
    console.log(`Time: ${new Date().toISOString()}`);
    console.log(`Target: http://127.0.0.1:3000/api/chat`);

    try {
        // 1. DB Connect
        console.log("1. Connecting to DB...");
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("   DB Connected.");

        // 2. User Find
        console.log("2. Finding User...");
        const user = await User.findOne();
        if (!user) {
            console.error("   ❌ DATA ERROR: No user found.");
            return;
        }
        console.log(`   User found: ${user.FirstName} (${user._id})`);

        // 3. Token Gen
        console.log("3. Generating Token...");
        const token = jwt.sign(
            { id: user._id, FirstName: user.FirstName, LastName: user.LastName, Email: user.Email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        console.log("   Token generated.");

        // 4. API Request
        console.log("4. Sending Request...");
        const start = Date.now();
        const response = await fetch("http://127.0.0.1:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message: "Hello diagnostic",
                history: []
            })
        });
        const duration = Date.now() - start;
        console.log(`   Request completed in ${duration}ms`);

        // 5. Response Analysis
        console.log(`5. Response Status: ${response.status} ${response.statusText}`);
        const text = await response.text();
        console.log(`   Response Body Preview: ${text.substring(0, 200)}...`);

        if (!response.ok) {
            console.error(`   ❌ API ERROR: Server returned status ${response.status}`);
        } else {
            console.log("   ✅ SUCCESS: Chat API is working correctly.");
        }

    } catch (error) {
        console.error("❌ CRTICIAL FAILURE:", error);
        if (error.cause) console.error("   Cause:", error.cause);
    } finally {
        await mongoose.disconnect();
        console.log("=== DIAGNOSTIC END ===");
    }
}

diagnoseChat();
