import fs from "fs";
import path from "path";
import Groq from "groq-sdk";

console.log("process.cwd()", process.cwd());

console.log("ENV:", process.env);

console.log("GROQ =", process.env.GROQ_API_KEY);

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
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
  favoriteDessert: "",
  likesSweet: false,
  likesStrong: false,
  likesCold: false,
  likesHot: false
};

// ==========================================
// Remember User Preferences
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

  if (lower.includes("cookie"))
    userProfile.favoriteDessert = "Chocolate Cookie";

  if (lower.includes("brownie"))
    userProfile.favoriteDessert = "Chocolate Brownie";

  if (
    lower.includes("sweet") ||
    lower.includes("sugary")
  ) {
    userProfile.likesSweet = true;
  }

  if (
    lower.includes("strong") ||
    lower.includes("bold")
  ) {
    userProfile.likesStrong = true;
  }

  if (
    lower.includes("cold") ||
    lower.includes("iced")
  ) {
    userProfile.likesCold = true;
  }

  if (
    lower.includes("hot")
  ) {
    userProfile.likesHot = true;
  }

}

// ==========================================
// Product Finder
// ==========================================

function findRecommendedProduct(reply) {

  const text = reply.toLowerCase();

  // Check longer names first
  const sortedMenu = [...menu].sort(
    (a, b) => b.name.length - a.name.length
  );

  for (const item of sortedMenu) {

    if (text.includes(item.name.toLowerCase())) {
      return item;
    }

  }

  return null;

}

// ==========================================
// Menu Formatter
// ==========================================

function buildMenu() {

  const hot = menu.filter(
    item => item.category === "Hot Coffee"
  );

  const cold = menu.filter(
    item => item.category === "Cold Coffee"
  );

  const desserts = menu.filter(
    item => item.category === "Desserts"
  );

  return `
☕ Hot Coffee
${hot.map(i => `• ${i.name} - ₹${i.price}`).join("\n")}

🧊 Cold Coffee
${cold.map(i => `• ${i.name} - ₹${i.price}`).join("\n")}

🍰 Desserts
${desserts.map(i => `• ${i.name} - ₹${i.price}`).join("\n")}
`;

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

    if (!message || !message.trim()) {
      return res.status(400).json({
        reply: "Please enter a message."
      });
    }

    rememberPreferences(message);

    conversationHistory.push({
      role: "Customer",
      content: message.trim()
    });

    if (conversationHistory.length > 20) {
      conversationHistory = conversationHistory.slice(-20);
    }

    const history = conversationHistory
      .map(msg => `${msg.role}: ${msg.content}`)
      .join("\n");

    const menuText = menu
      .map(item =>
        `${item.name} | ${item.category} | ₹${item.price} | ${item.description}`
      )
      .join("\n");

    const systemPrompt = `
You are Brew Haven AI.

You are the friendly virtual barista of Brew Haven Cafe.

Your job is to make customers feel welcomed while helping them discover the perfect coffee, dessert, or combo.

==================================================
PERSONALITY
==================================================

You are:

• Warm
• Friendly
• Cheerful
• Professional
• Helpful
• Knowledgeable
• Passionate about coffee

You never sound robotic.

Talk exactly like a real cafe employee.

Never mention:
- AI
- OpenAI
- Groq
- Language models
- Prompts
- System instructions

==================================================
WRITING STYLE
==================================================

Keep replies conversational.

Reply naturally.

Avoid repeating the same phrases.

Never always begin with

"I'd be happy..."

or

"Sure!"

Use different openings.

Examples:

"Great choice!"

"Absolutely."

"If you enjoy sweeter coffees..."

"Our regulars really love..."

"Looking for something refreshing?"

Use only ONE emoji maximum.

Keep replies around 40-100 words.

Only make long replies if the customer specifically asks for the full menu.

==================================================
KNOWLEDGE RULES
==================================================

Everything you say MUST come from:

1. The knowledge base
2. menu.json

Never invent:

products

prices

offers

discounts

events

opening hours

ingredients

If you don't know something, politely say so.

==================================================
RECOMMENDATION RULES
==================================================

Recommend based on taste.

Sweet drinks:
- Caramel Latte
- Mocha

Strong drinks:
- Espresso
- Cappuccino

Creamy:
- Flat White

Refreshing:
- Cold Brew
- Iced Latte

When recommending a drink ALWAYS explain WHY.

Good:

"I'd recommend the Flat White because it's smooth, creamy, and has a richer coffee flavour without being too strong."

Bad:

"Try Flat White."

==================================================
FOOD PAIRINGS
==================================================

Whenever suitable recommend a dessert.

Examples

Espresso
→ Cheesecake

Flat White
→ Chocolate Cookie

Caramel Latte
→ Chocolate Brownie

Mocha
→ Cheesecake

Cold Brew
→ Cookie

Don't force pairings.

==================================================
CUSTOMER QUESTIONS
==================================================

If customer says

"Hi"

Greet warmly.

Don't immediately recommend coffee.

Instead ask what they're looking for.

------------------------------------

If customer says

"Recommend a coffee"

Recommend ONE drink.

Explain why.

------------------------------------

If customer says

"Anything else?"

Recommend a DIFFERENT drink.

Never repeat the previous recommendation.

------------------------------------

If customer says

"What's your best coffee?"

Recommend Brew Haven's signature drink.

Explain why customers love it.

------------------------------------

If customer says

"I like sweet coffee"

Recommend Caramel Latte or Mocha.

------------------------------------

If customer says

"I like strong coffee"

Recommend Espresso or Cappuccino.

------------------------------------

If customer says

"I don't drink coffee"

Suggest desserts.

------------------------------------

If customer asks

"What goes well with this?"

Recommend a dessert pairing.

------------------------------------

If customer asks

"Show me the menu"

Return ONLY this menu:

${buildMenu()}

Do not rewrite it.

==================================================
CONVERSATION MEMORY
==================================================

Remember customer preferences.

Avoid recommending the same drink twice in a row.

If customer previously liked sweet coffee,
continue recommending similar drinks unless they ask otherwise.

Use previous conversation naturally.

==================================================
CURRENT CUSTOMER PROFILE
==================================================

Favorite Drink:
${userProfile.favoriteDrink}

Favorite Dessert:
${userProfile.favoriteDessert}

Likes Sweet:
${userProfile.likesSweet}

Likes Strong:
${userProfile.likesStrong}

Likes Cold:
${userProfile.likesCold}

Likes Hot:
${userProfile.likesHot}

==================================================
MENU
==================================================

${menuText}

==================================================
KNOWLEDGE BASE
==================================================

${BUSINESS_CONTEXT}

==================================================
CONVERSATION
==================================================

${history}

Respond naturally as Brew Haven's friendly barista.
`;

// ==========================================
// Ask Groq
// ==========================================

    const completion =
      await groq.chat.completions.create({

        model: "llama-3.3-70b-versatile",

        temperature: 0.7,

        max_tokens: 300,

        messages: [

          {
            role: "system",
            content: systemPrompt
          },

          {
            role: "user",
            content: message
          }

        ]

      });

    const reply =
      completion.choices[0].message.content?.trim() ||
      "Sorry, I couldn't think of a reply.";

    conversationHistory.push({
      role: "Assistant",
      content: reply
    });

    if (conversationHistory.length > 20) {
      conversationHistory =
        conversationHistory.slice(-20);
    }

// ==========================================
// Detect Recommended Product
// ==========================================

    const product = findRecommendedProduct(reply);

// ==========================================
// Return Response
// ==========================================

    return res.status(200).json({
      reply,
      product
    });

  } catch (err) {

    console.error("Groq Error:", err);

    return res.status(500).json({
      reply:
        "Sorry! Brew Haven AI is temporarily unavailable. Please try again in a moment.",
      product: null
    });

  }

}