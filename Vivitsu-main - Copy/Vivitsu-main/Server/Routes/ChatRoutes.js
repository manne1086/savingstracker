import express from "express";
import { chat, getSessions, getSession, deleteSession } from "../Controller/ChatController.js";
// import { uploadDocument } from "../Controller/DocumentController.js";
import authMiddleware from "../Middlewares/authMiddleware.js";
// import multer from "multer";
// import fs from "fs";

const router = express.Router();


// Upload configuration removed


router.post("/", authMiddleware, chat);
// Add upload route
// router.post("/upload", authMiddleware, upload.single("file"), uploadDocument);

router.get("/sessions", authMiddleware, getSessions);
router.get("/sessions/:id", authMiddleware, getSession);
router.delete("/sessions/:id", authMiddleware, deleteSession);

export default router;
