import { type Request, type Response } from "express";
import pool from "../config/database";
import type { User } from "../interfaces/User";
import type { Member } from "../interfaces/Member";
import type { Project } from "../interfaces/Project";
import type { ProjectFiles } from "../interfaces/ProjectFiles";

export const authenticateUserFromExtension = async (
  req: Request,
  res: Response
) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ message: "Email is required" });
    }

    const userResult = await pool.query(
      `SELECT id, name, email, username, created_at FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const userRow = userResult.rows[0];

    const projectId = req.projectId;

    if (!projectId) {
      return res.status(400).json({ message: "Project ID not found in token" });
    }

    const projectResult = await pool.query(
      `SELECT p.id, p.name, p.version, p.project_status, p.created_at, u.name as owner_name
       FROM projects p
       JOIN users u ON p.owner_id = u.id
       WHERE p.id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project Not Found" });
    }

    const projectRow = projectResult.rows[0];

    const memberResult = await pool.query(
      `SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectRow.id, userRow.id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(401).json({ message: "User is not part of Project" });
    }

    const membersResult = await pool.query(
      `SELECT u.id, u.name, u.email, pm.role
       FROM project_members pm
       JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1`,
      [projectRow.id]
    );

    const filesResult = await pool.query(
      `SELECT rules_md, openapi_file, schema
       FROM project_details
       WHERE project_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [projectRow.id]
    );

    const user: User = {
      id: userRow.id.toString(),
      name: userRow.name,
      email: userRow.email,
      username: userRow.username,
      created_at: userRow.created_at.toISOString(),
    };

    const members: Member[] = membersResult.rows.map((member) => ({
      id: member.id.toString(),
      name: member.name,
      email: member.email,
      role: member.role || "member",
    }));

    const project: Project = {
      id: projectRow.id.toString(),
      name: projectRow.name,
      version: projectRow.version,
      owner: projectRow.owner_name,
      project_status: projectRow.project_status,
      members: members,
      created_at: projectRow.created_at.toISOString(),
    };

    const files: ProjectFiles = {
      openapi_yaml: filesResult.rows[0]?.openapi_file || null,
      schema_json: filesResult.rows[0]?.schema || null,
      rules_md: filesResult.rows[0]?.rules_md || null,
    };

    return res.status(200).json({
      message: "Authentication successful!",
      user,
      project,
      files,
    });
  } catch (error) {
    console.error("Error authenticating:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
