
import express from "express";
import Thread from "../models/Thread.js";
import getGeminiAIAPIResponse from "../utilts/geminiAI.js";

const router = express.Router();

// Authentication middleware
const requireAuth = (req, res, next) => {
    if (req.isAuthenticated()) return next();

    return res.status(401).json({
        error: "Please login first"
    });
};

// Get all threads of logged-in user
router.get("/thread", requireAuth, async (req, res) => {
    try {
        const threads = await Thread.find({
            user: req.user._id
        }).sort({ updatedAt: -1 });

        res.json(threads);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch threads" });
    }
});

// Get messages of a particular thread
router.get("/thread/:threadId", requireAuth, async (req, res) => {
    try {
        const thread = await Thread.findOne({
            threadId: req.params.threadId,
            user: req.user._id
        });

        if (!thread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.json(thread.messages);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to fetch chat" });
    }
});

// Delete a thread belonging to logged-in user
router.delete("/thread/:threadId", requireAuth, async (req, res) => {
    try {
        const deletedThread = await Thread.findOneAndDelete({
            threadId: req.params.threadId,
            user: req.user._id
        });

        if (!deletedThread) {
            return res.status(404).json({ error: "Thread not found" });
        }

        res.json({ success: "Thread deleted successfully" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to delete thread" });
    }
});

// Send message and save conversation
router.post("/chat", requireAuth, async (req, res) => {
    const { threadId, message } = req.body;

    if (
        typeof threadId !== "string" ||
        !threadId.trim() ||
        typeof message !== "string" ||
        !message.trim()
    ) {
        return res.status(400).json({
            error: "Valid threadId and message are required"
        });
    }

    try {
        let thread = await Thread.findOne({
            threadId,
            user: req.user._id
        });

        if (!thread) {
            // Do not take over another user's existing thread ID
            const existingThread = await Thread.findOne({ threadId });

            if (existingThread) {
                return res.status(409).json({
                    error: "Thread ID already exists"
                });
            }

            thread = new Thread({
                threadId,
                user: req.user._id,
                title: message.trim().slice(0, 80),
                messages: [{ role: "user", content: message.trim() }]
            });
        } else {
            thread.messages.push({
                role: "user",
                content: message.trim()
            });
        }

        const assistantReply = await getGeminiAIAPIResponse(message.trim());

        if (!assistantReply) {
            return res.status(503).json({
                error: "AI service temporarily unavailable"
            });
        }

        thread.messages.push({
            role: "assistant",
            content: assistantReply
        });

        thread.updatedAt = new Date();
        await thread.save();

        res.json({ reply: assistantReply });
    } catch (err) {
        console.error(err);

        if (err.name === "AbortError") {
            return res.status(504).json({ error: "AI request timed out" });
        }

        if (err.code === 11000) {
            return res.status(409).json({ error: "Thread ID already exists" });
        }

        res.status(500).json({ error: "Something went wrong" });
    }
});

export default router;
