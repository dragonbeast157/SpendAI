const axios = require('axios');
const OpenAI = require('openai');
const Anthropic = require('@anthropic-ai/sdk');
const dotenv = require('dotenv');

dotenv.config();

// Initialize clients only if API keys are available
let openai = null;
let anthropic = null;

console.log('LLM Service: Checking API key availability...');
console.log('LLM Service: OpenAI API key available:', !!process.env.OPENAI_API_KEY);
console.log('LLM Service: Anthropic API key available:', !!process.env.ANTHROPIC_API_KEY);

if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });
  console.log('LLM Service: OpenAI client initialized');
}

if (process.env.ANTHROPIC_API_KEY) {
  anthropic = new Anthropic({
    apiKey: process.env.ANTHROPIC_API_KEY,
  });
  console.log('LLM Service: Anthropic client initialized');
}

const MAX_RETRIES = 3;
const RETRY_DELAY = 1000;

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function sendRequestToOpenAI(model, message) {
  if (!openai) {
    console.error('LLM Service: OpenAI API key not configured');
    throw new Error('OpenAI API key not configured');
  }

  console.log('LLM Service: Sending request to OpenAI with model:', model);
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const response = await openai.chat.completions.create({
        model: model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });
      console.log('LLM Service: OpenAI response received successfully');
      return response.choices[0].message.content;
    } catch (error) {
      console.error(`LLM Service: Error sending request to OpenAI (attempt ${i + 1}):`, error.message);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendRequestToAnthropic(model, message) {
  if (!anthropic) {
    console.error('LLM Service: Anthropic API key not configured');
    throw new Error('Anthropic API key not configured');
  }

  console.log('LLM Service: Sending request to Anthropic with model:', model);
  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      console.log(`LLM Service: Sending request to Anthropic with model: ${model}`);
      const response = await anthropic.messages.create({
        model: model,
        messages: [{ role: 'user', content: message }],
        max_tokens: 1024,
      });
      console.log(`LLM Service: Received response from Anthropic successfully`);
      return response.content[0].text;
    } catch (error) {
      console.error(`LLM Service: Error sending request to Anthropic (attempt ${i + 1}):`, error.message);
      if (i === MAX_RETRIES - 1) throw error;
      await sleep(RETRY_DELAY);
    }
  }
}

async function sendLLMRequest(provider, model, message) {
  console.log('LLM Service: sendLLMRequest called with provider:', provider);
  switch (provider.toLowerCase()) {
    case 'openai':
      return sendRequestToOpenAI(model, message);
    case 'anthropic':
      return sendRequestToAnthropic(model, message);
    default:
      throw new Error(`Unsupported LLM provider: ${provider}`);
  }
}

module.exports = {
  sendLLMRequest
};