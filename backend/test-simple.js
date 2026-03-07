import { GoogleGenAI } from '@google/genai';

async function test() {
    try {
        const ai = new GoogleGenAI({ apiKey: "AIzaSyA-XDjU2KsaZWe5AWyqxmYFoxgb6qeO9qo" });
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: "say hi",
        });
        console.log("SUCCESS TEXT:", response.text);
    } catch (e) {
        console.error("ERROR CAUGHT:");
        console.error(e);
    }
}

test();
