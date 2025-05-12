'use server';

/**
 * @fileOverview Dynamically generates follow-up suggestions based on user input.
 *
 * - generateSuggestions - A function that generates adaptive suggestions for the suggestion bar.
 * - AdaptiveSuggestionsInput - The input type for the generateSuggestions function.
 * - AdaptiveSuggestionsOutput - The return type for the generateSuggestions function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const AdaptiveSuggestionsInputSchema = z.object({
  userInput: z.string().describe('The user input string to analyze.'),
});
export type AdaptiveSuggestionsInput = z.infer<typeof AdaptiveSuggestionsInputSchema>;

const AdaptiveSuggestionsOutputSchema = z.object({
  suggestions: z
    .array(z.string())
    .describe('An array of suggested actions based on the user input.'),
});
export type AdaptiveSuggestionsOutput = z.infer<typeof AdaptiveSuggestionsOutputSchema>;

export async function generateSuggestions(input: AdaptiveSuggestionsInput): Promise<AdaptiveSuggestionsOutput> {
  return adaptiveSuggestionsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'adaptiveSuggestionsPrompt',
  input: {schema: AdaptiveSuggestionsInputSchema},
  output: {schema: AdaptiveSuggestionsOutputSchema},
  prompt: `You are an AI assistant that generates follow-up action suggestions based on user input.  These suggestions should be short (1-2 words), and should suggest a useful next action the user can take.

For example, if the user input is "What is the capital of France?", suggestions could be: ["Search", "Reason", "Deep Research"].

User Input: {{{userInput}}}

Suggestions:`,
});

const adaptiveSuggestionsFlow = ai.defineFlow(
  {
    name: 'adaptiveSuggestionsFlow',
    inputSchema: AdaptiveSuggestionsInputSchema,
    outputSchema: AdaptiveSuggestionsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
