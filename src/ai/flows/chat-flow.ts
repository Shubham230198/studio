'use server';
/**
 * @fileOverview A Genkit flow for generating chat responses.
 *
 * - chatFlow - A function that takes user input and returns an AI-generated response.
 * - ChatFlowInput - The input type for the chatFlow function.
 * - ChatFlowOutput - The return type for the chatFlow function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const ChatFlowInputSchema = z.object({
  prompt: z.string().describe('The user prompt for the chat.'),
});
export type ChatFlowInput = z.infer<typeof ChatFlowInputSchema>;

const ChatFlowOutputSchema = z.object({
  response: z.string().describe("The AI's response to the user's prompt."),
});
export type ChatFlowOutput = z.infer<typeof ChatFlowOutputSchema>;

export async function chatFlow(input: ChatFlowInput): Promise<ChatFlowOutput> {
  return internalChatFlow(input);
}

const chatPrompt = ai.definePrompt({
  name: 'chatPrompt',
  input: {schema: ChatFlowInputSchema},
  output: {schema: ChatFlowOutputSchema},
  prompt: `You are a helpful AI assistant. Respond to the user's prompt clearly and concisely.
User Prompt: {{{prompt}}}

AI Response:`,
  // Optional: Configure safety settings if needed, e.g.
  // config: {
  //   safetySettings: [
  //     {
  //       category: 'HARM_CATEGORY_DANGEROUS_CONTENT',
  //       threshold: 'BLOCK_ONLY_HIGH',
  //     },
  //   ],
  // },
});

const internalChatFlow = ai.defineFlow(
  {
    name: 'internalChatFlow',
    inputSchema: ChatFlowInputSchema,
    outputSchema: ChatFlowOutputSchema,
  },
  async (input: ChatFlowInput) => {
    const {output} = await chatPrompt(input);
    if (!output) {
      // This case should ideally not happen if the prompt is well-defined
      // and the model behaves as expected.
      // However, as a fallback, we can return an empty string or throw an error.
      console.error('Chat flow did not produce an output.');
      return { response: "I'm sorry, I couldn't generate a response." };
    }
    return output;
  }
);
