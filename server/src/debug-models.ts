
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

async function listModels() {
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);
  try {
    // There isn't a direct "listModels" on the instance in some SDK versions, but let's try the generic approach or just try a basic generation to debug.
    // Actually, usually we can't easily list models via the Node SDK helper directly without a specific method.
    // Let's rely on a direct fetch to the API to be 100% sure what the raw API sees.

    const key = process.env.GEMINI_API_KEY;
    console.log("Checking models with key ending in...", key?.slice(-4));

    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${key}`);
    const data = await response.json();

    if (data.models) {
      console.log("Available Models:");
      data.models.forEach((m: any) => console.log(`- ${m.name} (${m.supportedGenerationMethods})`));
    } else {
      console.log("No models found or error:", data);
    }

  } catch (error) {
    console.error("Error listing models:", error);
  }
}

listModels();
