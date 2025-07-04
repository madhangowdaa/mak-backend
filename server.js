import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import moviesRouter from './routes/movies.js';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', moviesRouter);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
