import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import apiRoutes from './routes';
import { errorHandler } from './middleware/error';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*', // Permit all origins for development and demo setups
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// API health endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date(), message: 'TaskFlow AI Backend is running smoothly.' });
});

// Load main route group
app.use('/api', apiRoutes);

// Catch-all route for missing endpoints
app.use((req, res) => {
  res.status(404).json({ message: `Endpoint ${req.method} ${req.url} not found` });
});

// Mount global error handler
app.use(errorHandler as any);

app.listen(PORT, () => {
  console.log(`[Server]: TaskFlow AI server is listening on port ${PORT}`);
});
