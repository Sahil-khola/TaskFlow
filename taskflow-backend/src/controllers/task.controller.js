import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import mongoose from "mongoose";
export const createTask = async (req, res) => {
  try {
    const { projectId, title, description, priority, dueDate, assigneeId } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ success: false, msg: "ProjectId and title are required" });
    }

    const count = await Task.countDocuments({ projectId });

    const task = await Task.create({
      projectId: new mongoose.Types.ObjectId(projectId), // ✅ ensure ObjectId
      title,
      description,
      priority: priority || "MEDIUM",
      status: "TODO",
      dueDate,
      assigneeId,
      creatorId: req.user.id,
      position: count,
    });

    res.status(201).json({
      success: true,
      msg: "Task created successfully",
      data: task
    });
  } catch (err) {
    console.error("CreateTask error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};



export const getTasksByProject = async (req, res) => {
  try {
    const { status, priority, assigneeId, search } = req.query;

  let filter = { projectId: req.params.id };


    if (status) filter.status = status;
    if (priority) filter.priority = priority;
    if (assigneeId) filter.assigneeId = assigneeId;
    if (search) filter.title = { $regex: search, $options: "i" }; // case-insensitive search

    const tasks = await Task.find(filter)
      .sort({ position: 1 })
      .populate("assigneeId", "name email");
const task = await Task.findOne();
console.log(task.projectId); // check actual type

    res.status(200).json({
      success: true,
      msg: "Tasks fetched successfully",
      data: tasks
    });
  } catch (err) {
    console.error("GetTasksByProject error:", err);
    res.status(500).json({ success: false, msg: err.message });
  }
};


export const moveTask = async (req, res) => {
  try {
    const { status, position } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { status, position },
      { new: true },
    );
    if (!task) return res.status(404).json({ msg: "Task nahi mila" });
    res.json(task);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const myTasks = async (req, res) => {
  try {
    // Find tasks where user is creator OR assignee
    const tasks = await Task.find({
      $or: [{ creatorId: req.user.id }, { assigneeId: req.user.id }],
    });

    res.status(200).json({
      success: true,
      msg: "My tasks fetched successfully",
      data: tasks,
    });
  } catch (error) {
    console.error("MyTasks error:", error);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

// --- COMMENT WALA PART ---

export const addComment = async (req, res) => {
  try {
    const comment = await Comment.create({
      taskId: req.params.id,
      authorId: req.user.id,
      body: req.body.body,
    });
    const populated = await comment.populate("authorId", "name email");
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};

export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ taskId: req.params.id })
      .populate("authorId", "name email")
      .sort({ createdAt: 1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ msg: err.message });
  }
};
