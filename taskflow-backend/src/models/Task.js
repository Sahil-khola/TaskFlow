import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project" },
    title: { type: String, required: true },
    description: String,
    status: {
      type: String,
      enum: ["TODO", "IN_PROGRESS", "DONE"],
      default: "TODO",
    },
    priority: {
      type: String,
      enum: ["LOW", "MEDIUM", "HIGH"],
      default: "MEDIUM",
    },
    position: Number,
    creatorId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    dueDate: Date,
    assigneeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true },
);
export default mongoose.model("Task", schema);
