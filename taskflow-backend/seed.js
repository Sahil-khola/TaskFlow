import dotenv from 'dotenv';
dotenv.config();

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import Task from './src/models/Task.js';
import Comment from './src/models/Comment.js';

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (d) => new Date(Date.now() + d * DAY);

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

    const [owner, admin, member] = await User.create([
      { name: 'Owner', email: 'owner@gmail.com', password: hash },
      { name: 'sahil', email: 'sahil@gmail.com', password: hash },
      { name: 'karan', email: 'karan@gmail.com', password: hash },
    ]);

    // Membership alag alag rakhi hai taaki permissions bhi test ho sakein:
    // project 2 me Member nahi hai, aur project 3 me Owner khud member nahi hai
    // (sirf admin ko admin banaya gaya) — isse role-based access check dikhta hai.
    const projects = await Project.create([
      {
        name: 'TaskFlow Website',
        description: 'Public marketing site and documentation',
        ownerId: owner._id,
        members: [
          { userId: owner._id, role: 'OWNER' },
          { userId: admin._id, role: 'ADMIN' },
          { userId: member._id, role: 'MEMBER' },
        ],
      },
      {
        name: 'Mobile App Redesign',
        description: 'Rebuilding the mobile experience from scratch',
        ownerId: owner._id,
        members: [
          { userId: owner._id, role: 'OWNER' },
          { userId: admin._id, role: 'ADMIN' },
        ],
      },
      {
        name: 'Internal Tools',
        description: 'Small utilities used by the ops team',
        ownerId: admin._id,
        members: [
          { userId: admin._id, role: 'OWNER' },
          { userId: member._id, role: 'MEMBER' },
        ],
      },
    ]);

    // Task banate waqt position usi status ke column ke andar hona chahiye,
    // isliye har project+status ka apna counter rakha hai.
    const counters = new Map();

    const seedTasks = [
      // --- Project 1: TaskFlow Website (4 tasks) ---
      { p: 0, title: 'Build the landing page', description: 'Hero section, feature grid and pricing table', priority: 'HIGH', status: 'TODO', assigneeId: member._id, creatorId: owner._id, dueDate: daysFromNow(5) },
      { p: 0, title: 'Fix broken login redirect', description: 'Successful login lands on the wrong route', priority: 'HIGH', status: 'IN_PROGRESS', assigneeId: admin._id, creatorId: owner._id, dueDate: daysFromNow(2) },
      { p: 0, title: 'Write API documentation', description: 'Document every auth and project endpoint', priority: 'MEDIUM', status: 'TODO', assigneeId: member._id, creatorId: owner._id, dueDate: daysFromNow(12) },
      { p: 0, title: 'Set up CI pipeline', description: 'Lint and build on every pull request', priority: 'LOW', status: 'DONE', assigneeId: owner._id, creatorId: owner._id, dueDate: daysFromNow(-3) },

      // --- Project 2: Mobile App Redesign (4 tasks) ---
      { p: 1, title: 'Design the onboarding flow', description: 'Four screens with a skip option', priority: 'HIGH', status: 'TODO', assigneeId: admin._id, creatorId: owner._id, dueDate: daysFromNow(8) },
      { p: 1, title: 'Migrate task list to virtual scrolling', description: 'List stutters past 500 rows', priority: 'MEDIUM', status: 'IN_PROGRESS', assigneeId: admin._id, creatorId: admin._id, dueDate: daysFromNow(4) },
      { p: 1, title: 'Add offline mode', description: 'Queue writes locally and sync when online', priority: 'LOW', status: 'TODO', assigneeId: owner._id, creatorId: owner._id, dueDate: daysFromNow(-6) }, // overdue
      { p: 1, title: 'Ship beta to internal testers', description: 'TestFlight build with crash reporting', priority: 'HIGH', status: 'DONE', assigneeId: admin._id, creatorId: owner._id, dueDate: daysFromNow(-2) },

      // --- Project 3: Internal Tools (4 tasks) ---
      { p: 2, title: 'Bulk member import', description: 'Accept a CSV and create accounts in one pass', priority: 'MEDIUM', status: 'TODO', assigneeId: member._id, creatorId: admin._id, dueDate: daysFromNow(7) },
      { p: 2, title: 'Audit log viewer', description: 'Show who changed what and when', priority: 'LOW', status: 'TODO', assigneeId: null, creatorId: admin._id, dueDate: daysFromNow(15) },
      { p: 2, title: 'Fix timezone bug in reports', description: 'Reports show the wrong day for evening logins', priority: 'HIGH', status: 'IN_PROGRESS', assigneeId: member._id, creatorId: admin._id, dueDate: daysFromNow(-4) }, // overdue
      { p: 2, title: 'Add health check endpoint', description: 'Used by the deploy pipeline to verify readiness', priority: 'LOW', status: 'DONE', assigneeId: owner._id, creatorId: admin._id, dueDate: daysFromNow(-9) },
    ];

    const createdTasks = [];
    for (const t of seedTasks) {
      const key = `${t.p}:${t.status}`;
      const position = counters.get(key) ?? 0;
      counters.set(key, position + 1);

      const task = await Task.create({
        projectId: projects[t.p]._id,
        title: t.title,
        description: t.description,
        priority: t.priority,
        status: t.status,
        assigneeId: t.assigneeId,
        creatorId: t.creatorId,
        dueDate: t.dueDate,
        position,
      });
      createdTasks.push(task);
    }

    // Comments task #3 aur #4 par (1-indexed)
    await Comment.create([
      { taskId: createdTasks[2]._id, authorId: owner._id, body: 'Start with the auth endpoints, those are the most requested.' },
      { taskId: createdTasks[3]._id, authorId: member._id, body: 'Pipeline is green on the first run.' },
    ]);

    // Overdue = dueDate nikal chuka hai aur task DONE nahi hai.
    // DONE wale tasks bhi past dueDate rakhe hain, wo overdue NAHI hote.
    const overdue = await Task.find({
      dueDate: { $lt: new Date() },
      status: { $ne: 'DONE' },
    }).countDocuments();

    console.log('Seed done');
    console.log(`Users: ${await User.countDocuments()} | Projects: ${await Project.countDocuments()} | Tasks: ${await Task.countDocuments()} | Comments: ${await Comment.countDocuments()}`);
    console.log(`Overdue tasks: ${overdue}`);
    console.log('\nLogin karne ke liye (password sabka password123):');
    for (const u of [owner, admin, member]) console.log(`  ${u.email}`);

    await mongoose.connection.close();
  } catch (error) {
    console.error('Seed error:', error.message);
    process.exit(1);
  }
};

connect();
