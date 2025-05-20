"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";

const travelTipsPrompt = ai.definePrompt({
  name: "travelTipsPrompt",
  input: {
    schema: z.object({
      userQuery: z.string(),
      originAirport: z.string(),
      destinationAirport: z.string(),
      departDate: z.string(),
      returnDate: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      tips: z.array(
        z.object({
          title: z.string(),
          content: z.string(),
        })
      ),
    }),
  },
  prompt: `Task: Based on the user’s travel query: {{{userQuery}}}, generate 3 personalized travel tips for their trip from {{{originAirport}}} to {{{destinationAirport}}}.

        Guidelines for Tips:
        1. Each tip should be:
        - Short and concise: Maximum 20 words
        - Directly relevant to the user's query
        - Tailored to the destination, season, and current weather
        - Practical and actionable

        2. Include local insights, such as:
        - Hidden gems
        - Popular foods or customs
        - Local etiquette or transport hacks
        - Mention any relevant local events or festivals (if applicable)

        3. Output format must be a valid JSON array of 3 objects, each with:
        - "title": A brief heading
        - "content": The tip itself`,
});

export const generateTravelTipsAction = async ({
  userQuery,
  originAirport,
  destinationAirport,
  departDate,
  returnDate,
}: {
  userQuery: string;
  originAirport: string;
  destinationAirport: string;
  departDate: string;
  returnDate?: string;
}) => {
  console.log("Server action called with:", {
    userQuery,
    originAirport,
    destinationAirport,
    departDate,
    returnDate,
  });

  try {
    const result = await travelTipsPrompt({
      userQuery,
      originAirport,
      destinationAirport,
      departDate,
      returnDate,
    });

    console.log("Server action result:", result);
    return result.output;
  } catch (error) {
    console.error("Error generating travel tips:", error);
    return { tips: [] };
  }
};
