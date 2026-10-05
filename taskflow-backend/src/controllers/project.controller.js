import Project from '../models/Project.js';
import User from '../models/User.js';
import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
import mongoose from 'mongoose';


const isManager = (role) => role === 'OWNER' || role === 'ADMIN';

const ASSIGNABLE_ROLES = ['ADMIN', 'MEMBER'];

const loadProjectForUser = async (req, res) => {
  const { id } = req.params;

  if (!mongoose.isValidObjectId(id)) {
    res.status(400).json({ success: false, msg: 'Invalid project id' });
    return null;
  }

  const project = await Project.findById(id);
  if (!project) {
    res.status(404).json({ success: false, msg: 'Project not found' });
    return null;
  }

  const member = project.members.find((m) => m.userId.toString() === req.user.id);
  if (!member) {
    res.status(403).json({ success: false, msg: 'You are not a member of this project' });
    return null;
  }

  return { project, role: member.role };
};

export const createProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name) {
      return res.status(400).json({ success: false, msg: 'Name is required' });
    }

    // Create project — creator isme OWNER ban ke add hota hai
    const project = await Project.create({
      name,
      description: description || '',
      ownerId: req.user.id,
      members: [{ userId: req.user.id, role: 'OWNER' }],
    });

    // Success response
    res.status(201).json({
      success: true,
      msg: 'Project created successfully',
      data: { project },
    });
  } catch (error) {
    console.error('CreateProject error:', error);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

export const getProjects = async (req, res) => {
  try {
    const projects = await Project.find({
      $or: [{ ownerId: req.user.id }, { 'members.userId': req.user.id }],
    }).sort({ updatedAt: -1 });

    res.status(200).json({
      success: true,
      msg: 'Projects fetched successfully',
      data: projects,
    });
  } catch (error) {
    console.error('GetProjects error:', error);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

export const getProjectById = async (req, res) => {
  try {
    const context = await loadProjectForUser(req, res);
    if (!context) return;

    const project = await context.project.populate('members.userId', 'name email');

    res.status(200).json({
      success: true,
      msg: 'Project fetched successfully',
      data: { project },
    });
  } catch (error) {
    console.error('GetProjectById error:', error);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;

    const context = await loadProjectForUser(req, res);
    if (!context) return;

    // Update sirf OWNER ya ADMIN kar sakta hai
    if (!isManager(context.role)) {
      return res.status(403).json({ success: false, msg: 'Owner or Admin access required' });
    }

    if (name) context.project.name = name;
    if (description !== undefined) context.project.description = description;

    const updatedProject = await context.project.save();

    res.status(200).json({
      success: true,
      msg: 'Project updated successfully',
      data: updatedProject,
    });
  } catch (error) {
    console.error('UpdateProject error:', error);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const context = await loadProjectForUser(req, res);
    if (!context) return;

    // Delete sirf OWNER kar sakta hai
    if (context.role !== 'OWNER') {
      return res.status(403).json({ success: false, msg: 'Only Owner can delete this project' });
    }

    const projectId = context.project._id;

    // Sirf project hatane se uske tasks aur comments database me orphaned
    // reh jate — unka projectId ab kisi valid document ko point nahi karta.
    // Isliye pehle child records clean karo, phir project.
    const tasks = await Task.find({ projectId }).select('_id');
    const taskIds = tasks.map((t) => t._id);

    if (taskIds.length) {
      await Comment.deleteMany({ taskId: { $in: taskIds } });
    }
    await Task.deleteMany({ projectId });
    await Project.deleteOne({ _id: projectId });

    res.status(200).json({
      success: true,
      msg: 'Project deleted successfully',
      data: { deletedTasks: taskIds.length },
    });
  } catch (error) {
    console.error('DeleteProject error:', error);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

// Add Member (Only Owner)
export const addMember = async (req, res) => {
  try {
    const { userId, role } = req.body;

    if (!userId) {
      return res.status(400).json({ success: false, msg: 'userId is required' });
    }
    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, msg: 'Invalid userId' });
    }
    const assignRole = role || 'MEMBER';
    if (!ASSIGNABLE_ROLES.includes(assignRole)) {
      return res.status(400).json({
        success: false,
        msg: `Invalid role. Only ${ASSIGNABLE_ROLES.join(' or ')} can be assigned`,
      });
    }

    const context = await loadProjectForUser(req, res);
    if (!context) return;

    // Only Owner can add members
    if (context.role !== 'OWNER') {
      return res.status(403).json({ success: false, msg: 'Only Owner can add members' });
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, msg: 'User not found' });
    }

    const existing = context.project.members.find((m) => m.userId.toString() === userId);
    if (existing) return res.status(400).json({ success: false, msg: 'Already a member' });

    context.project.members.push({ userId, role: assignRole });
    await context.project.save();

    const updated = await context.project.populate('members.userId', 'name email');
    res.status(200).json({
      success: true,
      msg: 'Member added successfully',
      data: updated,
    });
  } catch (err) {
    console.error('AddMember error:', err);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};

// Remove Member (Only Owner)
export const removeMember = async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.isValidObjectId(userId)) {
      return res.status(400).json({ success: false, msg: 'Invalid userId' });
    }

    const context = await loadProjectForUser(req, res);
    if (!context) return;

    if (context.role !== 'OWNER') {
      return res.status(403).json({ success: false, msg: 'Only Owner can remove members' });
    }

    if (context.project.ownerId.toString() === userId) {
      return res.status(400).json({ success: false, msg: 'Owner cannot remove themselves' });
    }

    const isMember = context.project.members.some((m) => m.userId.toString() === userId);
    if (!isMember) {
      return res.status(404).json({ success: false, msg: 'Member not found in this project' });
    }

    context.project.members = context.project.members.filter((m) => m.userId.toString() !== userId);
    await context.project.save();

   
    await Task.updateMany(
      { projectId: context.project._id, assigneeId: userId },
      { $set: { assigneeId: null } },
    );

    res.status(200).json({
      success: true,
      msg: 'Member removed successfully',
    });
  } catch (err) {
    console.error('RemoveMember error:', err);
    res.status(500).json({ success: false, msg: 'Internal server error' });
  }
};