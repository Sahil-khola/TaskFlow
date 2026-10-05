import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// cwd ho root ho backend, .env hamesha seed.js ke saath chalega
dotenv.config({ path: path.join(__dirname, '.env') });

import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import connectDB from './src/config/db.js';
import User from './src/models/User.js';
import Project from './src/models/Project.js';
import Task from './src/models/Task.js';
import Comment from './src/models/Comment.js';

// determinism ke liye seeded RNG — dobara run karne par bhi same data milega
let _s = 0x2F5D;
const rng = () => { _s = (_s * 1103515245 + 12345) & 0x7fffffff; return _s / 0x7fffffff; };
const randRange = (lo, hi) => Math.floor(rng() * (hi - lo + 1)) + lo;
const pick = (arr) => arr[Math.floor(rng() * arr.length)];

const DAY = 24 * 60 * 60 * 1000;
const daysFromNow = (d) => new Date(Date.now() + d * DAY);

const TASK_TITLES = [
  'Refine the spec and lock acceptance criteria',
  'Set up the dev environment with lint + typecheck',
  'Draft the first cut of API contracts',
  'Build the landing page hero section',
  'Wire up authentication and role checks',
  'Add unit tests for the core modules',
  'Write the README and setup docs',
  'Run an accessibility audit on the dashboard',
  'Profile and fix the slow report query',
  'Add drag-and-drop to the task board',
  'Implement notifications for assigned tasks',
  'Ship the beta to internal testers',
];

const COMMENT_BODIES = [
  'Looks good to me, ship it.',
  'Can we clarify the acceptance criteria here?',
  'Nice — this matches what we discussed.',
  'One edge case: what happens if the payload is empty?',
  'Docs should mention the fallback behaviour.',
  'Let me know when this is on staging.',
  'Worth pulling the team to review this one.',
  'LGTM, just one small comment above.',
];

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
      { name: 'neeraj', email: 'neeraj@gmail.com', password: hash },
      { name: 'sahil', email: 'sahil@gmail.com', password: hash },
      { name: 'karan', email: 'karan@gmail.com', password: hash },
    ]);

    const roles = [
      { userId: owner._id, role: 'OWNER' },
      { userId: admin._id, role: 'ADMIN' },
      { userId: member._id, role: 'MEMBER' },
    ];

    // Membership alag alag rakhi hai taaki permissions bhi test ho sakein.
    // Har project ka ek OWNER hota hai — wahi ownerId hai.
    const ownership = [
      owner._id, owner._id, admin._id, // cycle so Owner/Admin alternate owning
      owner._id, admin._id, owner._id,
      admin._id, owner._id, admin._id,
      owner._id, admin._id, owner._id,
    ];
    // har project ke liye kaunke members honge (owner hamesha)
    const membershipPlan = [
      [roles[0], roles[1], roles[2]], // Owner, Admin, Member
      [roles[0], roles[1]],          // Owner, Admin
      [roles[1], roles[2]],          // Admin(Owner), Member
      [roles[0], roles[2]],          // Owner, Member
      [roles[0], roles[1], roles[2]],
      [roles[2], roles[1]],          // Member(Owner), Admin
      [roles[0], roles[1]],
      [roles[1], roles[2]],
      [roles[0], roles[2]],
      [roles[0], roles[1], roles[2]],
      [roles[0], roles[1]],
      [roles[1], roles[2]],
    ];

    const projectDefs = [
      { name: 'TaskFlow Website', desc: 'Public marketing site and documentation' },
      { name: 'Mobile App Redesign', desc: 'Rebuilding the mobile experience from scratch' },
      { name: 'Internal Tools', desc: 'Small utilities used by the ops team' },
      { name: 'Admin Console v2', desc: 'Second-generation admin dashboard' },
      { name: 'Payments Rewrite', desc: 'Migrating checkout to the new provider' },
      { name: 'Analytics Pipeline', desc: 'Collect, store and visualise usage events' },
      { name: 'Customer Portal', desc: 'Self-service space for enterprise clients' },
      { name: 'API Gateway', desc: 'Unified ingress for all backend services' },
      { name: 'Design System', desc: 'Shared components and token library' },
      { name: 'Data Migration Tool', desc: 'One-off tool to move legacy records' },
      { name: 'Notification Service', desc: 'Email, push and in-app notifications' },
      { name: 'Search & Discovery', desc: 'Global search across all products' },
    ];

    const projects = await Project.create(
      projectDefs.map((p, i) => ({
        name: p.name,
        description: p.desc,
        ownerId: ownership[i],
        members: membershipPlan[i],
      })),
    );

    // Task banate waqt position usi status ke column ke andar hona chahiye,
    // isliye har project+status ka apna counter rakha hai.
    const counters = new Map();
    const createdTasks = [];

    // Har project ke liye 4-6 random tasks banaye
    for (let pi = 0; pi < projects.length; pi++) {
      const proj = projects[pi];
      // sirf usi project ke members se assign karo (owner included)
      const candidateAssignees = membershipPlan[pi]
        .filter(r => r.role !== 'OWNER')
        .map(r => r.userId);
      const taskCount = randRange(4, 6);
      for (let ti = 0; ti < taskCount; ti++) {
        const status = pick(['TODO', 'IN_PROGRESS', 'DONE']);
        const key = `${pi}:${status}`;
        const position = counters.get(key) ?? 0;
        counters.set(key, position + 1);

        const assigneePool = [...candidateAssignees, owner._id];
        const assigneeId = rng() < 0.15 ? null : pick(assigneePool);

        const task = await Task.create({
          projectId: proj._id,
          title: pick(TASK_TITLES),
          description: 'Covers the work tracked on this card.',
          priority: pick(['LOW', 'MEDIUM', 'HIGH']),
          status,
          assigneeId,
          creatorId: proj.ownerId,
          dueDate: daysFromNow(randRange(-10, 14)),
          position,
        });
        createdTasks.push({ task, projectMembers: membershipPlan[pi] });
      }
    }

    // Har project ke liye 4-7 comments — random tasks par spread.
    const perProject = new Map();
    for (const { task, projectMembers } of createdTasks) {
      const arr = perProject.get(task.projectId) ?? [];
      arr.push({ task, projectMembers });
      perProject.set(task.projectId, arr);
    }

    for (const [, items] of perProject) {
      const commentCount = randRange(4, 7);
      for (let c = 0; c < commentCount; c++) {
        const { task, projectMembers } = pick(items);
        const author = pick(projectMembers).userId;
        await Comment.create({
          taskId: task._id,
          authorId: author,
          body: pick(COMMENT_BODIES),
        });
      }
    }

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
