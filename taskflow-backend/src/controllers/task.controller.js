import Task from "../models/Task.js";
import Comment from "../models/Comment.js";
import Project from "../models/Project.js";
import mongoose from "mongoose";

// --- Task ke possible status aur priority ---
const STATUSES = ["TODO", "IN_PROGRESS", "DONE"];
const PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const isManager = (role) => role === "OWNER" || role === "ADMIN";

const loadProjectForUser = async (req, res, projectId) => {
  if (!mongoose.isValidObjectId(projectId)) {
    res.status(400).json({ success: false, msg: "Invalid project id" });
    return null;
  }

  const project = await Project.findById(projectId);
  if (!project) {
    res.status(404).json({ success: false, msg: "Project not found" });
    return null;
  }

  const member = project.members.find((m) => m.userId.toString() === req.user.id);
  if (!member) {
    res.status(403).json({ success: false, msg: "You are not a member of this project" });
    return null;
  }

  return { project, role: member.role };
};

const loadTaskForUser = async (req, res, taskId) => {
  if (!mongoose.isValidObjectId(taskId)) {
    res.status(400).json({ success: false, msg: "Invalid task id" });
    return null;
  }

  const task = await Task.findById(taskId);
  if (!task) {
    res.status(404).json({ success: false, msg: "Task not found" });
    return null;
  }

  const context = await loadProjectForUser(req, res, task.projectId);
  if (!context) return null;

  return { task, project: context.project, role: context.role };
};

const escapeRegex = (text) => String(text).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

export const createTask = async (req, res) => {
  try {
    const { projectId, title, description, priority, status, dueDate, assigneeId } = req.body;

    if (!projectId || !title) {
      return res.status(400).json({ success: false, msg: "ProjectId and title are required" });
    }

    if (priority && !PRIORITIES.includes(priority)) {
      return res.status(400).json({ success: false, msg: `Invalid priority. Use ${PRIORITIES.join(", ")}` });
    }
    if (status && !STATUSES.includes(status)) {
      return res.status(400).json({ success: false, msg: `Invalid status. Use ${STATUSES.join(", ")}` });
    }

    const context = await loadProjectForUser(req, res, projectId);
    if (!context) return;

    if (assigneeId) {
      if (!mongoose.isValidObjectId(assigneeId)) {
        return res.status(400).json({ success: false, msg: "Invalid assigneeId" });
      }
      const isMember = context.project.members.some((m) => m.userId.toString() === assigneeId);
      if (!isMember) {
        return res.status(403).json({ success: false, msg: "Assignee is not a member of this project" });
      }
    }

    const taskStatus = status || "TODO";

    const count = await Task.countDocuments({ projectId, status: taskStatus });

    const task = await Task.create({
      projectId,
      title,
      description: description || "",
      priority: priority || "MEDIUM",
      status: taskStatus,
      dueDate: dueDate || null,
      assigneeId: assigneeId || null,
      creatorId: req.user.id,
      position: count,
    });

    res.status(201).json({
      success: true,
      msg: "Task created successfully",
      data: task,
    });
  } catch (err) {
    console.error("CreateTask error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const getTasksByProject = async (req, res) => {
  try {
    const { projectId } = req.params;
    const { status, priority, assigneeId, search } = req.query;

    const context = await loadProjectForUser(req, res, projectId);
    if (!context) return;

    const filter = { projectId };

    if (status) {
      if (!STATUSES.includes(status)) {
        return res.status(400).json({ success: false, msg: `Invalid status. Use ${STATUSES.join(", ")}` });
      }
      filter.status = status;
    }
    if (priority) {
      if (!PRIORITIES.includes(priority)) {
        return res.status(400).json({ success: false, msg: `Invalid priority. Use ${PRIORITIES.join(", ")}` });
      }
      filter.priority = priority;
    }
    if (assigneeId) {
      if (assigneeId === "unassigned") filter.assigneeId = null;
      else if (mongoose.isValidObjectId(assigneeId)) filter.assigneeId = assigneeId;
      else return res.status(400).json({ success: false, msg: "Invalid assigneeId" });
    }
    if (search) {
      filter.title = { $regex: escapeRegex(search), $options: "i" };
    }

    const tasks = await Task.find(filter)
      .sort({ status: 1, position: 1, createdAt: 1 })
      .populate("assigneeId", "name email");

    res.status(200).json({
      success: true,
      msg: "Tasks fetched successfully",
      data: tasks,
    });
  } catch (err) {
    console.error("GetTasksByProject error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const moveTask = async (req, res) => {
  try {
    const { status, position } = req.body;

    const context = await loadTaskForUser(req, res, req.params.id);
    if (!context) return;
    const { task, role } = context;

    if (!STATUSES.includes(status)) {
      return res.status(400).json({ success: false, msg: `Invalid status. Use ${STATUSES.join(", ")}` });
    }
    if (position === undefined || position === null || !Number.isFinite(Number(position)) || Number(position) < 0) {
      return res.status(400).json({ success: false, msg: "position must be a number >= 0" });
    }

    const isOwnTask = task.assigneeId && task.assigneeId.toString() === req.user.id;
    if (!isManager(role) && !isOwnTask) {
      return res.status(403).json({ success: false, msg: "You can only move tasks assigned to you" });
    }

    task.status = status;
    task.completedAt = status === "DONE" ? task.completedAt || new Date() : null;
    await task.save();

    const siblings = await Task.find({ projectId: task.projectId, status }).sort({ position: 1, createdAt: 1 }).select("_id");
    const ids = siblings
      .map((t) => t._id.toString())
      .filter((id) => id !== task._id.toString());

    const index = Math.min(Math.max(0, Number(position)), ids.length);
    ids.splice(index, 0, task._id.toString());

    await Task.bulkWrite(
      ids.map((id, i) => ({
        updateOne: { filter: { _id: id }, update: { $set: { position: i } } },
      })),
    );

    const updated = await Task.findById(task._id).populate("assigneeId", "name email");
    res.status(200).json({
      success: true,
      msg: "Task moved successfully",
      data: updated,
    });
  } catch (err) {
    console.error("MoveTask error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const myTasks = async (req, res) => {
  try {
    const projects = await Project.find({ members: { $elemMatch: { userId: req.user.id } } }).select("_id");
    const projectIds = projects.map((p) => p._id);

    const tasks = await Task.find({
      projectId: { $in: projectIds },
      $or: [{ creatorId: req.user.id }, { assigneeId: req.user.id }],
    })
      .sort({ dueDate: 1, status: 1 })
      .populate("assigneeId", "name email")
      .populate("projectId", "name");

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
    const { body } = req.body;
    if (!body || !body.trim()) {
      return res.status(400).json({ success: false, msg: "Comment body is required" });
    }

    const context = await loadTaskForUser(req, res, req.params.id);
    if (!context) return;

    const comment = await Comment.create({
      taskId: context.task._id,
      authorId: req.user.id,
      body,
    });
    const populated = await comment.populate("authorId", "name email");

    res.status(201).json({
      success: true,
      msg: "Comment added successfully",
      data: populated,
    });
  } catch (err) {
    console.error("AddComment error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const getComments = async (req, res) => {
  try {
    // Listing pe bhi wahi membership rule
    const context = await loadTaskForUser(req, res, req.params.id);
    if (!context) return;

    const comments = await Comment.find({ taskId: context.task._id })
      .populate("authorId", "name email")
      .sort({ createdAt: 1 });

    res.status(200).json({
      success: true,
      msg: "Comments fetched successfully",
      data: comments,
    });
  } catch (err) {
    console.error("GetComments error:", err);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};