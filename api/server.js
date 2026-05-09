// api/server.js
const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { OpenAI } = require('openai');

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Multi-provider initialization logic
app.post('/api/chat', async (req, res) => {
  const { message, provider, model } = req.body;

  try {
    // Example: Routing to OpenAI (can be extended for Anthropic/Google)
    if (provider === 'openai') {
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: model || "gpt-4o",
        messages: [{ role: "user", content: message }],
      });
      return res.json({ text: response.choices[0].message.content });
    }
    
    // Add logic for other providers here
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
