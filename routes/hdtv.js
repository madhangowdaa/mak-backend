// routes\hdtv.js
import express from "express";
import {
    addHDTVController,
    updateHDTVController,
    deleteHDTVController,
    getAllHDTVController,
    handleHDTVClickController,
    getHDTVByTitleController
} from "../controllers/hdtvController.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/hdtv", getAllHDTVController);
router.post("/hdtv", verifyAdmin, addHDTVController);
router.put("/hdtv/:id", verifyAdmin, updateHDTVController);
router.delete("/hdtv/:id", verifyAdmin, deleteHDTVController);
router.post("/hdtv/click/:id", handleHDTVClickController);
router.get("/hdtv/custom/:title", getHDTVByTitleController); 

export default router;
