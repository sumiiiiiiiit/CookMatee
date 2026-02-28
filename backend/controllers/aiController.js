const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        if (!process.env.GEMINI_API_KEY) {
            return res.status(500).json({
                success: false,
                message: 'Gemini API Key is missing. Please add it to your .env file.'
            });
        }

        console.log(`[AI Chat] Request: "${message.substring(0, 50)}..."`);

        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

        // Using gemini-flash-latest for best availability and speed
        const model = genAI.getGenerativeModel({
            model: "gemini-flash-latest",
            systemInstruction: "You are CookMate AI. Provide extremely brief cooking advice using only '*' as bullet points. Do not use bold headings if it makes it longer. Focus on speed and clarity. One or two lines max if possible."
        });

        const result = await model.generateContent(message);
        const aiMessage = result.response.text();
        console.log("[AI Chat] Success: Response generated");

        res.status(200).json({
            success: true,
            message: aiMessage
        });
    } catch (error) {
        console.error('[AI Chat] Error Detail:', error);

        // Robust error mapping
        let status = 500;
        let errMsg = 'Failed to get response from AI';

        if (error.status === 429 || error.response?.status === 429) {
            status = 429;
            errMsg = 'Daily AI quota reached. Please wait 1 minute.';
        } else if (error.message) {
            errMsg = error.message;
        }

        res.status(status).json({
            success: false,
            message: errMsg
        });
    }
};

