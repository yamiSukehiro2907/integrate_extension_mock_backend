import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

export const generateProjectToken = (projectId: string): string => {
  if (!process.env.PROJECT_SECRET) {
    throw new Error("PROJECT_SECRET is not defined");
  }

  return jwt.sign({ projectId }, process.env.PROJECT_SECRET, {
    expiresIn: "7d",
  });
};
