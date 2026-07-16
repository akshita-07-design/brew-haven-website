const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const menu = require("./menu.json");
const app = express();

app.use(cors());
app.use(express.json());

/* ==========================================
   Load all knowledge files
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
   Conversation Memory
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

  if(message.toLowerCase().includes("latte")){

      userProfile.favoriteDrink="Latte";

  }

  if(message.toLowerCase().includes("cappuccino")){

      userProfile.favoriteDrink="Cappuccino";

  }

  if(message.toLowerCase().includes("mocha")){

     userProfile.favoriteDrink="Mocha";
 
  }
  // Save user message
  conversationHistory.push({
    role: "Customer",
    content: message.trim()
  });

  // Keep only latest 20 messages
  if (conversationHistory.length > 20) {
    conversationHistory = conversationHistory.slice(-6);
  }

  const history = conversationHistory
    .map(msg => `${msg.role}: ${msg.content}`)
    .join("\n");

  /* ==========================================
     Prompt
  ========================================== */

  const prompt = `
You are Brew Haven AI.

You are the friendly digital barista of Brew Haven.

Your personality:

- Friendly
- Warm
- Professional
- Enthusiastic
- Helpful
- Knowledgeable

Rules:

- Speak naturally.
- Never say you are an AI language model.
- Always speak like a real Brew Haven employee.
- Recommend drinks and food whenever suitable.
- Ask follow-up questions if the customer is unsure.
- Keep replies between 50 and 120 words.
- Use emojis occasionally (☕😊).
- End with a friendly suggestion when appropriate.

Use the Brew Haven knowledge below as your PRIMARY source.

You may answer general coffee questions using your own knowledge.

Never invent Brew Haven information that is not in the knowledge files.

If you don't know a Brew Haven-specific answer, politely say so.

==========================
BREW HAVEN KNOWLEDGE
==========================

${BUSINESS_CONTEXT}

==========================
CONVERSATION HISTORY
==========================

${history}

Assistant:
`;

  try {

    const response = await fetch(
      "http://localhost:11434/api/generate",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "llama3.2",
          prompt,
          stream: false,
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Ollama returned an error.");
    }

    const data = await response.json();

    const reply =
      data.response ||
      "I'm sorry, I couldn't think of a response right now.";

    // Save assistant reply
    conversationHistory.push({
      role: "Assistant",
      content: reply
    });

    // Keep latest 20 messages
    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-6);
    }

    let product = null;

    if (reply.toLowerCase().includes("espresso")) {
      product = menu.find(item => item.name === "Espresso");
    }

    else if (reply.toLowerCase().includes("flat white")) {
      product = menu.find(item => item.name === "Flat White");
    }

    else if (reply.toLowerCase().includes("caramel latte")) {
      product = menu.find(item => item.name === "Caramel Latte");
    }

    else if (reply.toLowerCase().includes("cappuccino")) {
      product = menu.find(item => item.name === "Cappuccino");
    }

    else if (reply.toLowerCase().includes("mocha")) {
      product = menu.find(item => item.name === "Mocha");
    }

    res.json({
      reply,
      product
    });

    const lower = message.toLowerCase();

    if (lower.includes("opening")) {
        return res.json({
            reply: "We're open every day from 7 AM to 8 PM ☕"
        });
    }

    if (lower.includes("wifi")) {
        return res.json({
            reply: "Yes! We have free high-speed WiFi for all customers."
        });
    }

    if (lower.includes("latte")) {
        return res.json({
            reply: "Our Caramel Latte is one of our best sellers. It's smooth, creamy and topped with rich caramel. ☕",
            product: menu.find(i=>i.name==="Caramel Latte")
         });
    } 

  } catch (err) {

    console.error("AI Error:", err);

    res.status(500).json({
      reply:
        "Sorry! I'm having trouble connecting to Brew Haven AI right now. Please try again in a moment."
    });

  }

});

/* ==========================================
   Start Server
========================================== */

app.listen(5000, () => {
  console.log("🚀 Brew Haven AI running on http://localhost:5000");
});
