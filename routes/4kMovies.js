// routes\4kMovies.js
import express from "express";
import { putUltraLinkController } from "../controllers/4KController.js";

const router = express.Router();

// Add/Update/Delete 4K link
router.post("/admin/put4k", putUltraLinkController);

export default router;
