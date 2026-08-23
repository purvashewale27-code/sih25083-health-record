import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import apiRouter from './routes/index.js';
import { errorHandler } from './middleware/errorHandler.js';

const app = express();
const PORT = process.env.PORT || 5000;

// Allow local CORS for all Vite dev server ports (5173, 5174, 5175, etc.)
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);

app.use(express.json());

// Mount central API router under /api
app.use('/api', apiRouter);

// Centralized error handling middleware
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`[Backend] Server is running on http://localhost:${PORT}`);
});
