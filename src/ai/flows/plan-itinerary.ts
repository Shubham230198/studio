"use server";

import { ai } from "@/ai/genkit";
import { z } from "zod";
import { flightSearchFn } from "@/lib/flight-search";
import { reviewFlight } from "@/lib/flight-api";
import type { TravelQuery, FlightOption } from "@/types/travel";

const mandatoryFields = [
  "originAirport",
  "destinationAirport",
  "departDate",
  "passengerCount",
  "isRoundTrip",
];

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
      filters: z.array(
        z.object({
          type: z.string(),
          value: z.string(),
        })
      ),
    }),
  },
  prompt: `Extract the following fields from the user message. If a field is not present, return null.
      Fields: 
        - originAirport IATA code, 
        - destinationAirport IATA code, 
        - departDate (DD/MM/YYYY), 
        - passengerCount (adults), 
        - isRoundTrip (boolean), 
        - returnDate (DD/MM/YYYY), 
        - filter: List of filters to apply to the flight search
          - CHEAPEST
          - FASTEST
          - STOPS:0/1/2
          - AIRLINE: 6E/SG/AI/XY etc (comma separated airline codes, if multiple airlines are mentioned)
          - DEPARTURE_TIME: (could be EARLY_MORNING, MORNING, AFTERNOON, EVENING, NIGHT)
            - EARLY_MORNING (for flights departing between Midnight to 8 am)
            - MORNING (for flights departing between 8 am to Noon)
            - AFTERNOON (for flights departing between Noon to 4 pm)
            - EVENING (for flights departing between 4 pm to 8 pm)
            - NIGHT (for flights departing between 8 pm to Midnight)


      Instructions:
      - Today's date is ${new Date().toLocaleDateString("en-GB")}
      - Compulsory fields are originAirport, destinationAirport, departDate, passengerCount, isRoundTrip.
      - If user doesn't mention the complete date, please use the most matching upcoming date, (e.g. if user says "next Friday", please use the date of next Friday)
      - If user doesn't mention anything about date, please mark it as null.
      - There can be multiple filters, please return all the filters in the filters array.

      Rules:
      1. originAirport and destinationAirport must be valid IATA codes (3 letters)
      2. departDate and returnDate must be in DD/MM/YYYY format
      3. List any missing or invalid fields in missingFields array
      4. If the user mentions a city or country, use the IATA code for the nearest airport.
      5. If user doesn't mention anything about isRoundTrip, please assume it to be false.
      6. If user doesn't mention anything about returnDate, please assume it to be null.

      Examples:
      - "I want fastest flight from DEL to BOM" -> {originAirport: "DEL", destinationAirport: "BOM", departDate: null, passengerCount: null, missingFields: ["departDate", "passengerCount"], returnDate: null, isRoundTrip: false, filter: [{type: "FASTEST", value: true}}]
      - "I want cheapest flight from DEL to BOM" -> {originAirport: "DEL", destinationAirport: "BOM", departDate: null, passengerCount: null, missingFields: ["departDate", "passengerCount"], returnDate: null, isRoundTrip: false, filter: [{type: "CHEAPEST", value: true}]}
      - "I want to fly from DEL to BOM on 25/12/2024 with 2 people" -> {originAirport: "DEL", destinationAirport: "BOM", departDate: "25/12/2024", passengerCount: 2, missingFields: [], returnDate: null, isRoundTrip: false, filter: []}
      - "Looking for flights to London" -> {originAirport: null, destinationAirport: "LHR", departDate: null, passengerCount: null, missingFields: ["originAirport", "departDate", "passengerCount"], returnDate: null, isRoundTrip: false, filter: []}
      - "Flight from Mumbai to Delhi" -> {originAirport: "BOM", destinationAirport: "DEL", departDate: null, passengerCount: null, missingFields: ["departDate", "passengerCount"], returnDate: null, isRoundTrip: false, filter: []}
      - "I want to fly from DEL to DXB on 25/12 and return on 27/12" -> {originAirport: "DEL", destinationAirport: "DXB", departDate: "25/12/2025", passengerCount: 1, missingFields: [], returnDate: "27/12/2025", isRoundTrip: true, filter: []}
      - "Help me choose a flight to fly from Delhi to Bangalore next Friday" -> {originAirport: "DEL", destinationAirport: "BLR", departDate: "23/05/2025", passengerCount: null, missingFields: ["passengerCount"], returnDate: null, isRoundTrip: false, filter: []}
      - "Flight from Mumbai to Dubai from 02/11 to 04/11" -> {originAirport: "BOM", destinationAirport: "DXB", departDate: "02/11/2025", passengerCount: 0, missingFields: ["passengerCount"], returnDate: "04/11/2025", isRoundTrip: true, filter: []}
      - "Delhi to New York, 22nd June indigo flights Early Morning" -> {originAirport: "DEL", destinationAirport: "JFK", departDate: "22/06/2025", passengerCount: null, missingFields: ["passengerCount"], returnDate: null, isRoundTrip: false, filter: [{type: "DEPARTURE_TIME", value: "EARLY_MORNING"}]}
      - "Delhi to New York, 22nd June indigo flights night flights only" -> {originAirport: "DEL", destinationAirport: "JFK", departDate: "22/06/2025", passengerCount: null, missingFields: ["passengerCount"], returnDate: null, isRoundTrip: false, filter: [{type: "DEPARTURE_TIME", value: "NIGHT"}, {type: "AIRLINE", value: "6E"}]}

      User: {{{userMessage}}}

      Chat context: {{{chatContext}}}`,
});

interface ReviewedFlight extends FlightOption {
  itineraryId: string | null;
  itineraryStatus: string;
}

async function reviewSelectedFlights(
  flights: FlightOption[] | null,
  passengerCount: number
): Promise<ReviewedFlight[]> {
  if (flights == null) {
    return [];
  } else if (flights.length > 2) {
    return flights.map((flight) => ({
      ...flight,
      itineraryId: null,
      itineraryStatus: "SUCCESS",
    }));
  }
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
            domain: "OM",
            externalApi: false,
            international: true,
            sid: `DC_Search-${Date.now()}`,
            sourceType: "B2C",
            utmCurrency: "OMR",
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
          filters: z.array(
            z.object({
              type: z.string(),
              value: z.string(),
            })
          ),
        }),
      }), // flight results
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
        (extraction.passengerCount ?? previousQuery?.passengerCount ?? 1) || 1,
      returnDate: extraction.returnDate ?? previousQuery?.returnDate ?? null,
      isRoundTrip:
        extraction.isRoundTrip ?? previousQuery?.isRoundTrip ?? false,
      filters: extraction.filters ?? previousQuery?.filters ?? [],
    };
    console.log("Merged query data:", merged);

    // 2. Check for missing fields and ask follow-up questions
    console.log("Step 4: Checking for missing fields...");
    const missingFields = Object.entries(merged)
      .filter(
        ([key, value]) =>
          mandatoryFields.includes(key) && (value === null || value == "null")
      )
      .map(([key]) => key);
    console.log("Missing fields:", missingFields);

    if (
      merged.isRoundTrip &&
      merged.isRoundTrip == true &&
      merged.returnDate == null
    ) {
      missingFields.push("returnDate");
    }

    if (missingFields.length > 0) {
      const fieldNames = {
        originAirport: "departure airport",
        destinationAirport: "destination airport",
        departDate: "departure date",
        passengerCount: "number of passengers",
        returnDate: "return date",
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
      filters: merged.filters! || [],
    };
    console.log("Valid query for flight search:", validQuery);

    try {
      console.log("Step 6: Calling flight search API...");
      const allFlights = await flightSearchFn(validQuery);

      // Get flights by different categories
      console.log(
        `Step 7: Categorizing and selecting flights...: ${allFlights.length}`
      );

      // Currently we are not filtering the flights
      const selectedFlights = allFlights;

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
        currency: "OMR",
        bookingUrl: flight.bookingUrl,
        fareKey: flight.fareKey,
        fareBasisCode: flight.fareBasisCode,
        originAirport: flight.originAirport,
        destinationAirport: flight.destinationAirport,
        couponData: flight.couponData,
        itineraryId: flight.itineraryId,
        itineraryStatus: flight.itineraryStatus,
        reviewUrl: `${process.env.CLEARTRIP_BASE_URL}/flights/itinerary/${flight.itineraryId}/info?ancillaryEnabled=true`,
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
          filters: validQuery.filters,
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
