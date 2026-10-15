import express from "express";
import passport from "passport";
import User from "../models/User.js";

const router = express.Router();

// Signup
router.post("/signup", async (req, res, next) => {
    try {
        const { username, email, password } = req.body;

        if (!username?.trim() || !email?.trim() || !password) {
            return res.status(400).json({
                error: "Username, email and password are required"
            });
        }

        if (password.length < 8) {
            return res.status(400).json({
                error: "Password must be at least 8 characters"
            });
        }

        const existingUser = await User.findOne({
            $or: [
                { username: username.trim() },
                { email: email.trim().toLowerCase() }
            ]
        });

        if (existingUser) {
            return res.status(409).json({
                error: "Username or email already exists"
            });
        }

        const user = new User({
            username: username.trim(),
            email: email.trim().toLowerCase()
        });

        await User.register(user, password);

        req.login(user, (err) => {
            if (err) return next(err);

            res.status(201).json({
                message: "Signup successful",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        });
    } catch (err) {
        if (err.name === "UserExistsError" || err.code === 11000) {
            return res.status(409).json({
                error: "Username or email already exists"
            });
        }

        next(err);
    }
});

// Login
router.post("/login", (req, res, next) => {
    passport.authenticate("local", (err, user, info) => {
        if (err) return next(err);

        if (!user) {
            return res.status(401).json({
                error: info?.message || "Invalid username or password"
            });
        }

        req.login(user, (loginErr) => {
            if (loginErr) return next(loginErr);

            res.json({
                message: "Login successful",
                user: {
                    id: user._id,
                    username: user.username,
                    email: user.email
                }
            });
        });
    })(req, res, next);
});

// Current logged-in user
router.get("/me", (req, res) => {
    if (!req.isAuthenticated()) {
        return res.status(401).json({ error: "Not logged in" });
    }

    res.json({
        user: {
            id: req.user._id,
            username: req.user.username,
            email: req.user.email
        }
    });
});

// Logout
router.post("/logout", (req, res, next) => {
    req.logout((err) => {
        if (err) return next(err);

        req.session.destroy((sessionErr) => {
            if (sessionErr) return next(sessionErr);

            res.clearCookie("connect.sid");
            res.json({ message: "Logout successful" });
        });
    });
});

export default router;
