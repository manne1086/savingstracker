import fs from 'fs';
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

async function testPdfGenLink() {
    console.log("🚀 Starting PDF Link Generation Test...");
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({
            $or: [{ Username: "mannerithivkesh" }, { FirstName: "Rithivkesh" }]
        }) || await User.findOne();

        if (!user) {
            console.error("No user found.");
            process.exit(1);
        }

        const token = jwt.sign(
            { id: user._id, FirstName: user.FirstName, LastName: user.LastName, Email: user.Email },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        console.log("📨 Asking: 'Generate a PDF about machine learning basics'");

        const response = await fetch("http://127.0.0.1:3000/api/chat", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                message: "Generate a PDF about machine learning basics.",
                history: []
            })
        });

        if (!response.ok) {
            const errText = await response.text();
            throw new Error(`HTTP Error: ${response.status} - ${errText}`);
        }



        const data = await response.json();
        fs.writeFileSync('raw_reply.txt', data.reply, 'utf8'); // Save raw reply to check content

        console.log("\n💬 Chatbot Reply (saved to raw_reply.txt):");
        console.log("---------------------------------------------------");
        console.log(data.reply); // Still log it just in case
        console.log("---------------------------------------------------");

        if (data.reply.includes("<a href=")) {
            console.log("✅ SUCCESS: Download link detected in response!");
        } else {
            console.log("❌ FAILURE: No download link found. Check intent detection.");
        }

    } catch (error) {
        console.error("💥 Test Failed:", error.message);
    } finally {
        await mongoose.disconnect();
    }
}

testPdfGenLink();
