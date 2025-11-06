import express, { type Request, type Response } from "express";
import jwt from "jsonwebtoken";
import pool from "../config/database";

export const authenticateUserFromExtension = async (
  req: Request,
  res: Response
) => {
  try {
    const { authToken, email } = req.body;

    console.log("API HIT");

    if (!authToken || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const userResult = await pool.query(
      `SELECT * FROM users WHERE email = $1`,
      [email]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({ message: "User Not Found" });
    }

    const user = userResult.rows[0];

    if (!process.env.PROJECT_SECRET) {
      throw new Error("PROJECT_SECRET not configured");
    }

    let decoded;
    try {
      decoded = jwt.verify(authToken, process.env.PROJECT_SECRET) as {
        projectId: string;
      };
    } catch (err) {
      return res.status(401).json({ message: "Invalid or Expired token" });
    }

    const projectId = decoded.projectId;

    const projectResult = await pool.query(
      `SELECT * FROM projects WHERE id = $1`,
      [projectId]
    );

    if (projectResult.rows.length === 0) {
      return res.status(404).json({ message: "Project Not Found" });
    }

    const project = projectResult.rows[0];

    const memberResult = await pool.query(
      `SELECT * FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [project.id, user.id]
    );

    if (memberResult.rows.length === 0) {
      return res.status(401).json({ message: "User is not part of Project" });
    }

    const currentTime = new Date();
    await pool.query(
      `UPDATE project_members SET joined_at = $1 WHERE user_id = $2 AND project_id = $3`,
      [currentTime, user.id, project.id]
    );

    return res
      .status(200)
      .json({ message: "You joined successfully!", projectId: project.id });
  } catch (error: any) {
    console.error("Error authorizing:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
};
