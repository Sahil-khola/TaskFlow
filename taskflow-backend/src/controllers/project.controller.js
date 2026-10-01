import Project from '../models/Project.js';


export const createProject = async (req,res) => {
  try {
    const { name, description } = req.body;

    // Validate input
    if (!name || !description) {
      return res.status(400).json({ success: false, msg: "Name and description are required" });
    }

    // Create project
    const project = await Project.create({
      name,
      description,
      ownerId: req.user.id,
      members: [{ userId: req.user.id, role: "OWNER" }]
    });

    // Success response
    res.status(201).json({
      success: true,
      msg: "Project created successfully",
      data: { project }
    });
  } catch (error) {
    console.error("CreateProject error:", error);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const getProjects = async (req, res) => {
  try {
   
    const id = req.user.id;
    const projects = await Project.find({ ownerId: id });
    
    if (!projects) {
      return res.status(404).json({ success: false, msg: "Projects not found" });
    }

    res.status(200).json({
      success: true,
      msg: "Projects fetched successfully",
      data: projects
    });
  } catch (error) {
    console.error("GetProjects error:", error);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const getProjectById = async (req, res) => {
  try {
   
    const id = req.params.id;
    const project = await Project.findById(id);
  
    if (!project) {
      return res.status(404).json({ success: false, msg: "Project not found" });
    }

    res.status(200).json({
      success: true,
      msg: "Project fetched successfully",
      data: project
    });
  } catch (error) {
    console.error("GetProjectById error:", error);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};


export const updateProject = async (req, res) => {
  try {
    const { name, description } = req.body;
    
    // Find project
    const id = req.params.id;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, msg: "Project not found" });
    }

    // Update fields (only if provided)
    if (name) project.name = name;
    if (description) project.description = description;

    const updatedProject = await project.save();

    res.status(200).json({
      success: true,
      msg: "Project updated successfully",
      data: updatedProject
    });
  } catch (error) {
    console.error("UpdateProject error:", error);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};

export const deleteProject = async (req, res) => {
  try {
    const { id } = req.params;
    const project = await Project.findById(id);
    if (!project) {
      return res.status(404).json({ success: false, msg: "Project not found" });
    }
    await project.remove();
    res.status(200).json({ success: true, msg: "Project deleted successfully" });
  } catch (error) {
    console.error("DeleteProject error:", error);
    res.status(500).json({ success: false, msg: "Internal server error" });
  }
};



// Add Member (Only Owner)
export const addMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: "Project nahi mila" });

    // Only Owner can add members
    if (project.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only Owner can add members" });
    }

    const { userId, role } = req.body; // role = ADMIN or MEMBER
    const existing = project.members.find(m => m.userId.toString() === userId);
    if (existing) return res.status(400).json({ msg: "Already a member" });

    project.members.push({ userId, role: role || "MEMBER" });
    await project.save();

    const updated = await project.populate("members.userId", "name email");
    res.json({
      success: true,
      msg: "Member added successfully",
      data: updated
    });

  } catch (err) {
    console.error("AddMember error:", err);
    res.status(500).json({ msg: err.message });
  }
};

// Remove Member (Only Owner)
export const removeMember = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ msg: "Project nahi mila" });

    // Only Owner can remove members
    if (project.ownerId.toString() !== req.user.id) {
      return res.status(403).json({ msg: "Only Owner can remove members" });
    }

    // Prevent Owner from removing themselves
    if (req.params.userId === project.ownerId.toString()) {
      return res.status(400).json({ msg: "Owner cannot remove themselves" });
    }

    project.members = project.members.filter(
      m => m.userId.toString() !== req.params.userId
    );
    await project.save();

    res.json({
      success: true,
      msg: "Member removed successfully"
    });

  } catch (err) {
    console.error("RemoveMember error:", err);
    res.status(500).json({ msg: err.message });
  }
};