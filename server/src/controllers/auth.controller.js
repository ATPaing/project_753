import User from "../models/User.model.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

export const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: "User already exists" });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create new user
        const user = await User.create({
            name,
            email,
            passwordHash,
        });

        // generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            },
        );

        res.status(201).json({
            message: "User created successfully",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                reliabilityScore: user.reliabilityScore,
            },
        });
    } catch (error) {
        console.error("Error during sign up:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        // Check if user exists
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }
        // Check password
        const isMatch = await bcrypt.compare(password, user.passwordHash);

        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        // Generate JWT token
        const token = jwt.sign(
            {
                userId: user._id,
            },
            process.env.JWT_SECRET,
            {
                expiresIn: "7d",
            },
        );

        res.status(200).json({
            message: "Login successful",
            token,
            user: {
                id: user._id,
                name: user.name,
                email: user.email,
                reliabilityScore: user.reliabilityScore,
            },
        });
    } catch (error) {
        console.error("Error during login:", error);
        res.status(500).json({ message: "Server error" });
    }
};

export const getMe = async (req, res) => {
    try {
        console.log(req.userId)
        const user = await User.findById(req.userId).select("-passwordHash");

        if (!user) {
            return res.status(404).json({ message: "User not found" });
        }
        res.status(200).json({
            id: user._id,
            name: user.name,
            email: user.email,
            reliabilityScore: user.reliabilityScore,
        });
    }
    catch (error) {
        console.error("Error fetching user data:", error);
        res.status(500).json({ message: "Server error" });
    }
};