import User from '../models/User.model.js';
import bcrypt from 'bcryptjs';

export const signUp = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });

        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const salt = await bcrypt.genSalt(10);
        const passwordHash = await bcrypt.hash(password, salt);

        // Create new user
        const user = await User.create({
            name,
            email,
            passwordHash
        });

        res.status(201).json({ message: 'User created successfully', user});

    } catch (error) {
        console.error('Error during sign up:', error);
        res.status(500).json({ message: 'Server error' });
    }
}