# Website Info Extractor

A premium full-stack application that extracts, analyzes, and summarizes information from any website using AI. Built with a modern, decoupled architecture for scalability and performance.

## 🚀 Features

-   **Intelligent Web Scraping**: Uses Puppeteer with advanced wait strategies (`networkidle2`) to scrape dynamic content from modern websites (SPAs, Wikipedia, etc.).
-   **AI-Powered Analysis**: Integrates Google Gemini 2.0 Flash (via `gemini-flash-latest`) to answer user questions based on the scraped context.
-   **Robust Job Queue**: Implements BullMQ with Redis to handle heavy scraping tasks asynchronously, preventing server timeouts.
-   **Real-time Updates**: Frontend polling via TanStack Query ensures users see progress (Pending -> Processing -> Completed) in real-time.
-   **Decoupled Architecture**: Separate Next.js Frontend and Express Backend for better separation of concerns and scalability.
-   **Premium UI**: Glassmorphism design with smooth animations and responsive layout.

## 🏗 Architecture

The project follows a decoupled microservices-like architecture:

1.  **Frontend (Next.js)**:
    *   Runs on Port 3000.
    *   Handles User Interface, Form Submission, and displaying results.
    *   uses **TanStack Query** for efficient state management and polling.
2.  **Backend (Express.js)**:
    *   Runs on Port 5001 (to avoid MacOS ControlCenter conflicts).
    *   Exposes REST API endpoints (`/api/jobs`).
    *   Manages **PostgreSQL** database connections via **Drizzle ORM**.
    *   Producers jobs into the Redis Queue.
3.  **Worker Service**:
    *   Runs alongside the backend.
    *   Consumes jobs from **BullMQ**.
    *   Performs the heavy lifting: Launching Browser -> Scraping -> AI Processing -> DB Update.

## 🛠️ Tech Stack

-   **Frontend**: Next.js 15, React 19, TailwindCSS, TanStack Query, Lucide Icons.
-   **Backend**: Express.js, Node.js.
-   **Database**: PostgreSQL, Drizzle ORM.
-   **Queue**: BullMQ, Redis (IORedis).
-   **AI**: Google Gemini SDK (`@google/generative-ai`).
-   **Scraping**: Puppeteer.

## 🏁 Setup Guide

### Prerequisites
-   Node.js (v18+)
-   PostgreSQL
-   Redis

### 1. Clone & Install
```bash
git clone <repo-url>
cd website_info_extractor

# Install Root/Frontend dependencies
npm install

# Install Backend dependencies
cd server
npm install
```

### 2. Configure Environment
Create a `.env` file in the `server/` directory:

```env
# server/.env
GEMINI_API_KEY=your_gemini_api_key_here
DATABASE_URL=postgresql://user:password@localhost:5432/sbl_db
REDIS_URL=redis://localhost:6379
PORT=5001
```

### 3. Database Setup
```bash
cd server
npm run db:push  # Pushes schema to PostgreSQL
```

### 4. Run the Application
You need to run both the frontend and backend servers.

**Terminal 1 (Backend & Worker):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend):**
```bash
# form root
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the app.

## 🧠 Decisions Log

### Why separate Express from Next.js?
While Next.js API routes are powerful, we chose a separate Express server for the backend to:
1.  **Avoid Port Conflicts**: MacOS ControlCenter often occupies port 5000/7000. Running a dedicated Express server on 5001 gives us full control.
2.  **Long-Running Processes**: Express is better suited for keeping long-lived WebSocket or Queue Worker connections alive compared to Next.js serverless functions.
3.  **Scalability**: The backend logic (Queue, Scraping) can be scaled independently of the frontend UI.

### Why Gemini Flash?
We utilized `gemini-flash-latest` because it offers a massive context window (essential for reading full web pages) and extremely low latency compared to GPT-4, making it ideal for real-time extraction tasks.
