import express from "express";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createClient } from "@supabase/supabase-js";
import cors from "cors";

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

app.post("/chat", async (req, res) => {
  try {
    const { query } = req.body;

    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: query,
    });

    const reply = response.text

    // Save to Supabase chats table
    const { error: dbError } = await supabase
      .from("chats")
      .insert([{ user_query: query, ai_response: reply }]);

    if (dbError) {
      console.error("Failed to save to Supabase:", dbError);
      return res.status(500).json({ error: "Failed to save chat" });
    }

    res.sendStatus(200);

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

app.listen(3000, () => {
console.log(`Server is running on http://localhost:3000`);
});