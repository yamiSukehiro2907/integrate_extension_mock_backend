import express, { Router } from "express";
import { authenticateUserFromExtension } from "../controllers/auth.controller";
const router: Router = express.Router();

router.post("/", authenticateUserFromExtension);

export default router;
