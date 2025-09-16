import ollama from 'ollama';

interface OllamaMessage {
  role: 'user' | 'assistant';
  content: string;
}

interface OllamaResponse {
  message: {
    content: string;
  };
}

export async function makeOllamaQuery(prompt: string, aiModel: string): Promise<OllamaResponse> {
  try {
    const response = await ollama.chat({
      model: aiModel,
      messages: [{ role: 'user', content: prompt }] as OllamaMessage[],
    });
    return response;
  } catch (error: any) {
    throw new Error('Error fetching chat response: ' + error.message);
  }
}