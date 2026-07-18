import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

console.log("GROQ exists?", !!process.env.GROQ_API_KEY);
console.log("Length:", process.env.GROQ_API_KEY?.length);

const groq = new Groq({
  apiKey:  process.env.GROQ_API_KEY,
});

// ==========================================
// Load Menu
// ==========================================

const menu = JSON.parse(
  fs.readFileSync(
    path.join(process.cwd(), "menu.json"),
    "utf8"
  )
);

// ==========================================
// Load Knowledge Base
// ==========================================

const knowledgeFolder = path.join(
  process.cwd(),
  "knowledge"
);

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

// ==========================================
// Memory
// ==========================================

let conversationHistory = [];

let userProfile = {
  favoriteDrink: "",
  favoriteDessert: ""
};

// ==========================================
// Helper Functions
// ==========================================

function rememberPreferences(message) {

  const lower = message.toLowerCase();

  if (lower.includes("espresso"))
    userProfile.favoriteDrink = "Espresso";

  if (lower.includes("latte"))
    userProfile.favoriteDrink = "Caramel Latte";

  if (lower.includes("flat white"))
    userProfile.favoriteDrink = "Flat White";

  if (lower.includes("cappuccino"))
    userProfile.favoriteDrink = "Cappuccino";

  if (lower.includes("mocha"))
    userProfile.favoriteDrink = "Mocha";

  if (lower.includes("cheesecake"))
    userProfile.favoriteDessert = "Cheesecake";

  if (lower.includes("croissant"))
    userProfile.favoriteDessert = "Croissant";

}

function findRecommendedProduct(reply) {

  const text = reply.toLowerCase();

  if (text.includes("espresso")) {
    return menu.find(
      item => item.name === "Espresso"
    );
  }

  if (text.includes("flat white")) {
    return menu.find(
      item => item.name === "Flat White"
    );
  }

  if (text.includes("caramel latte")) {
    return menu.find(
      item => item.name === "Caramel Latte"
    );
  }

  if (text.includes("cappuccino")) {
    return menu.find(
      item => item.name === "Cappuccino"
    );
  }

  if (text.includes("mocha")) {
    return menu.find(
      item => item.name === "Mocha"
    );
  }

  if (text.includes("cheesecake")) {
    return menu.find(
      item => item.name === "Cheesecake"
    );
  }

  if (text.includes("croissant")) {
    return menu.find(
      item => item.name === "Croissant"
    );
  }

  return null;

}

// ==========================================
// API Route
// ==========================================

export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      reply: "Method Not Allowed"
    });
  }

  try {

    const { message } = req.body;

    if (!message) {
      return res.status(400).json({
        reply: "No message provided."
      });
    }

    rememberPreferences(message);

    conversationHistory.push({
      role: "Customer",
      content: message.trim()
    });

    if (conversationHistory.length > 20) {
      conversationHistory =
        conversationHistory.slice(-20);
    }

    const history = conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n");

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

- Never say you are an AI language model.
- Speak exactly like a real Brew Haven employee.
- Keep replies between 50 and 120 words.
- Recommend drinks and desserts naturally.
- Use emojis occasionally.
- Never invent Brew Haven information.
- Use the knowledge base below as your primary source.

=========================
BREW HAVEN KNOWLEDGE
=========================

${BUSINESS_CONTEXT}

=========================
CUSTOMER PROFILE
=========================

Favorite Drink:
${userProfile.favoriteDrink}

Favorite Dessert:
${userProfile.favoriteDessert}

=========================
CONVERSATION
=========================

${history}

Assistant:
`;

    // ==========================================
    // Ask Groq
    // ==========================================

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
        max_tokens: 300
      });

    const reply =
      completion.choices[0].message.content ||
      "I'm sorry, I couldn't think of a response.";

    // ==========================================
    // Save AI Reply
    // ==========================================

    conversationHistory.push({
      role: "Assistant",
      content: reply
    });

    if (conversationHistory.length > 20) {
      conversationHistory =
        conversationHistory.slice(-20);
    }

    // ==========================================
    // Product Recommendation
    // ==========================================

    let product = null;

    const lowerReply = reply.toLowerCase();

    if (lowerReply.includes("espresso")) {
      product =
        menu.find(item => item.name === "Espresso");
    }

    else if (lowerReply.includes("flat white")) {
      product =
        menu.find(item => item.name === "Flat White");
    }

    else if (lowerReply.includes("caramel latte")) {
      product =
        menu.find(item => item.name === "Caramel Latte");
    }

    else if (lowerReply.includes("cappuccino")) {
      product =
        menu.find(item => item.name === "Cappuccino");
    }

    else if (lowerReply.includes("mocha")) {
      product =
        menu.find(item => item.name === "Mocha");
    }

    else if (lowerReply.includes("cheesecake")) {
      product =
        menu.find(item => item.name === "Cheesecake");
    }

    else if (lowerReply.includes("croissant")) {
      product =
        menu.find(item => item.name === "Croissant");
    }

    // ==========================================
    // Return Response
    // ==========================================

    return res.status(200).json({
      reply,
      product
    });

  }

  catch (err) {

    console.error("Groq Error:", err);

    return res.status(500).json({
      reply:
        "Sorry! I'm having trouble connecting to Brew Haven AI right now. Please try again in a moment."
    });

  }

}