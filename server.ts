import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import { createServer as createViteServer } from "vite";

dotenv.config();

const app = express();
const PORT = 3000;

app.use(express.json());

// Initialize Gemini safely
let ai: GoogleGenAI | null = null;
try {
  const apiKey = process.env.GEMINI_API_KEY;
  if (apiKey) {
    ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
    console.log("Gemini API initialized successfully.");
  } else {
    console.warn("GEMINI_API_KEY is not defined. AI Assist features will use fallback replies.");
  }
} catch (error) {
  console.error("Error initializing Gemini:", error);
}

// API endpoint for AI Assisted replies
app.post("/api/gemini/assist", async (req, res) => {
  const { clientMessage, packageDetails, context } = req.body;
  
  if (!ai) {
    // Elegant fallback replies if API key is not present
    return res.json({
      text: `Hello! Regarding your inquiry about the ${packageDetails?.name || "Classics Experience"}. We are glad to inform you that our photobooth service includes 100% free transportation to Selangor, Negeri Sembilan, Melaka, Johor, and Pahang with absolutely no hidden charges or weekend surcharges! Yes, the booth duration can also be extended on-site at RM170/hour. Would you like us to lock in this package for you?`,
    });
  }

  try {
    const prompt = `You are the AI Assistant for Irfan & Irsalina, the founders of "Framez.my" (Framez Photobooth), a premium photobooth service in Malaysia covering Selangor, Negeri Sembilan, Melaka, Johor, and Pahang with RM0 transit fees.

Client is asking a question: "${clientMessage || "How much for the basic package with custom guestbook and is transportation included?"}"

Context about Framez.my:
- We have 3 premium packages:
  1. Classics Experience (RM599): 3 hours, 2R size prints, unlimited prints, 3 templates, awesome props, QR softcopy on the spot, free backdrop.
  2. Platinum Royal Experience (RM699): 3 hours, 2R size prints, unlimited prints, 4 templates, awesome props, QR softcopy, free backdrop, custom guestbook.
  3. Grand Luxe Experience (RM799): 4 hours, 2R size prints, unlimited prints, 4 templates, awesome props, QR softcopy, free backdrop, custom guestbook.
- Add-ons:
  - 4R photo size print (3 hours) RM399
  - 4R photo size print (4 hours) RM499
  - Additional hours: RM170/hour
  - Upgrade backdrop size: RM59
  - Custom guestbook: RM79
- Transport policy: RM0 transit fees / absolutely free within Selangor, Negeri Sembilan, Melaka, Johor, and Pahang.
- Refund / Cancellation policy: Full refund if cancelled up to 7 days before. 50% refund up to 48 hours. Under 48 hours, converted to an event postponement voucher (no refund).
- Weekend surcharge: RM0 (No weekend or holiday surcharges).
- On-site extensions: Fully supported at RM170/hour (based on crew availability).
- Last-minute bookings: Fully supported based on crew/hardware availability.

Create a highly polished, professional, friendly WhatsApp reply in English with Malaysian hospitality warmth. Ensure the breakdown is extremely clear, referencing their active package or question. Avoid robotic text, keep it natural and formatted with emojis. Respond directly with the WhatsApp draft text only. No surrounding headers.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.5-flash",
      contents: prompt,
      config: {
        temperature: 0.7,
      }
    });

    res.json({ text: response.text });
  } catch (error: any) {
    console.error("Gemini API Error:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI response." });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "healthy", time: new Date().toISOString() });
});

// Set up Vite or Static Assets
async function setupApp() {
  if (process.env.NODE_ENV !== "production") {
    console.log("Setting up Vite middleware for development...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Serving production static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Framez.my server running on http://localhost:${PORT}`);
  });
}

setupApp().catch((err) => {
  console.error("Failed to start server:", err);
});
