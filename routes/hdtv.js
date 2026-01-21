import express from "express";
import {
    addHDTVController,
    updateHDTVController,
    deleteHDTVController,
    getAllHDTVController,
    handleHDTVClickController
} from "../controllers/hdtvController.js";
import { verifyAdmin } from "../middleware/auth.js";

const router = express.Router();

router.get("/hdtv", getAllHDTVController);
router.post("/hdtv", verifyAdmin, addHDTVController);
router.put("/hdtv/:id", verifyAdmin, updateHDTVController);
router.delete("/hdtv/:id", verifyAdmin, deleteHDTVController);
router.post("/hdtv/click/:id", handleHDTVClickController);

export default router;

// // routes\hdtv.js
// import express from "express";
// import {
//     addHDTVController,
//     updateHDTVController,
//     deleteHDTVController,
//     getAllHDTVController,
//     handleHDTVClickController
// } from "../controllers/hdtvController.js";

// import { verifyAdmin } from "../middleware/auth.js";

// const router = express.Router();

// router.get("/hdtv", getAllHDTVController);
// router.post("/hdtv/add", verifyAdmin, addHDTVController);
// router.put("/hdtv/update", verifyAdmin, updateHDTVController);
// router.delete("/hdtv/delete", verifyAdmin, deleteHDTVController);
// router.post("/hdtv/click/:tmdbID", handleHDTVClickController);

// export default router;
