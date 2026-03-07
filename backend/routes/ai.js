import express from 'express';
import { GoogleGenAI } from '@google/genai';

const router = express.Router();

// Initialize the Google Gen AI client with the API key from environment
// We initialize it lazily or check if the key exists to prevent server crashes on startup
export const getAiClient = () => {
    const apiKey = (process.env.GEMINI_API_KEY || '').trim();

    if (!apiKey) {
        console.warn('GEMINI_API_KEY not configured or empty after trim');
        return null;
    }
    console.log('Initializing GoogleGenAI with key length:', apiKey.length);
    return new GoogleGenAI({ apiKey });
};

/**
 * Categorize a raw text transaction into structured data.
 * POST /api/ai/categorize
 * Body: { text: "Bought 2 coffees for $12 at Starbucks" }
 */
router.post('/categorize', async (req, res) => {
    try {
        const { text } = req.body;

        if (!text) {
            return res.status(400).json({ error: 'Text input is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({ error: 'AI Service is not configured (Missing API Key)' });
        }

        const prompt = `
            You are an AI assistant for a personal finance app. 
            Extract the transaction details from the following user input: "${text}"
            
            Return ONLY a valid JSON object matching this exact structure:
            {
                "amount": number (extract the absolute cost exactly as provided, preserving decimals. Do not round it),
                "category": string (If income, choose from: Paycheck, Rental Income, Business Profit, Investment Income, Other Income. If expense, choose from: Food, Travel, Shopping, Bills, Rent, EMI / Loan, Entertainment, Other),
                "note": string (a short, clean summary of what was bought or earned),
                "type": string (choose "income" if it implies earning/receiving money, or "expense" if it is spending of money)
            }
            Do not include Markdown formatting or \`\`\`json block. Just return raw JSON.
        `;

        const ai = getAiClient();
        if (!ai) {
            return res.status(503).json({ error: 'AI Service is not configured (Missing API Key)' });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const resultText = response.text.trim();
        // Defensive check in case the LLM returned markdown wrapped JSON
        const cleanJSON = resultText.replace(/```json/g, '').replace(/```/g, '').trim();

        const data = JSON.parse(cleanJSON);

        res.status(200).json(data);
    } catch (error) {
        console.error('Error in AI categorization:', error);
        res.status(500).json({ error: error.message || 'Failed to process AI categorization' });
    }
});

/**
 * Scan a receipt image via Multimodal AI and extract transaction data.
 * POST /api/ai/scan-receipt
 * Body: { imageBase64: "...", mimeType: "image/jpeg" }
 */
router.post('/scan-receipt', async (req, res) => {

    try {
        const { imageBase64, mimeType } = req.body;
        console.log('Request body received - mimeType:', mimeType, ', imageBase64 length:', imageBase64?.length);

        if (!imageBase64 || !mimeType) {
            return res.status(400).json({ error: 'Image data and mimeType are required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(503).json({ error: 'AI Service is not configured (Missing API Key)' });
        }

        const prompt = `
            You are a receipt scanning AI for a personal finance app.
            Analyze the provided image of a receipt or invoice.
            
            Extract the transaction details and return ONLY a valid JSON object matching this exact structure:
            {
                "amount": number (the final total cost, preserving decimals. Do not round it),
                "category": string (If income, choose from: Paycheck, Rental Income, Business Profit, Investment Income, Other Income. If expense, choose from: Food, Travel, Shopping, Bills, Rent, EMI / Loan, Entertainment, Other),
                "note": string (the name of the merchant, store, or a quick summary),
                "type": string (choose "income" if it implies earning/receiving money, or "expense" if it is spending of money)
            }
            Do not include Markdown formatting or \`\`\`json block. Just return raw JSON. If you cannot read the image, return a best guess or empty strings.
        `;

        const ai = getAiClient();
        if (!ai) {
            return res.status(503).json({ error: 'AI Service is not configured' });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: [
                prompt,
                {
                    inlineData: {
                        data: imageBase64,
                        mimeType: mimeType
                    }
                }
            ],
        });

        const resultText = response.text.trim();
        const cleanJSON = resultText.replace(/```json/g, '').replace(/```/g, '').trim();
        const data = JSON.parse(cleanJSON);

        res.status(200).json(data);
    } catch (error) {
        console.error('Error scanning receipt:', error);
        res.status(500).json({ error: error.message || 'Failed to scan receipt' });
    }
});


/**
 * Get personalized financial insights based on data.
 * POST /api/ai/insights
 * Body: { transactions: [...], budgets: [...] }
 */
router.post('/insights', async (req, res) => {
    try {
        const { transactions, budgets } = req.body;

        if (!process.env.GEMINI_API_KEY) {
            return res.status(200).json({
                insight: 'Welcome! To unlock an AI Financial Coach, please provide a Gemini API Key in your backend.'
            });
        }

        if (!transactions || transactions.length === 0) {
            return res.status(200).json({
                insight: 'Add some transactions so I can analyze your spending habits and provide tips!'
            });
        }

        const prompt = `
            You are a helpful, encouraging Financial Coach AI.
            Analyze the following user data to provide a very brief (1 or 2 sentences max) insight or tip.
            
            Recent Transactions (Summary):
            ${JSON.stringify(transactions.slice(0, 10))} // Limiting to top 10 for context

            Monthly Budgets Setup:
            ${JSON.stringify(budgets)}

            Be encouraging and specific. Do not use markdown like bold text. Give direct advice. 
            Example: "You are spending a lot on Food this month. Consider cooking at home to stay under your $300 budget."
            
            Return plain text only.
        `;

        const ai = getAiClient();
        if (!ai) {
            return res.status(200).json({
                insight: 'Welcome! To unlock an AI Financial Coach, please provide a Gemini API Key in your backend.'
            });
        }

        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        res.status(200).json({ insight: response.text.trim() });
    } catch (error) {
        console.error('Error in AI insights:', error);
        res.status(500).json({ error: 'Failed to generate financial insight' });
    }
});

export default router;
