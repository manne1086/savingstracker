import dotenv from "dotenv";
import mongoose from "mongoose";
import User from "../Model/UserModel.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from 'fs';

// Fix __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load env vars from Server root
dotenv.config({ path: path.join(__dirname, "../.env") });

async function checkFriends() {
    try {
        if (!process.env.MONGODB_URI) {
            throw new Error("MONGODB_URI is not defined in .env");
        }

        await mongoose.connect(process.env.MONGODB_URI);
        console.log("Connected to MongoDB");

        // 1. Search for "Hruthik"
        const hruthik = await User.find({
            $or: [
                { FirstName: { $regex: "Hruthik", $options: "i" } },
                { LastName: { $regex: "Hruthik", $options: "i" } },
                { Username: { $regex: "Hruthik", $options: "i" } }
            ]
        });

        // 2. Dump all users with friends
        const usersWithFriends = await User.find({ friends: { $exists: true, $not: { $size: 0 } } })
            .populate("friends", "FirstName LastName Username Email");

        const output = {
            hruthikSearchResults: hruthik,
            usersWithFriends: usersWithFriends.map(u => ({
                id: u._id,
                name: `${u.FirstName} ${u.LastName || ""}`,
                username: u.Username,
                friends: u.friends.map(f => ({
                    id: f._id,
                    firstName: f.FirstName,
                    lastName: f.LastName,
                    username: f.Username,
                    email: f.Email
                }))
            }))
        };

        const dumpPath = path.join(__dirname, "friends_dump.json");
        fs.writeFileSync(dumpPath, JSON.stringify(output, null, 2), "utf-8");
        console.log(`Dump written to ${dumpPath}`);

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("\nDisconnected.");
    }
}

checkFriends();
