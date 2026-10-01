import mongoose from "mongoose";

const connectDB = async () => {
  try {
    console.log("Trying to connect with:", process.env.MONGO_URL); // check karne ke liye
    const conn = await mongoose.connect(process.env.MONGO_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.log("DB Error:", error.message);
    process.exit(1);
  }
}

export default connectDB;