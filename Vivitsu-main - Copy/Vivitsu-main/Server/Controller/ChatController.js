import Note from "../Model/NoteModel.js";
import Task from "../Model/ToDoModel.js";
import Event from "../Model/EventModel.js";
import SessionRoom from "../Model/SessionModel.js";
import User from "../Model/UserModel.js";
import AIChatSession from "../Model/AIChatSession.js";
import { generateEmbedding, chatResponse } from "../utils/groqUtils.js";
import { generatePdf } from "../utils/pdfGenerator.js";
import { nanoid } from "nanoid";
import path from "path";

// Cosine similarity helper
function cosineSimilarity(vecA, vecB) {
    if (!vecA || !vecB || vecA.length !== vecB.length) return 0;
    let dotProduct = 0;
    let normA = 0;
    let normB = 0;
    for (let i = 0; i < vecA.length; i++) {
        dotProduct += vecA[i] * vecB[i];
        normA += vecA[i] * vecA[i];
        normB += vecB[i] * vecB[i];
    }
    return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

// Create or Continue Chat
export const chat = async (req, res) => {
    try {
        const { message, sessionId } = req.body;
        const userId = req.user?._id;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        // --- 1. Load History from DB if sessionId provided ---
        let session = null;
        let history = [];

        if (sessionId) {
            session = await AIChatSession.findOne({ _id: sessionId, userId });
            if (session) {
                history = session.messages.map(m => ({ role: m.role, content: m.content }));
            }
        }

        // --- 2. RAG & Generation ---

        // Generate embedding 
        const queryEmbedding = await generateEmbedding(message);
        if (!queryEmbedding) {
            return res.status(500).json({ error: "Failed to generate embedding" });
        }

        // Fetch User Context
        let userContext = "";
        if (userId) {
            try {
                const user = await User.findById(userId).populate("friends", "FirstName LastName Username Email");
                if (user) {
                    userContext += `\nMY PROFILE:\n`;
                    userContext += `- Name: ${user.FirstName} ${user.LastName || ""}\n`;
                    userContext += `- Username: ${user.Username}\n`;
                    userContext += `- Email: ${user.Email}\n`;
                    if (user.Bio) userContext += `- Bio: ${user.Bio}\n`;
                    if (user.University) userContext += `- University: ${user.University}\n`;
                    if (user.Country) userContext += `- Country: ${user.Country}\n`;
                    if (user.FieldOfStudy) userContext += `- Field of Study: ${user.FieldOfStudy}\n`;
                    if (user.GraduationYear) userContext += `- Graduation Year: ${user.GraduationYear}\n`;

                    // Stats
                    userContext += `- Total Study Hours: ${user.totalStudyHours || 0}\n`;
                    userContext += `- Total Sessions: ${user.sessionCount || 0}\n`;
                    userContext += `- Current Streak: ${user.streaks?.current || 0} days\n`;
                    userContext += `- Max Streak: ${user.streaks?.max || 0} days\n`;
                    userContext += `- Kudos Received: ${user.kudosReceived || 0}\n`;

                    // Badges
                    if (user.badges && user.badges.length > 0) {
                        userContext += `- Badges Earned: ${user.badges.map(b => b.name).join(", ")}\n`;
                    }

                    // Friends
                    if (user.friends && user.friends.length > 0) {
                        const list = user.friends.map(f => `- Name: ${f.FirstName} ${f.LastName || ""} (Username: @${f.Username})`).join("\n");
                        userContext += `\nMY FRIENDS LIST:\n${list}\n`;
                    } else {
                        userContext += `\nMY FRIENDS LIST:\n(No friends found)\n`;
                    }
                }
            } catch (e) {
                console.error("Error fetching user profile for RAG:", e);
            }
        }

        // Fetch RAG Documents
        const [notes, tasks, events, rooms, users, openTasks, recentNotes, recentRooms] = await Promise.all([
            Note.find({ owner: userId, embedding: { $exists: true }, status: 'active' }).select("+embedding title content"),
            Task.find({ user: userId, embedding: { $exists: true } }).select("+embedding title status dueDate"),
            Event.find({ user: userId, embedding: { $exists: true } }).select("+embedding title date time"),
            SessionRoom.find({ embedding: { $exists: true } }).select("+embedding name description cateogery"),
            User.find({ embedding: { $exists: true } }).select("+embedding FirstName LastName Bio University FieldOfStudy Country badges totalStudyHours kudosReceived"),
            Task.find({ user: userId, status: { $ne: 'closed' } }).limit(5).select("title status dueDate"),
            Note.find({ owner: userId, status: 'active' }).sort({ updatedAt: -1 }).limit(5).select("title content"),
            SessionRoom.find({}).sort({ createdAt: -1 }).limit(10).select("name description cateogery"),
        ]);

        const candidates = [];
        const processDocs = (docs, type, formatter) => {
            if (!docs) return;
            docs.forEach(doc => {
                if (doc.embedding) {
                    const score = cosineSimilarity(queryEmbedding, doc.embedding);
                    candidates.push({ score, content: formatter(doc), type });
                }
            });
        };

        processDocs(notes, 'Note', doc => `Note: ${doc.title}\nContent: ${doc.content || ""}`);
        processDocs(tasks, 'Task', doc => `Task: ${doc.title}\nStatus: ${doc.status}\nDue: ${doc.dueDate}`);
        processDocs(events, 'Event', doc => `Event: ${doc.title}\nDate: ${doc.date}\nTime: ${doc.time}`);
        processDocs(rooms, 'Room', doc => `Study Room: ${doc.name}\nDescription: ${doc.description || ""}\nCategory: ${doc.cateogery}`);

        users.forEach(doc => {
            if (doc.embedding) {
                const score = cosineSimilarity(queryEmbedding, doc.embedding);
                const badges = doc.badges ? doc.badges.map(b => b.name).join(", ") : "";
                candidates.push({
                    score,
                    content: `User Profile: ${doc.FirstName} ${doc.LastName || ""}
                              Bio: ${doc.Bio || ""}
                              University: ${doc.University || ""}
                              Field of Study: ${doc.FieldOfStudy || ""}
                              Badges: ${badges}
                              Stats: ${doc.totalStudyHours || 0} hrs, ${doc.kudosReceived || 0} kudos`,
                    type: 'User'
                });
            }
        });

        candidates.sort((a, b) => b.score - a.score);
        const topDocs = candidates.slice(0, 5);
        const contextText = topDocs.map(c => c.content).join("\n\n");

        let extendedContext = contextText;
        if (openTasks.length > 0) extendedContext += `\n\n### BACKGROUND INFO - MY ACTIVE TASKS:\n${openTasks.map(t => `- ${t.title} (Due: ${t.dueDate ? t.dueDate.toDateString() : 'No date'})`).join("\n")}`;
        if (recentNotes && recentNotes.length > 0) extendedContext += `\n\n### BACKGROUND INFO - MY RECENT NOTES:\n${recentNotes.map(n => `- Title: ${n.title}\n  Content: ${n.content.substring(0, 100)}...`).join("\n")}`;
        if (recentRooms && recentRooms.length > 0) extendedContext += `\n\n### BACKGROUND INFO - AVAILABLE ROOMS:\n${recentRooms.map(r => `- Name: ${r.name} (${r.cateogery})`).join("\n")}`;

        const badgeInfo = `
### **Available Badges & Criteria**
*   **Rookie**: Complete your full profile (Bio, University, etc.).
*   **Kickstarter**: Complete your first task/goal.
*   **Consistency Starter**: Maintain a 7-day study streak.
*   **Focus Enthusiast**: Complete 10 focus sessions.
*   **Top 1/2/3**: Reach rank 1, 2, or 3 on the leaderboard.
`;

        const systemPrompt = `
You are Studia AI, a helpful and knowledgeable learning assistant.

----------------------------------------
CORE RESPONSIBILITIES
----------------------------------------

1. Act as a conversational RAG chatbot.
2. Use MongoDB vector search results provided as context.
3. Use Groq embeddings for semantic understanding.
4. Use Groq's Mixtral model for reasoning, formatting, and response generation.
5. Generate PDF-ready content ONLY when the user explicitly asks.

----------------------------------------
INTENT DETECTION & FORMATTING
----------------------------------------

You must classify user intent.

If intent == GENERATE_PDF:
- **CRITICAL CONDITION**: Set intent to "GENERATE_PDF" **ONLY** if the user explicitly includes phrases like "generate pdf", "make a pdf", "download as pdf", "save as pdf", or "apdf" (even if mistyped as "apfd" or similar).
- **CONTEXT AWARENESS**: If the user asks to convert "this info", "previous answer", "last response", or "what you just said" to PDF:
    - You **MUST** populate the "content" field with the RELEVANT text from the conversation history (system will provide previous turns).
    - Do NOT ask the user what to convert. JUST DO IT based on the immediate history.
    - If the user provides NEW text to convert, use that.
- **NEVER** set intent to "GENERATE_PDF" for general questions like "Who is CEO?", "What is X?", or "Explain Y".
- Output **ONLY** a valid JSON object.
- **NO** reasoning text.
- **NO** markdown code blocks (no \`\`\`json).
- **ESCAPE** all newlines in the "content" string using \\n.
- Structure:
{
  "intent": "GENERATE_PDF",
  "title": "Title Here",
  "content": "Line 1\\nLine 2\\nLine 3"
}

If intent != GENERATE_PDF:
- Respond normally in plain text (no JSON).

----------------------------------------
PDF CONTENT RULES
----------------------------------------
- Content must be clean text.
- No markdown, emojis, or code blocks in the content.

----------------------------------------
GENERAL RULES
----------------------------------------
- Source-Based: Use the provided <CONTEXT> for questions about the user's specific data (notes, tasks, sessions).
- General Knowledge: If the user asks a general question (e.g., "Who is the CEO of NVIDIA?", "Who discovered zero?"), use your internal knowledge. **CRITICAL**: Do NOT mention the user's personal data or say "I don't see a connection to your profile" unless the user explicitly asked for a connection. Just answer the fact.
- Greeting: If the user input is a greeting ("hello", "hi", "hey"), output EXACTLY and ONLY: "Hello there! I am Studia AI assistant, how can I help you?" Do not add any other text or analysis.
- Unknowns: If asked about "Platinum" or unknown badges, clarify available ones.
- Terminology: "Goals" = "Active Tasks".
- Friend Identification: Users may refer to friends by First Name, Last Name, or Username. Be flexible. If a user asks about "Hruthik Reddy Allam" and you see "Allam Reddy (@Hruthik)", that IS the same person.
- Brevity: Answer the user's question DIRECTLY and CONCISELY. Do NOT generate "Sub-Questions", "Related Concepts", "Suggested Tasks", or "Further Reading" sections. Do NOT append lists of generic suggestions unless explicitly asked.
- Follow-up Question Handling: **CRITICAL** - When the user asks a follow-up question, interpret it ONLY with respect to the immediately preceding context. This includes:
    - Previous messages in the conversation
    - Last topic discussed
    - Most recent information shared
    - Do NOT apply context from earlier unrelated conversations
    - Do NOT assume the user is asking about something different unless explicitly stated
    - Examples: If we discussed ML and user says "Can I use this for my projects?", interpret "this" as Machine Learning, NOT something else.
- Contextual Continuity: If the user's message is a follow-up (e.g., "Yes", "Tell me more", "Why?", "How?", "Can I use this?"), use the CONVERSATION HISTORY to understand the context. Do NOT treat the current message in isolation.
`;

        const userMessageContent = `
<CONTEXT>
${userContext}

${extendedContext}

${badgeInfo}
</CONTEXT>

<USER_QUESTION>
${message}
</USER_QUESTION>
`;

        const messagesPayload = [
            { role: "system", content: systemPrompt },
            ...history.slice(-10),
            { role: "user", content: userMessageContent }
        ];

        // 6. Get Response
        let reply = await chatResponse(messagesPayload);
        let finalReply = reply;

        // Attempt to parse JSON for PDF intent
        try {
            const jsonStart = reply.indexOf('{');
            const jsonEnd = reply.lastIndexOf('}');

            if (jsonStart !== -1 && jsonEnd !== -1) {
                const jsonStr = reply.substring(jsonStart, jsonEnd + 1);
                const parsed = JSON.parse(jsonStr);

                const userMessage = message.toLowerCase();
                const isExplicitRequest = userMessage.includes("pdf") || userMessage.includes("download") || userMessage.includes("generate");

                if (parsed.intent === "GENERATE_PDF" && parsed.title && parsed.content) {
                    if (isExplicitRequest) {
                        const filename = `studia-ai-${nanoid(6)}.pdf`;
                        const downloadsDir = path.join(process.cwd(), 'public', 'downloads');
                        const filePath = path.join(downloadsDir, filename);

                        await generatePdf(parsed.title, parsed.content, filePath);
                        const downloadUrl = `${req.protocol}://${req.get('host')}/public/downloads/${filename}`;

                        finalReply = `Here is your downloaded pdf about ${parsed.title}:\n\n<a href="${downloadUrl}" target="_blank" style="color: #ef4444; text-decoration: underline; font-weight: bold;">Download ${parsed.title}.pdf</a>`;
                    } else {
                        finalReply = parsed.content;
                    }
                }
            }
        } catch (e) { }

        // --- 3. Save to DB ---
        if (!session) {
            // Create new session
            const title = message.substring(0, 40) + (message.length > 40 ? "..." : "");
            session = await AIChatSession.create({
                userId,
                title,
                messages: [
                    { role: 'user', content: message },
                    { role: 'assistant', content: finalReply }
                ]
            });
        } else {
            // Update existing
            session.messages.push({ role: 'user', content: message });
            session.messages.push({ role: 'assistant', content: finalReply });
            session.lastMessageAt = Date.now();
            await session.save();
        }

        return res.status(200).json({
            reply: finalReply,
            sessionId: session._id,
            title: session.title
        });

    } catch (error) {
        console.error("Chat error:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

// Get all sessions
export const getSessions = async (req, res) => {
    try {
        const userId = req.user?._id;
        const sessions = await AIChatSession.find({ userId })
            .select("title lastMessageAt createdAt")
            .sort({ lastMessageAt: -1 })
            .limit(50);

        res.status(200).json(sessions);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch sessions" });
    }
};

// Get single session
export const getSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        const session = await AIChatSession.findOne({ _id: id, userId });
        if (!session) return res.status(404).json({ error: "Session not found" });

        res.status(200).json(session);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch session" });
    }
};

// Delete session
export const deleteSession = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.user?._id;

        await AIChatSession.deleteOne({ _id: id, userId });
        res.status(200).json({ success: true });
    } catch (error) {
        res.status(500).json({ error: "Failed to delete session" });
    }
};
