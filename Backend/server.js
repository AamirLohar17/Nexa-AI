import express from "express";
import "dotenv/config";
import cors from "cors";
import dns from "dns";
import mongoose from "mongoose";
import session from "express-session";
import MongoStore from "connect-mongo";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";

import User from "./models/User.js";
import chatRoutes from "./routes/chat.js";
import authRoutes from "./routes/auth.js";

dns.setServers(["8.8.8.8", "1.1.1.1"]);

const app = express();
const PORT = 8080;

app.use(express.json());

app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}));

app.use(session({
    name: "connect.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    store: MongoStore.create({
        mongoUrl: process.env.MONGODB_URL,
        collectionName: "sessions"
    }),
    cookie: {
        httpOnly: true,
        secure: false,
        sameSite: "lax",
        maxAge: 24 * 60 * 60 * 1000
    }
}));

passport.use(new LocalStrategy(User.authenticate()));

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use(passport.initialize());
app.use(passport.session());

app.use("/api/auth", authRoutes);
app.use("/api", chatRoutes);

// Test Gemini API — existing functionality preserved
app.post("/test", async (req, res) => {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);

    try {
        const response = await fetch(
            "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.5-flash-lite:generateContent",
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "x-goog-api-key": process.env.GEMINI_API_KEY
                },
                body: JSON.stringify({
                    contents: [{
                        role: "user",
                        parts: [{ text: req.body.content }]
                    }]
                }),
                signal: controller.signal
            }
        );

        if (!response.ok) {
            const error = await response.text();
            return res.status(response.status).json({
                error: "Gemini API Error",
                details: error
            });
        }

        const data = await response.json();
        const reply = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (!reply) {
            return res.status(503).json({
                error: "Gemini returned an empty response"
            });
        }

        res.send(reply);
    } catch (err) {
        if (err.name === "AbortError") {
            return res.status(504).json({
                error: "Gemini request timed out"
            });
        }

        console.error(err);
        res.status(500).json({ error: "Something went wrong" });
    } finally {
        clearTimeout(timeout);
    }
});

app.use((err, req, res, next) => {
    console.error(err);
    res.status(500).json({ error: "Internal server error" });
});

const startServer = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URL);
        console.log("Connected with DB");

        if (!process.env.SESSION_SECRET) {
            throw new Error("SESSION_SECRET is missing from .env");
        }

        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    } catch (err) {
        console.error("Failed to start server:", err.message);
        process.exit(1);
    }
};

startServer();
