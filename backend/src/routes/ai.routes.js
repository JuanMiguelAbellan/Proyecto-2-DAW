import { Router } from "express";
import { generateAI } from "../controllers/ai.controller.js";

const router = Router();

router.post("/generate", generateAI);

export default router;
