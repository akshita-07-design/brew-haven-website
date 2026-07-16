require("dotenv").config();

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const Groq = require("groq-sdk");
const menu = require("./menu.json");

const app = express();

app.use(cors());
app.use(express.json());

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

/* ==========================================
   Load Knowledge Base
========================================== */

const knowledgeFolder = path.join(__dirname, "knowledge");

const BUSINESS_CONTEXT = fs
  .readdirSync(knowledgeFolder)
  .filter(file => file.endsWith(".txt"))
  .map(file =>
    fs.readFileSync(
      path.join(knowledgeFolder, file),
      "utf8"
    )
  )
  .join("\n\n");

/* ==========================================
   Memory
========================================== */

let conversationHistory = [];

let userProfile = {
  favoriteDrink: "",
  favoriteDessert: ""
};

/* ==========================================
   Chat Endpoint
========================================== */

app.post("/chat", async (req, res) => {

  const { message } = req.body;

  const lower = message.toLowerCase();

  if (lower.includes("latte")) {
    userProfile.favoriteDrink = "Latte";
  }

  if (lower.includes("cappuccino")) {
    userProfile.favoriteDrink = "Cappuccino";
  }

  if (lower.includes("mocha")) {
    userProfile.favoriteDrink = "Mocha";
  }

  conversationHistory.push({
    role: "Customer",
    content: message
  });

  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-20);
  }

  const history = conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join("\n");

  const prompt = `
You are Brew Haven AI.

You are the friendly digital barista of Brew Haven.

Personality:

- Friendly
- Warm
- Professional
- Helpful
- Enthusiastic

Rules:

- Never mention AI.
- Speak naturally.
- Recommend products whenever appropriate.
- Keep replies around 80 words.
- Use emojis occasionally ☕😊

Brew Haven Information:

${BUSINESS_CONTEXT}

Conversation:

${history}

Assistant:
`;

  try {

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        messages: [
          {
            role: "user",
            content: prompt
          }
        ],

        temperature: 0.7,

        max_tokens: 350
      });

    const reply =
      completion.choices[0].message.content;

    conversationHistory.push({
      role: "Assistant",
      content: reply
    });

    if (conversationHistory.length > 20) {
      conversationHistory =
        conversationHistory.slice(-20);
    }

    let product = null;

    if (reply.toLowerCase().includes("espresso")) {
      product = menu.find(
        item => item.name === "Espresso"
      );
    }

    else if (reply.toLowerCase().includes("flat white")) {
      product = menu.find(
        item => item.name === "Flat White"
      );
    }

    else if (reply.toLowerCase().includes("caramel latte")) {
      product = menu.find(
        item => item.name === "Caramel Latte"
      );
    }

    else if (reply.toLowerCase().includes("cappuccino")) {
      product = menu.find(
        item => item.name === "Cappuccino"
      );
    }

    else if (reply.toLowerCase().includes("mocha")) {
      product = menu.find(
        item => item.name === "Mocha"
      );
    }

    res.json({
      reply,
      product
    });

  }

  catch (err) {

    console.error(err);

    res.status(500).json({
      reply:
        "Sorry! I'm having trouble connecting to Brew Haven AI right now."
    });

  }

});

/* ==========================================
   Start Server
========================================== */

app.listen(5000, () => {
  console.log("🚀 Brew Haven AI running on http://localhost:5000");
});