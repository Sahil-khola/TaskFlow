import Project from '../models/Project.js';
export const createProject = async (req,res) => {
  const project = await Project.create({
    name: req.body.name,
    description: req.body.description,
    ownerId: req.user.id,
    members: [{userId:req.user.id, role:'OWNER'}]
  });
  res.json(project);
};

export const getProjects = async (req,res) => {
  const projects = await Project.find({'members.userId': req.user.id});
  res.json(projects);
};
export const getProjectById = async (req,res) => {
  const project = await Project.findOne({_id:req.params.id, 'members.userId':req.user.id});
  if(!project) return res.status(404).json({msg:"Project nahi mila"});
  res.json(project);
};