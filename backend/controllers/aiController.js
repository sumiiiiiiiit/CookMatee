const { GoogleGenerativeAI } = require('@google/generative-ai');

exports.chatWithAI = async (req, res) => {
  try {
    const query = req.body.message || req.body.prompt;

    if (!query) {
      return res.status(400).json({ success: false, message: 'Message is required' });
    }
    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({ success: false, message: 'Gemini API key is not configured' });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({
      model: 'gemini-flash-latest',
      systemInstruction: "You are CookMate AI. Provide extremely brief cooking advice using only '*' as bullet points. One or two lines max.",
    });

    const result = await model.generateContent(query);
    const aiMessage = result.response.text();

    res.status(200).json({ success: true, message: aiMessage, response: aiMessage });
  } catch (error) {
    console.error('[AI Chat] Error:', error);

    let status = 500;
    let errMsg = 'Failed to get response from AI';

    if (error.status === 429 || error.response?.status === 429) {
      status = 429;
      errMsg = 'Daily AI quota reached. Please try again later.';
    } else if (error.message) {
      errMsg = error.message;
    }

    res.status(status).json({ success: false, message: errMsg });
  }
};
