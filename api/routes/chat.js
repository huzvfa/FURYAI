const express = require('express');
const { OpenAI } = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const Conversation = require('../models/Conversation');
const router = express.Router();

// Initialize SDKs
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

router.post('/completions', async (req, res) => {
  const { conversationId, message, endpoint, model } = req.body;
  // TODO: Add auth middleware to get userId
  const userId = 'placeholder_user_id'; 

  try {
    let responseText = '';

    // Multi-Provider Routing Logic
    if (endpoint === 'openai') {
      const stream = await openai.chat.completions.create({
        model: model || 'gpt-4-turbo',
        messages: [{ role: 'user', content: message }],
        stream: true,
      });
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        responseText += content;
        res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
      }
      res.write('data: [DONE]\n\n');
      res.end();

    } else if (endpoint === 'anthropic') {
      const msg = await anthropic.messages.create({
        model: model || 'claude-3-opus-20240229',
        max_tokens: 1024,
        messages: [{ role: 'user', content: message }],
      });
      responseText = msg.content[0].text;
      res.json({ text: responseText });
    }

    // Save to Database
    if (conversationId) {
      await Conversation.findByIdAndUpdate(conversationId, {
        $push: { 
          messages: [
            { role: 'user', content: message },
            { role: 'assistant', content: responseText }
          ]
        }
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
