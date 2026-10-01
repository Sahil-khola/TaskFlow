import mongoose from 'mongoose';
const schema = new mongoose.Schema({
  name: String,
  description: String,
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  members: [{ userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, role: { type: String, enum: ['OWNER','ADMIN','MEMBER'], default: 'MEMBER' } }]
},{timestamps:true});
export default mongoose.model('Project', schema);