import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const signup = async (req,res) => {
try {
    const { name, email, password } = req.body;

    // Validate input
    if (!name || !email || !password) {
      return res.status(400).json({ msg: "All fields are required" });
    }

    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(409).json({ msg: "User already exists" });
    }
    
    // Create user
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

    // Success response (exclude password)
    res.status(201).json({
      msg: "User registered successfully",
      user: { id: user._id, name: user.name, email: user.email }
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ msg: "Internal server error" });
  }
};




export const login = async (req,res) => {
try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, msg: "Email and password are required" });
    }

    // Check if user exists
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, msg: "Invalid email or password" });
    }

    // Compare password
    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
      return res.status(401).json({ success: false, msg: "Invalid password" });
    }

    // Generate JWT (7 days)
    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET,{ expiresIn: "7d" });

    // Token httpOnly cookie me — JS ise padh nahi sakta, isliye XSS se chori nahi ho sakti
    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: false,            // localhost pe HTTPS nahi hai; production me true karo
        sameSite: 'Lax',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Token body me nahi bhejte — wahi cookie hai. Sirf safe user data.
    res.status(200).json({
      success: true,
      msg: "Login successful",
      data: {
        user: { id: user._id, name: user.name, email: user.email }
      }
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};



export const getMe = async (req,res) => {
  try {
    // Ensure req.user exists (set by auth middleware)
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    // Find user and exclude password
    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

    // Success response
    res.status(200).json({
      success: true,
      msg: "User profile fetched successfully",
      data: { user }
    });
  } catch (error) {
    console.error("GetMe error:", error);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};