// routes/carouselRoutes.js
import express from "express";
import { addCarouselController, deleteCarouselController, getCarouselController, moveCarouselController, pinCarouselController, unpinCarouselController } from "../controllers/carouselController.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/", getCarouselController);          // get all active slides
router.post("/add", verifyAdmin, addCarouselController);   // add slide
router.delete("/delete", verifyAdmin, deleteCarouselController); // delete slide
router.post("/move", verifyAdmin, moveCarouselController);
router.post("/pin", verifyAdmin, pinCarouselController);
router.post("/unpin", verifyAdmin, unpinCarouselController);

export default router;
