// routes/carouselRoutes.js
import express from "express";
import { addCarouselController, deleteCarouselController, getCarouselController } from "../controllers/carouselController.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getCarouselController);          // get all active slides
router.post("/add", verifyAdmin, addCarouselController);   // add slide
router.delete("/delete", verifyAdmin, deleteCarouselController); // delete slide

export default router;
