import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    taskId: { type: mongoose.Schema.Types.ObjectId, ref: "Task" },
    authorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    body: String,
  },
  { timestamps: true },
);
export default mongoose.model("Comment", schema);
