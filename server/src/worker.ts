import { Worker, Job } from 'bullmq';
import puppeteer from 'puppeteer';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { db } from './db';
import { tasks } from './db/schema';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';
import Redis from 'ioredis';

dotenv.config();

// Redis connection for BullMQ
const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
});

// Initialize Gemini
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

const SCRAPER_QUEUE_NAME = 'scraper-queue';

export const worker = new Worker(
  SCRAPER_QUEUE_NAME,
  async (job: Job) => {
    const { id, url, question } = job.data;
    console.log(`Processing job ${id}: ${url}`);

    try {
      // Notify queue of progress
      await db
        .update(tasks)
        .set({ status: 'processing', progress: 10 })
        .where(eq(tasks.id, id));
      await job.updateProgress(10);

      // Launch headless browser for scraping
      const browser = await puppeteer.launch({
        headless: true,
        executablePath: '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });
      const page = await browser.newPage();

      // Wait for dynamic content to load
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 60000 });

      const content = await page.evaluate(() => {
        // Target main content specifically for better quality
        const mainContent = document.querySelector('main') || document.querySelector('article') || document.body;
        return mainContent.innerText;
      });

      await browser.close();

      // Update intermediate progress
      await db
        .update(tasks)
        .set({ progress: 50 })
        .where(eq(tasks.id, id));
      await job.updateProgress(50);

      // Summarize content with AI
      const model = genAI.getGenerativeModel({ model: 'gemini-flash-latest' });
      // Sanitize and truncate content
      const cleanedContent = content.replace(/\s\s+/g, ' ').substring(0, 15000);

      const prompt = `
        You are a helpful assistant. 
        Use the following website content to answer the user's question accurately. 
        If the answer is present in the text, explain it.
        
        Content: ${cleanedContent}
        
        Question: ${question}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();

      // Update DB with result
      await db
        .update(tasks)
        .set({
          status: 'completed',
          progress: 100,
          result: text
        })
        .where(eq(tasks.id, id));

      await job.updateProgress(100);

      return { answer: text };

    } catch (error: any) {
      console.error(`Job ${id} failed:`, error);
      await db
        .update(tasks)
        .set({
          status: 'failed',
          result: error.message
        })
        .where(eq(tasks.id, id));
      throw error;
    }
  },
  { connection }
);

worker.on('completed', (job) => {
  console.log(`Job ${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  console.log(`Job ${job?.id} has failed with ${err.message}`);
});
