import Task from '../models/Task.js';
import Comment from '../models/Comment.js';
export const createTask = async (req,res) => {
  const count = await Task.countDocuments({projectId:req.body.projectId});
  const task = await Task.create({...req.body, position:count, creatorId:req.user.id});
  res.json(task);
};
export const getTasks = async (req,res) => {
  const tasks = await Task.find({projectId:req.params.projectId}).sort({position:1});
  res.json(tasks);
};
export const moveTask = async (req,res) => {
  const task = await Task.findByIdAndUpdate(req.params.id, {status:req.body.status, position:req.body.position}, {new:true});
  res.json(task);
};
export const addComment = async (req,res) => {
  const comment = await Comment.create({taskId:req.params.id, authorId:req.user.id, body:req.body.body});
  res.json(comment);
};
export const getComments = async (req,res) => {
  const comments = await Comment.find({taskId:req.params.id}).populate('authorId','name');
  res.json(comments);
};