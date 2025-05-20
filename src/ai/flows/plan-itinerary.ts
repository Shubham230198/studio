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
      isRoundTrip: z.boolean().nullable(),
      returnDate: z.string().nullable(),
      missingFields: z.array(z.string()),
    }),
  },
  prompt: `Extract the following fields from the user message. If a field is not present, return null.
      Fields: originAirport IATA code, destinationAirport IATA code, departDate (DD/MM/YYYY), passengerCount (adults), returnDate (DD/MM/YYYY), isRoundTrip (boolean).

      Instructions:
      - Today's date is ${new Date().toLocaleDateString("en-GB")}
      - Compulsory fields are originAirport, destinationAirport, departDate, passengerCount, isRoundTrip.
      - If user doesn't mention the complete date, please use the most matching upcoming date, (e.g. if user says "next Friday", please use the date of next Friday)

      Rules:
      1. originAirport and destinationAirport must be valid IATA codes (3 letters)
      2. departDate and returnDate must be in DD/MM/YYYY format
      3. Minimum default passengerCount is 1.
      4. List any missing or invalid fields in missingFields array
      5. If the user mentions a city or country, use the IATA code for the nearest airport.
      6. If user doesn't mention anything about isRoundTrip, please assume it to be false.
      7. If user doesn't mention anything about returnDate, please assume it to be null.

      Examples:
      - "I want to fly from DEL to BOM on 25/12/2024 with 2 people" -> {originAirport: "DEL", destinationAirport: "BOM", departDate: "25/12/2024", passengerCount: 2, missingFields: [], returnDate: null, isRoundTrip: false}
      - "Looking for flights to London" -> {originAirport: null, destinationAirport: "LHR", departDate: null, passengerCount: null, missingFields: ["originAirport", "departDate", "passengerCount"], returnDate: null, isRoundTrip: false}
      - "Flight from Mumbai to Delhi" -> {originAirport: "BOM", destinationAirport: "DEL", departDate: null, passengerCount: null, missingFields: ["departDate", "passengerCount"], returnDate: null, isRoundTrip: false}
      - "I want to fly from DEL to DXB on 25/12 and return on 27/12" -> {originAirport: "DEL", destinationAirport: "DXB", departDate: "25/12/2025", passengerCount: 1, missingFields: [], returnDate: "27/12/2025", isRoundTrip: true}
      - "Help me choose a flight to fly from Delhi to Bangalore next Friday" -> {originAirport: "DEL", destinationAirport: "BLR", departDate: "23/05/2025", passengerCount: null, missingFields: ["passengerCount"], returnDate: null, isRoundTrip: false}
      - "Flight from Mumbai to Dubai from 02/11 to 04/11" -> {originAirport: "BOM", destinationAirport: "DXB", departDate: "02/11/2025", passengerCount: 0, missingFields: ["passengerCount"], returnDate: "04/11/2025", isRoundTrip: true}

      User: {{{userMessage}}}

      Chat context: {{{chatContext}}}`,
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
            timestamp: z.string(),
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
        validQuery: z.object({
          originAirport: z.string(),
          destinationAirport: z.string(),
          departDate: z.string(),
          passengerCount: z.number(),
          returnDate: z.string().nullable().optional(),
          isRoundTrip: z.boolean().optional(),
        }),
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
      returnDate: extraction.returnDate ?? previousQuery?.returnDate ?? null,
      isRoundTrip:
        extraction.isRoundTrip ?? previousQuery?.isRoundTrip ?? false,
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
      returnDate:
        merged.isRoundTrip && merged.isRoundTrip == true
          ? merged.returnDate!
          : null,
      isRoundTrip: merged.isRoundTrip!,
    };
    console.log("Valid query for flight search:", validQuery);

    try {
      console.log("Step 6: Calling flight search API...");
      const allFlights = await flightSearchFn(validQuery);

      // Get flights by different categories
      console.log("Step 7: Categorizing and selecting flights...");

      // Find cheapest flight
      const cheapestFlight = [...allFlights].sort(
        (a, b) => a.price - b.price
      )[0];

      // Find fastest flight
      const fastestFlight = [...allFlights].sort(
        (a, b) => a.durationMinutes - b.durationMinutes
      )[0];

      // Find non-stop cheapest flight
      const nonStopFlights = allFlights.filter((flight) => flight.stops === 0);
      const cheapestNonStopFlight =
        nonStopFlights.length > 0
          ? nonStopFlights.sort((a, b) => a.price - b.price)[0]
          : null;

      // Combine flights, removing duplicates and assigning multiple categories
      const topFlights = new Map<string, FlightOption>();

      // Add cheapest flight
      if (cheapestFlight) {
        cheapestFlight.categories = ["cheapest"];
        topFlights.set(cheapestFlight.id, cheapestFlight);
      }

      // Add fastest flight
      if (fastestFlight) {
        if (topFlights.has(fastestFlight.id)) {
          // If this flight is already in the list (e.g., it's also the cheapest)
          const existingFlight = topFlights.get(fastestFlight.id)!;
          existingFlight.categories = [
            ...(existingFlight.categories || []),
            "fastest",
          ];
        } else {
          fastestFlight.categories = ["fastest"];
          topFlights.set(fastestFlight.id, fastestFlight);
        }
      }

      // Add cheapest non-stop flight
      if (cheapestNonStopFlight) {
        if (topFlights.has(cheapestNonStopFlight.id)) {
          // If this flight is already in the list
          const existingFlight = topFlights.get(cheapestNonStopFlight.id)!;
          existingFlight.categories = [
            ...(existingFlight.categories || []),
            "non-stop",
          ];
        } else {
          cheapestNonStopFlight.categories = ["non-stop"];
          topFlights.set(cheapestNonStopFlight.id, cheapestNonStopFlight);
        }
      }

      // Convert Map values to array
      const selectedFlights = Array.from(topFlights.values());

      // Review selected flights
      console.log("Step 7a: Reviewing selected flights...");
      const reviewedFlights = await reviewSelectedFlights(
        selectedFlights,
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
        categories: flight.categories || [],
      }));

      console.log(
        "Step 8: Returning formatted flight details",
        formattedFlights
      );
      return {
        flights: formattedFlights,
        validQuery: {
          originAirport: validQuery.originAirport,
          destinationAirport: validQuery.destinationAirport,
          departDate: validQuery.departDate,
          passengerCount: validQuery.passengerCount,
          returnDate: validQuery.returnDate,
          isRoundTrip: validQuery.isRoundTrip,
        },
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
