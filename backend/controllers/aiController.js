exports.chatWithAI = async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).json({ success: false, message: 'Message is required' });
        }

        // Updated for "short and sweet" output as requested
        const systemPrompt = "You are CookMate AI. Provide extremely brief, clear, and helpful cooking advice. Use bullet points if needed. No long introductions. Keep it short and sweet.";

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'llama3',
                messages: [
                    { role: 'system', content: systemPrompt },
                    { role: 'user', content: message }
                ],
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama responded with status: ${response.status}`);
        }

        const data = await response.json();
        const aiMessage = data.message.content;

        res.status(200).json({
            success: true,
            message: aiMessage
        });
    } catch (error) {
        console.error('Ollama Error:', error.message);

        // Check if error is because Ollama is not running
        if (error.cause && error.cause.code === 'ECONNREFUSED' || error.message.includes('fetch failed')) {
            return res.status(503).json({
                success: false,
                message: 'AI service is currently unavailable. Please ensure Ollama is running locally.'
            });
        }

        res.status(500).json({
            success: false,
            message: 'Failed to get response from AI assistant'
        });
    }
};
