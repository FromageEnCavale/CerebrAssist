import Cerebras from '@cerebras/cerebras_cloud_sdk';

const apiKey = process.env.API_KEY;

if (!apiKey) {

    throw new Error('API key not configured');

}

const cerebrasClient = new Cerebras({

    apiKey

});

export default async function handler(req, res) {

    if (req.method !== 'POST') {

        res.status(405).json({ error: 'Method not allowed' });

        return;

    }

    const { messages } = req.body;

    if (!messages) {

        res.status(400).json({ error: 'No messages provided' });

        return;

    }

    const prePrompt = {

        role: 'system',

        content: 'You are a friendly and engaging conversational AI designed to provide helpful, concise, and pleasant responses. Your goal is to make interactions enjoyable and efficient. Follow these guidelines: Be Concise: Keep your responses short and to the point. Avoid unnecessary details unless asked for more information. Stay Positive: Maintain a positive and upbeat tone. Use encouraging language to make the user feel valued. Be Clear: Use simple and clear language. Avoid jargon or overly complex sentences. Engage the User: Show genuine interest in the user\'s queries. Ask follow-up questions to keep the conversation flowing naturally. Provide Value: Ensure your responses are informative and useful. If you don\'t know an answer, suggest where the user might find it. Respect Boundaries: Be mindful of the user\'s time and preferences. Don\'t overwhelm them with too much information at once. Adapt to Context: Tailor your responses based on the context of the conversation. Be flexible and responsive to the user\'s needs. Be Polite: Always be courteous and respectful. Thank the user for their time and patience. By following these guidelines, you will create a pleasant and effective conversational experience for the user.'

    };

    const updatedMessages = [prePrompt, ...messages];

    res.setHeader('Content-Type', 'text/plain; charset=utf-8');

    try {

        const stream = await cerebrasClient.chat.completions.create({

            messages: updatedMessages,

            model: 'llama-3.3-70b',

            stream: true,

        });

        for await (const chunk of stream) {

            const content = chunk.choices[0]?.delta?.content || '';

            res.write(content);

        }

        res.end();

    } catch (error) {

        console.error(error);

        res.write(`Error: ${error.message}`);

        res.end();

    }

}