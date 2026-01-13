// routes/top10Routes.js
import express from 'express';
import { addTop10Controller, updateTop10Controller, deleteTop10Controller, getTop10Controller } from '../controllers/top10Controller.js';

const router = express.Router();

router.get('/top10', getTop10Controller);
router.post('/top10/add', addTop10Controller);
router.put('/top10/update', updateTop10Controller);
router.delete('/top10/delete', deleteTop10Controller);

export default router;
