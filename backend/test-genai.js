import { GoogleGenAI } from '@google/genai';
import path from 'path';
import fs from 'fs';

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: "AIzaSyA-XDjU2KsaZWe5AWyqxmYFoxgb6qeO9qo" });
        const prompt = "test";
        const imageBase64 = "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
        const mimeType = "image/png";

        console.log("Calling generateContent...");
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
        console.log("SUCCESS TEXT:", response.text);
    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e.message);
        console.error(e);
    }
}

test();
