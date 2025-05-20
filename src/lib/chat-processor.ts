import { ai } from "@/ai/genkit";
import { ChatSessionMemory } from "@/types/chat";
import { FlightOption, TravelQuery } from "@/types/travel";
import { FlightOptions } from "@/components/travel/flight-options";
import { ItinerarySummary } from "@/components/travel/itinerary-summary";
import React from "react";
import { flightSearchFn } from "@/lib/flight-search";

interface ProcessResult {
  aiResponse: string;
  updatedMemory?: Partial<Omit<ChatSessionMemory, "id" | "messages">>;
  components?: React.ReactNode;
}

export async function processUserMessage(
  message: string,
  session: ChatSessionMemory
): Promise<ProcessResult> {
  // Extract conversation history for context
  const conversationHistory = formatConversationForAI(session.messages);

  // Step 1: Extract travel information from the message
  const prompt = `
    Extract travel information from the following message. If no information is present, return null for that field.
    
    Previous travel context:
    Origin: ${session.originAirport || "Unknown"}
    Destination: ${session.destinationAirport || "Unknown"}
    Departure date: ${session.departureDate || "Unknown"}
    Passenger count: ${session.passengerCount || "Unknown"}
    
    Today's date: ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: '2-digit', day: '2-digit' })}
    User message: "${message}"
    
    Determine if this is a travel-related query (true/false).
    If information is not explicitly mentioned but can be inferred from context, use the context.
    For airports:
    - Extract the exact IATA airport code (3 letters)
    - If city name is provided, convert to the main airport code for that city
    - Example: "Dubai" -> "DXB", "London" -> "LHR", "New York" -> "JFK"
    
    For dates:
    - Convert to DD/MM/YYYY format
    - If year is not specified, use the next possible date
    - Example: "next friday" -> convert to actual date
    - Example: "15th March" -> "15/03/2024" (assuming current year or next year if date has passed)
    
    Return the results in JSON format with these fields:
    {
      "isTravelQuery": boolean,
      "originAirport": string or null (3-letter IATA code),
      "destinationAirport": string or null (3-letter IATA code),
      "departureDate": string or null (DD/MM/YYYY),
      "passengerCount": number or null,
      "context": string or null (any important travel context)
    }
  `;

  const extractionResponse = await ai.generate(prompt);
  const jsonMatch = extractionResponse.text.match(/\{[\s\S]*\}/);
  let travelInfo = {
    isTravelQuery: false,
    originAirport: null,
    destinationAirport: null,
    departureDate: null,
    passengerCount: null,
    context: null,
  };

  if (jsonMatch) {
    try {
      const extractedInfo = JSON.parse(jsonMatch[0]);
      travelInfo = {
        isTravelQuery: extractedInfo.isTravelQuery || false,
        originAirport: extractedInfo.originAirport || null,
        destinationAirport: extractedInfo.destinationAirport || null,
        departureDate: extractedInfo.departureDate || null,
        passengerCount: extractedInfo.passengerCount || null,
        context: extractedInfo.context || null,
      };
    } catch (error) {
      console.error("Error parsing travel info:", error);
    }
  }

  // Step 2: Update session memory with any new travel information
  const updatedMemory: Partial<Omit<ChatSessionMemory, "id" | "messages">> = {};

  if (travelInfo.originAirport) {
    updatedMemory.originAirport = travelInfo.originAirport;
  }

  if (travelInfo.destinationAirport) {
    updatedMemory.destinationAirport = travelInfo.destinationAirport;
  }

  if (travelInfo.departureDate) {
    updatedMemory.departureDate = travelInfo.departureDate;
  }

  if (travelInfo.passengerCount) {
    updatedMemory.passengerCount = travelInfo.passengerCount;
  }

  if (travelInfo.context) {
    updatedMemory.chatContext = [
      ...(session.chatContext || []),
      travelInfo.context,
    ];
  }

  // Step 3: Generate appropriate response based on query type
  if (travelInfo.isTravelQuery) {
    const travelQuery: TravelQuery = {
      originAirport: updatedMemory.originAirport || session.originAirport,
      destinationAirport:
        updatedMemory.destinationAirport || session.destinationAirport,
      departDate: updatedMemory.departureDate || session.departureDate,
      passengerCount:
        updatedMemory.passengerCount || session.passengerCount || 1,
    };

    // Check if we have enough information for a flight search
    if (
      travelQuery.originAirport &&
      travelQuery.destinationAirport &&
      travelQuery.departDate
    ) {
      try {
        // Search for flights using existing functionality
        const flights = await flightSearchFn(travelQuery);

        const promptForTravelResponse = `
          User is planning a trip from ${travelQuery.originAirport} to ${
          travelQuery.destinationAirport
        } 
          on ${travelQuery.departDate} for ${
          travelQuery.passengerCount
        } passenger(s).
          
          They said: "${message}"
          
          Previous conversation: ${conversationHistory}
          
          ${
            flights.length > 0
              ? `I found ${flights.length} flights. The cheapest one costs ${flights[0].price} ${flights[0].currency}.`
              : "I could not find any flights matching this criteria."
          }
          
          Write a helpful, concise response acknowledging their travel plans and the flight options. 
          Be conversational but direct.
        `;

        const aiResponse = await ai.generate(promptForTravelResponse);

        return {
          aiResponse: aiResponse.text,
          updatedMemory,
          components:
            flights.length > 0
              ? React.createElement(FlightOptions, { flights })
              : undefined,
        };
      } catch (error) {
        console.error("Error searching flights:", error);
        return {
          aiResponse:
            "I apologize, but I encountered an error while searching for flights. Please try again later.",
          updatedMemory,
        };
      }
    } else {
      // We don't have enough information, ask for missing details
      const missingFields = [];
      if (!travelQuery.originAirport) missingFields.push("departure city");
      if (!travelQuery.destinationAirport) missingFields.push("destination");
      if (!travelQuery.departDate) missingFields.push("travel date");

      const promptForMoreInfo = `
        User said: "${message}"
        
        Previous conversation: ${conversationHistory}
        
        The user seems to be planning a trip but I'm missing the following information: ${missingFields.join(
          ", "
        )}.
        
        Write a helpful, concise response asking for the missing information in a conversational way.
        Be friendly but direct.
      `;

      const aiResponse = await ai.generate(promptForMoreInfo);

      return {
        aiResponse: aiResponse.text,
        updatedMemory,
      };
    }
  }

  // For non-travel queries, provide a general response
  const promptForGeneralResponse = `
    User said: "${message}"
    
    Previous conversation: ${conversationHistory}
    
    Travel context: ${session.chatContext.join(" ")}
    Origin: ${session.originAirport || "unknown"}
    Destination: ${session.destinationAirport || "unknown"}
    Date: ${session.departureDate || "unknown"}
    Passengers: ${session.passengerCount || "unknown"}
    
    Respond conversationally to the user's message. If they're asking about travel but we don't have enough information,
    politely ask for the details needed. If they're asking about something unrelated to travel, provide a helpful response.
    Keep your answer concise and friendly.
  `;

  const aiResponse = await ai.generate(promptForGeneralResponse);

  return {
    aiResponse: aiResponse.text,
    updatedMemory,
  };
}

// Helper function to format conversation history for the AI
function formatConversationForAI(messages: any[]) {
  return messages
    .slice(-10) // Get last 10 messages for context
    .map(
      (msg) => `${msg.sender === "user" ? "User" : "Assistant"}: ${msg.text}`
    )
    .join("\n");
}
