import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import Task from './src/models/Task.js';
import Comment from './src/models/Comment.js';

const connect = async () => {
  try {
    await connectDB();

    // Purana data hata do taaki seed baar baar same result de
    await Promise.all([
      User.deleteMany({}),
      Project.deleteMany({}),
      Task.deleteMany({}),
      Comment.deleteMany({}),
    ]);

    // Sab ka password same rakha hai taaki login test karne me asaani ho
    const hash = await bcrypt.hash('password123', 10);

    const owner = await User.create({ name: 'Owner', email: 'owner@taskflow.com', password: hash });
    const admin = await User.create({ name: 'Admin', email: 'admin@taskflow.com', password: hash });
    const member = await User.create({ name: 'Member', email: 'member@taskflow.com', password: hash });
    const outsider = await User.create({ name: 'Outsider', email: 'outsider@taskflow.com', password: hash });

    const project = await Project.create({
      name: 'TaskFlow Project',
      description: 'Demo project for testing',
      ownerId: owner._id,
      members: [
        { userId: owner._id, role: 'OWNER' },
        { userId: admin._id, role: 'ADMIN' },
        { userId: member._id, role: 'MEMBER' },
      ],
    });

    // Task banate waqt position usi status ke column ke andar hona chahiye,
    // isliye har status ka counter alag rakha hai
    const statusCount = { TODO: 0, IN_PROGRESS: 0, DONE: 0 };

    const seedTasks = [
      { title: 'Login page banaiye', description: 'Form aur validation', priority: 'HIGH', status: 'TODO', assigneeId: member._id, creatorId: owner._id, dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000) },
      { title: 'Kanban board ka drag and drop', description: 'dnd-kit se reorder', priority: 'HIGH', status: 'TODO', assigneeId: admin._id, creatorId: owner._id, dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000) },
      { title: 'Project members list', description: 'Owner aur Admin role change kar sakte hain', priority: 'MEDIUM', status: 'IN_PROGRESS', assigneeId: member._id, creatorId: owner._id, dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) },
      { title: 'Comment feature', description: 'Har task pe comments', priority: 'LOW', status: 'IN_PROGRESS', assigneeId: null, creatorId: admin._id, dueDate: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000) },
      { title: 'Auth middleware kaam kar raha hai', description: 'httpOnly cookie se login', priority: 'HIGH', status: 'DONE', assigneeId: owner._id, creatorId: owner._id, dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000) },
      { title: 'Database connect kar liya', description: 'MongoDB se connection', priority: 'MEDIUM', status: 'DONE', assigneeId: admin._id, creatorId: owner._id, dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) },
      // Ye task overdue hai — dueDate pichle ka hai aur status DONE nahi hai
      { title: 'Old pending task', description: 'Ye overdue dikhega', priority: 'LOW', status: 'TODO', assigneeId: member._id, creatorId: owner._id, dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000) },
    ];

    const createdTasks = [];
    for (const t of seedTasks) {
      const task = await Task.create({
        ...t,
        projectId: project._id,
        position: statusCount[t.status]++,
      });
      createdTasks.push(task);
    }

    await Comment.create([
      { taskId: createdTasks[0]._id, authorId: owner._id, body: 'Ye task pehle complete karo' },
      { taskId: createdTasks[0]._id, authorId: member._id, body: 'Kal tak kar dunga' },
      { taskId: createdTasks[2]._id, authorId: admin._id, body: 'Members list bana raha hoon' },
    ]);

    console.log('Seed done');
    console.log(`Users: ${await User.countDocuments()} | Projects: ${await Project.countDocuments()} | Tasks: ${await Task.countDocuments()} | Comments: ${await Comment.countDocuments()}`);
    console.log('Login karne ke liye: owner@taskflow.com / password123');
    console.log(`Outsider project ka member nahi hai: ${outsider.email}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

connect();