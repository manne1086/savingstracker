
import fetch from "node-fetch";
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

const BASE_URL = "http://127.0.0.1:3000";

async function verifyAll() {
    console.log("🚀 Starting Comprehensive Chatbot Verification...");

    // 1. Authenticate
    await mongoose.connect(process.env.MONGODB_URI);
    const user = await User.findOne(); // Get any user
    if (!user) { console.error("No user found"); process.exit(1); }

    const token = jwt.sign(
        { id: user._id },
        process.env.JWT_SECRET,
        { expiresIn: "1h" }
    );
    const headers = {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${token}`
    };

    console.log(`👤 Testing as User: ${user.FirstName}`);

    try {
        // Test 1: General Knowledge
        await testCase("General Knowledge", "Who is the CEO of NVIDIA?", headers, (reply) => {
            return reply.includes("Jensen Huang");
        });

        // Test 2: RAG / Personal Data
        await testCase("Personal Data (RAG)", "What are my goals?", headers, (reply) => {
            // Loose check as user might not have goals, but it shouldn't be "Unknown Topic"
            return reply.length > 0 && !reply.includes("Unknown Topic");
        });

        // Test 3: PDF Generation (Explicit)
        await testCase("PDF Generation", "Generate a PDF about Space Exploration", headers, (reply) => {
            return reply.includes("<a href=") && reply.includes(".pdf");
        });

        // Test 4: PDF Hallucination Check (Implicit)
        await testCase("PDF Hallucination Check", "Tell me about cars", headers, (reply) => {
            return !reply.includes("<a href=") && !reply.includes(".pdf");
        });

        // Test 5: Contextual Memory
        console.log("\n🧪 Test 5: Contextual Memory");
        // Step A: ask about NVIDIA
        const resA = await fetch(`${BASE_URL}/api/chat`, {
            method: "POST", headers,
            body: JSON.stringify({ message: "Who is the CEO of NVIDIA?", history: [] })
        });
        const dataA = await resA.json();
        console.log("   User: Who is the CEO of NVIDIA?");
        console.log("   Bot: " + dataA.reply.substring(0, 50) + "...");

        // Step B: Follow up
        const history = [
            { role: "user", content: "Who is the CEO of NVIDIA?" },
            { role: "assistant", content: dataA.reply }
        ];
        const resB = await fetch(`${BASE_URL}/api/chat`, {
            method: "POST", headers,
            body: JSON.stringify({ message: "How old is he?", history })
        });
        const dataB = await resB.json();
        console.log("   User: How old is he?");
        console.log("   Bot: " + dataB.reply.substring(0, 50) + "...");

        if (dataB.reply.includes("60") || dataB.reply.includes("61") || dataB.reply.toLowerCase().includes("jensen")) {
            console.log("✅ PASSED: Contextual Memory");
        } else {
            console.log("❌ FAILED: Contextual Memory (Did not mention age or name in context)");
        }

        // Test 6: Auto-Planner API
        console.log("\n🧪 Test 6: Auto-Planner API");
        const planRes = await fetch(`${BASE_URL}/study-sessions/auto-plan`, {
            method: "POST", headers,
            body: JSON.stringify({
                subject: "Quantum Physics",
                timeline: "Urgent (this week)",
                style: "Visual",
                goal: "Exam"
            })
        });
        const planData = await planRes.json();
        if (planRes.ok && planData.success && planData.events.length > 0) {
            console.log(`✅ PASSED: Auto-Planner created ${planData.events.length} sessions.`);
        } else {
            console.log("❌ FAILED: Auto-Planner API");
            console.log(planData);
        }

    } catch (e) {
        console.error("💥 Verification Failed:", e);
    } finally {
        await mongoose.disconnect();
    }
}

async function testCase(name, message, headers, validator) {
    console.log(`\n🧪 Test: ${name}`);
    process.stdout.write(`   Sending: "${message}"... `);
    const res = await fetch(`${BASE_URL}/api/chat`, {
        method: "POST",
        headers,
        body: JSON.stringify({ message, history: [] })
    });
    const data = await res.json();
    if (validator(data.reply)) {
        console.log("✅ PASSED");
    } else {
        console.log("❌ FAILED");
        console.log("   Reply:", data.reply);
    }
}

verifyAll();
