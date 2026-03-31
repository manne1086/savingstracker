# Groq Integration Architecture Diagrams

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Client Application                        │
│              (React - Unchanged)                             │
└────────────────────────┬────────────────────────────────────┘
                         │
                         │ HTTP/WebSocket
                         │
┌─────────────────────────┴────────────────────────────────────┐
│              Express.js Backend Server                        │
│                  (Node.js)                                    │
├───────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐   │
│  │     Routes & Controllers                             │   │
│  │  ├─ /api/chat (ChatController)         ✅            │   │
│  │  ├─ /api/notes (NotesController)       ✅            │   │
│  │  ├─ /api/tasks (TodoController)        ✅            │   │
│  │  ├─ /api/events (EventController)      ✅            │   │
│  │  ├─ /api/rooms (SessionRoomCtrl)       ✅            │   │
│  │  └─ /api/users (UserController)        ✅            │   │
│  └──────────────────────────────────────────────────────┘   │
│                         │                                     │
│  ┌──────────────────────┴──────────────────────────────┐     │
│  │      groqUtils.js (NEW!)                            │     │
│  │  ┌─────────────────────────────────────────────┐    │     │
│  │  │ generateEmbedding(text)                     │    │     │
│  │  │  └─ Calls Groq Embeddings API              │    │     │
│  │  │     Model: nomic-embed-text-v1.5           │    │     │
│  │  │     Returns: 1536-dim vector               │    │     │
│  │  └─────────────────────────────────────────────┘    │     │
│  │  ┌─────────────────────────────────────────────┐    │     │
│  │  │ chatResponse(messages)                      │    │     │
│  │  │  └─ Calls Groq Chat API                    │    │     │
│  │  │     Model: mixtral-8x7b-32768              │    │     │
│  │  │     Returns: Text response                 │    │     │
│  │  └─────────────────────────────────────────────┘    │     │
│  │  ┌─────────────────────────────────────────────┐    │     │
│  │  │ analyzeImage(buffer)                        │    │     │
│  │  │  └─ Not supported by Groq                  │    │     │
│  │  │     Returns: Fallback message              │    │     │
│  │  └─────────────────────────────────────────────┘    │     │
│  └──────────────────────────────────────────────────────┘     │
│                         │                                     │
│  ┌──────────────────────┴──────────────────────────────┐     │
│  │      Data Layer                                     │     │
│  │  ├─ MongoDB (Notes with embeddings)       ✅       │     │
│  │  ├─ MongoDB (Tasks with embeddings)       ✅       │     │
│  │  ├─ MongoDB (Events with embeddings)      ✅       │     │
│  │  └─ MongoDB (Users with embeddings)       ✅       │     │
│  └──────────────────────────────────────────────────────┘     │
└───────────────────────────────────────────────────────────────┘
                         │
                         │ HTTPS REST API
                         │ OpenAI-compatible format
                         │
┌────────────────────────┴────────────────────────────────────┐
│              Groq Cloud API (api.groq.com)                   │
├────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Chat Completions Endpoint                          │  │
│  │  Model: mixtral-8x7b-32768                           │  │
│  │  • Fast inference                                   │  │
│  │  • 32K token context                                │  │
│  │  • High quality responses                           │  │
│  └──────────────────────────────────────────────────────┘  │
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Embeddings Endpoint                                │  │
│  │  Model: nomic-embed-text-v1.5                        │  │
│  │  • 1536 dimensions                                   │  │
│  │  • Fast generation (~100ms)                          │  │
│  │  • Semantic search ready                             │  │
│  └──────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────┘
```

---

## Request Flow Diagram

### Chat Request Flow
```
User Message
    │
    ▼
POST /api/chat
    │
    ├─ Authenticate (JWT)
    │
    ├─ Generate Embedding for query
    │   └─ groqUtils.generateEmbedding()
    │       └─ Call Groq API
    │           └─ nomic-embed-text-v1.5
    │               └─ Get 1536-dim vector
    │
    ├─ Retrieve RAG Context
    │   ├─ Search MongoDB for similar notes
    │   ├─ Search MongoDB for similar tasks
    │   ├─ Search MongoDB for similar events
    │   ├─ Search MongoDB for similar rooms
    │   └─ Search MongoDB for similar users
    │
    ├─ Build System Prompt + RAG Context
    │   └─ User message + Top 5 similar docs
    │
    ├─ Call Chat API
    │   └─ groqUtils.chatResponse()
    │       └─ Call Groq API
    │           └─ mixtral-8x7b-32768
    │               └─ Get text response
    │
    ├─ Check for PDF Intent
    │   └─ If "GENERATE_PDF" intent
    │       └─ Generate PDF and return link
    │
    ├─ Save to Database
    │   └─ Store conversation in AIChatSession
    │
    └─ Return Response
        └─ JSON with reply, sessionId, title
            │
            ▼
        Client receives response
        Display in UI
```

### Embedding Generation Flow
```
Create/Update Note
    │
    ▼
NoteModel.save() pre-hook
    │
    ├─ Check if title or content changed
    │
    ├─ Build text = title + content
    │
    ├─ Call generateEmbedding()
    │   └─ groqUtils.generateEmbedding(text)
    │       ├─ Validate text
    │       ├─ Call Groq API
    │       │  └─ POST /openai/v1/embeddings
    │       │      └─ model: nomic-embed-text-v1.5
    │       │      └─ input: text
    │       └─ Return embedding vector
    │
    ├─ Store embedding in MongoDB
    │   └─ noteSchema.embedding = [0.123, 0.456, ...]
    │
    └─ Save document
        └─ Note with embedding ready for search
```

---

## Data Model

```
MongoDB Collections
│
├─ Users
│  ├─ _id
│  ├─ FirstName
│  ├─ LastName
│  ├─ Email
│  ├─ Bio
│  ├─ University
│  ├─ embedding: [1536 numbers] ← Generated by Groq
│  └─ ...
│
├─ Notes
│  ├─ _id
│  ├─ title
│  ├─ content
│  ├─ owner (ref: User)
│  ├─ embedding: [1536 numbers] ← Generated by Groq
│  └─ ...
│
├─ Tasks (ToDoModel)
│  ├─ _id
│  ├─ title
│  ├─ user (ref: User)
│  ├─ status
│  ├─ embedding: [1536 numbers] ← Generated by Groq
│  └─ ...
│
├─ Events
│  ├─ _id
│  ├─ title
│  ├─ date
│  ├─ user (ref: User)
│  ├─ embedding: [1536 numbers] ← Generated by Groq
│  └─ ...
│
├─ SessionRooms
│  ├─ _id
│  ├─ name
│  ├─ description
│  ├─ embedding: [1536 numbers] ← Generated by Groq
│  └─ ...
│
└─ AIChatSessions
   ├─ _id
   ├─ userId (ref: User)
   ├─ title
   ├─ messages: [
   │   {role: "user", content: "..."},
   │   {role: "assistant", content: "..."}
   │ ]
   └─ ...

All embeddings: 1536-dimensional vectors
Generated by: Groq nomic-embed-text-v1.5
Used for: Cosine similarity search in RAG
```

---

## Deployment Architecture

```
Development Environment
├─ Localhost:3000 (Server)
├─ Localhost:5173 (Client)
└─ MongoDB Atlas (Database)
    │
    └─ All requests → Groq Cloud API


Production Environment
├─ Production Server (Node.js)
│  ├─ Environment: production
│  ├─ GROQ_API_KEY: (from secrets manager)
│  └─ All routes configured
│
├─ MongoDB Atlas (Database)
│  └─ All collections with embeddings
│
└─ Groq Cloud API
   └─ api.groq.com (high availability)
      ├─ Chat API
      └─ Embeddings API
```

---

## Feature Integration Map

```
Feature                     Controller/Model              Groq Function
────────────────────────────────────────────────────────────────────────
Chat with RAG              ChatController.js            chatResponse()
                           messageHandlers.js            generateEmbedding()

Note Management            NotesController.js           generateEmbedding()
                           NoteModel.js                 (pre-save hook)

Task Management            TodoController.js            generateEmbedding()
                           ToDoModel.js                 (pre-save hook)

Event Management           EventController.js           generateEmbedding()
                           EventModel.js                (pre-save hook)

Study Room Management      SessionRoomController.js      generateEmbedding()

User Profiles              UserController.js            generateEmbedding()

Real-time Chat            messageHandlers.js            chatResponse()
                                                        generateEmbedding()

PDF Generation            ChatController.js             chatResponse()
                                                        (intent detection)

Vector Search (RAG)        All Controllers              generateEmbedding()
                           Models                       (similarity matching)
```

---

## Timeout & Error Handling

```
Embeddings API
├─ Timeout: 30 seconds
├─ On Timeout: Return null
├─ On Error: Log and return null
└─ Caller: Handles gracefully

Chat API
├─ Timeout: 300 seconds (5 minutes)
├─ On Timeout: Return fallback message
├─ On Error: Log and throw/return error
└─ Caller: Sends error to user

Error Recovery
├─ Invalid text: Return null (embeddings)
├─ Rate limit: Implement exponential backoff
├─ Network error: Retry with backoff
└─ API error: Return meaningful message
```

---

## Integration Points Checklist

```
✅ Controllers (6)
   ├─ ChatController.js
   ├─ TodoController.js
   ├─ UserController.js
   ├─ NotesController.js
   ├─ EventController.js
   └─ SessionRoomController.js

✅ Models (3)
   ├─ NoteModel.js
   ├─ ToDoModel.js
   └─ EventModel.js

✅ Socket Handlers (1)
   └─ messageHandlers.js

✅ Scripts (4)
   ├─ generateOllamaEmbeddings.js
   ├─ refreshUserEmbedding.js
   ├─ reproduceChatHang.js
   └─ testRAG.js

✅ Configuration (2)
   ├─ package.json
   └─ .env

✅ New Files (1)
   └─ groqUtils.js

✅ No Changes Needed
   ├─ Database schemas
   ├─ API routes
   ├─ Frontend code
   ├─ Authentication
   └─ Socket.io config
```

---

## Caching & Optimization Opportunities

```
Potential Optimizations (Future):
├─ Cache embeddings for frequently asked questions
├─ Batch embedding requests
├─ Implement request deduplication
├─ Use streaming for chat responses
├─ Implement response caching
└─ Add embedding versioning

Current Implementation:
├─ Real-time embedding generation
├─ Immediate API calls (no batching)
├─ No caching (fresh data always)
└─ Simple timeout handling
```

---

**Architecture Documentation Complete**
**Last Updated**: January 30, 2026
