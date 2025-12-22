import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { Queue } from 'bullmq';
import { db } from './db';
import { tasks } from './db/schema';
import { eq } from 'drizzle-orm';
import Redis from 'ioredis';
import './worker';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5001;

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

const SCRAPER_QUEUE_NAME = 'scraper-queue';
const myQueue = new Queue(SCRAPER_QUEUE_NAME, { connection });

app.use(cors({
  origin: true,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'Origin'],
}));
app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  next();
});

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/api/jobs', async (req, res) => {
  try {
    const { url, question, userId } = req.body;

    if (!url || !question) {
      res.status(400).json({ error: 'URL and Question are required' });
      return;
    }

    // Create DB Entry
    const [newTask] = await db
      .insert(tasks)
      .values({
        url,
        question,
        userId,
        status: 'pending',
      })
      .returning();

    // Add to Queue
    await myQueue.add('scrape-job', {
      id: newTask.id,
      url,
      question,
    });

    res.json({ id: newTask.id });
  } catch (error) {
    console.error('Error creating job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Get Job Status
app.get('/api/jobs/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Check DB first
    const task = await db.query.tasks.findFirst({
      where: eq(tasks.id, parseInt(id)),
    });

    if (!task) {
      res.status(404).json({ error: 'Job not found' });
      return;
    }

    res.json(task);
  } catch (error) {
    console.error('Error fetching job:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
