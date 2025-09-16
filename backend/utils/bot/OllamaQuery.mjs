import ollama from 'ollama';

export async function makeOllamaQuery(prompt,aiModel) {
    try {
        const response = await ollama.chat({
            model: aiModel,
            messages: [{ role: 'user', content: prompt }],
        });
        return response;
    } catch (error) {
        throw new Error('Error fetching chat response: ' + error.message);
    }
}