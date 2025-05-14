"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { flightSearchFn } from "@/lib/flight-search";
import { reviewFlight } from "@/lib/flight-api";
import type { TravelQuery, FlightOption } from "@/types/travel";

const slotExtractionPrompt = ai.definePrompt({
  name: "slotExtractionPrompt",
  input: {
    schema: z.object({
      userMessage: z.string(),
      chatContext: z.string().optional(),
    }),
  },
  output: {
    schema: z.object({
      originAirport: z.string().nullable(),
      destinationAirport: z.string().nullable(),
      departDate: z.string().nullable(),
      passengerCount: z.number().nullable(),
      missingFields: z.array(z.string()),
    }),
  },
  prompt: `Extract the following fields from the user message. If a field is not present, return null.
Fields: originAirport IATA code, destinationAirport IATA code, departDate (DD/MM/YYYY), passengerCount (adults).

Notes:
- Today's date is ${new Date().toLocaleDateString("en-GB")}
- If nohting is mentioned about the departure date, please use the today's date.
- If passengerCount is not mentioned, please assume it to be 1
- If user is missing something, please ask for it.
- If user doesn't mention the complete date, please use the most matching upcoming date.

Rules:
1. originAirport and destinationAirport must be valid IATA codes (3 letters)
2. departDate must be in DD/MM/YYYY format
4. List any missing or invalid fields in missingFields array
5. If the user mentions a city or country, use the IATA code for the nearest airport.
6. If user doesn't mention a Year, please use the current year.


Examples:
- "I want to fly from DEL to BOM on 25/12/2024 with 2 people" -> {originAirport: "DEL", destinationAirport: "BOM", departDate: "25/12/2024", passengerCount: 2, missingFields: []}
- "Looking for flights to London" -> {originAirport: null, destinationAirport: "LHR", departDate: null, passengerCount: null, missingFields: ["originAirport", "departDate", "passengerCount"]}
- "Flight from Mumbai to Delhi" -> {originAirport: "BOM", destinationAirport: "DEL", departDate: null, passengerCount: null, missingFields: ["departDate", "passengerCount"]}
- "I want to fly from DEL to BOM on 25/12" -> {originAirport: "DEL", destinationAirport: "BOM", departDate: "25/12/2025", passengerCount: null, missingFields: ["passengerCount"]}
- "Help me choose a flight to fly from Delhi to Bangalore next Friday" -> {originAirport: "DEL", destinationAirport: "BLR", departDate: "23/05/2025", passengerCount: 1, missingFields: ["passengerCount"]}

User: {{{userMessage}}}

Chat context: {{{chatContext}}}`,
});

const flightSummaryPrompt = ai.definePrompt({
  name: "flightSummaryPrompt",
  input: {
    schema: z.object({
      flights: z.array(z.any()),
    }),
  },
  output: {
    schema: z.object({
      summary: z.string(),
    }),
  },
  prompt: `Create a concise summary of the top 2 flights. For each flight, include:
1. Airline and flight number
2. Departure and arrival times
3. Duration and number of stops
4. Price in AED

Format the response in a clear, easy-to-read way.

Available flights: {{{flights}}}`,
});

interface ReviewedFlight extends FlightOption {
  itineraryId: string | null;
  itineraryStatus: string;
}

async function reviewSelectedFlights(
  flights: FlightOption[],
  passengerCount: number
): Promise<ReviewedFlight[]> {
  console.log("Reviewing selected flights...");
  return Promise.all(
    flights.map(async (flight) => {
      try {
        const reviewResponse = await reviewFlight({
          flightParams: [
            {
              cabinType: "ECONOMY",
              departDate: new Date(flight.departTime)
                .toISOString()
                .split("T")[0], // Convert timestamp to YYYY-MM-DD
              from: flight.originAirport,
              to: flight.destinationAirport,
              onwardFares: [
                {
                  fareKey: flight.fareKey,
                  fareType: "NON_REFUNDABLE",
                  price: flight.price,
                  fareClass: "RETAIL",
                  comboFBC: flight.fareBasisCode,
                },
              ],
            },
          ],
          itineraryMeta: {
            domain: "AE",
            externalApi: false,
            international: true,
            sid: `DC_Search-${Date.now()}`,
            sourceType: "B2C",
            utmCurrency: "AED",
            convFeeRequired: false,
            couponCode: "",
            sft: "",
            dcFlow: true,
          },
          paxInfo: {
            adults: passengerCount,
            children: 0,
            infants: 0,
          },
        });

        return {
          ...flight,
          itineraryId: reviewResponse.itineraryId,
          itineraryStatus: reviewResponse.itineraryStatus,
        };
      } catch (error) {
        console.error(`Error reviewing flight ${flight.id}:`, error);
        return {
          ...flight,
          itineraryId: null,
          itineraryStatus: "ERROR",
        };
      }
    })
  );
}

export const planItineraryFlow = ai.defineFlow(
  {
    name: "planItineraryFlow",
    inputSchema: z.object({
      userMessage: z.string(),
      previousQuery: z.any().optional(), // serialized TravelQuery from convo state
      chatContext: z
        .array(
          z.object({
            id: z.string(),
            sender: z.string(),
            text: z.string(),
            timestamp: z.date(),
          })
        )
        .optional(),
    }),
    outputSchema: z.union([
      z.object({
        ask: z.string(),
        missingFields: z.array(z.string()).optional(),
      }), // follow-up question
      z.object({
        flights: z.array(
          z.object({
            id: z.string(),
            airline: z.string(),
            flightNumbers: z.array(z.string()),
            departTime: z.string(),
            arriveTime: z.string(),
            durationMinutes: z.number(),
            stops: z.number(),
            price: z.number(),
            currency: z.string(),
            bookingUrl: z.string(),
            fareKey: z.string(),
            fareBasisCode: z.string(),
            originAirport: z.string(),
            destinationAirport: z.string(),
            couponData: z.any().optional(),
          })
        ),
      }), // flight results
      z.object({
        plan: z.object({
          summary: z.string(),
          dayByDay: z.array(z.string()),
          flights: z.array(
            z.object({
              id: z.string(),
              airline: z.string(),
              flightNumbers: z.array(z.string()),
              departTime: z.string(),
              arriveTime: z.string(),
              durationMinutes: z.number(),
              stops: z.number(),
              price: z.number(),
              currency: z.string(),
              bookingUrl: z.string(),
              fareKey: z.string(),
              fareBasisCode: z.string(),
              originAirport: z.string(),
              destinationAirport: z.string(),
            })
          ),
        }),
      }), // complete plan
    ]),
  },
  async ({ userMessage, previousQuery, chatContext }) => {
    console.log("Step 1: Starting flow with message:", userMessage);
    console.log("Previous query state:", previousQuery);
    console.log("Chat context:", chatContext);

    // 1. Extract slots from user message and chat context
    console.log("Step 2: Extracting slots from message and context...");
    const extraction = (
      await slotExtractionPrompt({
        userMessage,
        chatContext:
          chatContext?.map((msg) => `${msg.sender}: ${msg.text}`).join("\n") ||
          "",
      })
    ).output;
    console.log("Extracted slots:", extraction);

    if (!extraction) {
      console.log("Error: Slot extraction failed");
      return {
        ask: "I'm having trouble understanding your request. Could you please rephrase it?",
        missingFields: [],
      };
    }

    // Merge with previous query data if available
    console.log("Step 3: Merging with previous query data...");
    const merged: TravelQuery = {
      originAirport:
        extraction.originAirport ?? previousQuery?.originAirport ?? null,
      destinationAirport:
        extraction.destinationAirport ??
        previousQuery?.destinationAirport ??
        null,
      departDate: extraction.departDate ?? previousQuery?.departDate ?? null,
      passengerCount:
        extraction.passengerCount ?? previousQuery?.passengerCount ?? null,
    };
    console.log("Merged query data:", merged);

    // 2. Check for missing fields and ask follow-up questions
    console.log("Step 4: Checking for missing fields...");
    const missingFields = Object.entries(merged)
      .filter(([_, value]) => value === null)
      .map(([key]) => key);
    console.log("Missing fields:", missingFields);

    if (missingFields.length > 0) {
      const fieldNames = {
        originAirport: "departure airport",
        destinationAirport: "destination airport",
        departDate: "departure date",
        passengerCount: "number of passengers",
      };

      const missingFieldNames = missingFields
        .map((field) => fieldNames[field as keyof typeof fieldNames])
        .join(", ");

      console.log("Step 4a: Returning follow-up question for missing fields");
      return {
        ask: `To help you find the best flights, I need to know your ${missingFieldNames}. Could you please provide this information?`,
        missingFields,
      };
    }

    // 3. All required fields are present, search for flights
    console.log("Step 5: All fields present, preparing flight search query...");
    const validQuery = {
      originAirport: merged.originAirport!,
      destinationAirport: merged.destinationAirport!,
      departDate: merged.departDate!,
      passengerCount: merged.passengerCount!,
    };
    console.log("Valid query for flight search:", validQuery);

    try {
      console.log("Step 6: Calling flight search API...");
      const allFlights = await flightSearchFn(validQuery);

      // Get top 2 flights (sorted by price)
      console.log("Step 7: Sorting and selecting top 2 flights...");
      const topFlights = allFlights
        .sort((a, b) => a.price - b.price)
        .slice(0, 2);

      // Review selected flights
      console.log("Step 7a: Reviewing selected flights...");
      const reviewedFlights = await reviewSelectedFlights(
        topFlights,
        validQuery.passengerCount
      );
      console.log("reviewedFlights: ", reviewedFlights);

      // Format flights for UI display
      const formattedFlights = reviewedFlights.map((flight) => ({
        id: flight.id,
        airline:
          flight.flightNumbers?.map((fn) => fn.split("-")[0]).join(" → ") || "",
        flightNumbers: flight.flightNumbers || [],
        departTime: new Date(flight.departTime).toISOString(),
        arriveTime: new Date(flight.arriveTime).toISOString(),
        durationMinutes: flight.durationMinutes,
        stops: flight.stops,
        price: flight.price,
        currency: "AED",
        bookingUrl: flight.bookingUrl,
        fareKey: flight.fareKey,
        fareBasisCode: flight.fareBasisCode,
        originAirport: flight.originAirport,
        destinationAirport: flight.destinationAirport,
        couponData: flight.couponData,
        itineraryId: flight.itineraryId,
        itineraryStatus: flight.itineraryStatus,
        reviewUrl: `https://www.cleartrip.ae/flights/itinerary/${flight.itineraryId}/info?ancillaryEnabled=true`,
      }));

      console.log(
        "Step 8: Returning formatted flight details",
        formattedFlights
      );
      return {
        flights: formattedFlights,
      };
    } catch (error) {
      console.error("Error in flight search:", error);
      return {
        ask: "I apologize, but I'm having trouble searching for flights at the moment. Please try again in a few minutes.",
        missingFields: [],
      };
    }
  }
);
