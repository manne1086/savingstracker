import mongoose from "mongoose";
import dotenv from "dotenv";
import Task from "../Model/ToDoModel.js";
import User from "../Model/UserModel.js";
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const envPath = join(__dirname, '../.env');
dotenv.config({ path: envPath });

async function checkTasks() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);

        const user = await User.findOne({
            $or: [{ Username: "mannerithivkesh" }, { FirstName: "Rithivkesh" }]
        });

        if (!user) {
            console.log("User not found");
            return;
        }

        console.log(`Checking tasks for user: ${user.FirstName} (${user._id})`);

        const tasks = await Task.find({ user: user._id });
        console.log(`Total tasks found: ${tasks.length}`);

        tasks.forEach(task => {
            console.log(`- Title: "${task.title}"`);
            console.log(`  Status: ${task.status}`);
            console.log(`  DueDate: ${task.dueDate}`);
            console.log("-------------------");
        });

    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
    }
}

checkTasks();
