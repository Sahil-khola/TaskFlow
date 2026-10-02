import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const signup = async (req,res) => {
try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
        return res.status(400).json({ msg: "All fields are required" });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
        return res.status(409).json({ msg: "User already exists" });
    }
    
    const hash = await bcrypt.hash(password, 10);
    const user = await User.create({ name, email, password: hash });

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

    const user = await User.findOne({ email });
    if (!user) {
        return res.status(401).json({ success: false, msg: "Invalid email or password" });
    }

    const ok = await bcrypt.compare(password, user.password);
    if (!ok) {
        return res.status(401).json({ success: false, msg: "Invalid password" });
    }

    const accessToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET,{ expiresIn: "7d" });

    res.cookie('token', accessToken, {
        httpOnly: true,
        secure: false,            
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

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
    if (!req.user || !req.user.id) {
      return res.status(401).json({ success: false, msg: "Unauthorized" });
    }

    const user = await User.findById(req.user.id).select("-password");
    if (!user) {
      return res.status(404).json({ success: false, msg: "User not found" });
    }

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


const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const searchUsers = async (req, res) => {
  try {
    const { email } = req.query;

    if (!email || String(email).trim().length < 3) {
      return res.status(400).json({ success: false, msg: "Enter at least 3 characters to search" });
    }

    const users = await User.find({
      email: { $regex: escapeRegex(String(email).trim()), $options: "i" },
    })
      .select("_id name email")
      .limit(10);

    res.status(200).json({
      success: true,
      msg: "Users fetched successfully",
      data: users,
    });
  } catch (error) {
    console.error("SearchUsers error:", error);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};