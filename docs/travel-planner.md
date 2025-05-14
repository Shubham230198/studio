# Smart Travel Planner – Implementation Guide

## 1. Goal

Develop an AI-assisted travel-planning experience that can:

1. Understand a user's free-form request and iteratively collect the following **mandatory slots**:
   - `originAirport`
   - `destinationAirport`
   - `departDate` – DD/MM/YYYY
   - `passengerCount` – (assume all adults)
2. When all slots are present, call the **Flight Search API** to retrieve live flight options.
3. Present flight options _and_ a suggested trip itinerary back to the user inside the existing chat UI.

---

## 2. Architectural Overview

```mermaid
flowchart LR
    subgraph UI (client)
        A[PromptComposer]
        B[ChatWindow]
    end

    subgraph Server (Next / Genkit)
        C[planItineraryFlow (genkit)]
        D[slotExtractionPrompt]
        E[flightSearchFn]
        F[itineraryPrompt]
    end

    A -- user prompt --> C
    C --> D
    C -->|missing slots| B
    C -->|all slots filled| E
    E --> C
    C --> F
    F --> B
```

- **`planItineraryFlow`** orchestrates the workflow: slot filling → flight search → itinerary creation.
- **Prompts** (`slotExtractionPrompt` & `itineraryPrompt`) run on **Gemini** via the existing `ai` helper in `src/ai/genkit.ts`.
- **`flightSearchFn`** is a plain TypeScript function that hits the external Flight Search API (REST/GraphQL) and returns `FlightOption[]`.

---

## 3. Data Contracts

### 3.1 Slot / Query Types – `src/types/travel.ts`

```ts
export interface TravelQuery {
  originAirport: string | null;
  destinationAirport: string | null;
  departDate: string | null; // DD/MM/YYYY
  passengerCount: number | null;
}

export interface FlightOption {
  id: string;
  price: number; // total price in default currency
  currency: string;
  airline: string;
  flightNumbers: string [];
  departTime: string; // ISO
  arriveTime: string; // ISO
  durationMinutes: number;
  stops: number;
  bookingUrl: string; // deep-link to provider booking page
}

export interface ItineraryPlan {
  summary: string; // high-level text summary
  dayByDay: string[]; // markdown list – 1 entry per day
  flights: FlightOption[]; // echoed back for UI rendering
}
```

### 3.2 Environment Variables – `.env.local`

```env
NEXT_PUBLIC_FLIGHT_API_BASE=https://api.example.com/v1
FLIGHT_API_KEY=xxxxxxxxxxxxxxxx
```

_Keep `FLIGHT_API_KEY` **server-only**._

---

## 4. Genkit Flows

Create in `src/ai/flows/plan-itinerary.ts`.

### 4.1 Slot-Extraction Prompt

```ts
const slotExtractionPrompt = ai.definePrompt({
  name: "slotExtractionPrompt",
  input: { schema: z.object({ userMessage: z.string() }) },
  output: {
    schema: z.object({
      originAirport: z.string().nullable(),
      destinationAirport: z.string().nullable(),
      departDate: z.string().nullable(),
      passengerCount: z.number().nullable(),
    }),
  },
  prompt: `Extract the following fields from the user message. If a field is not present, return null.
Fields: originAirport IATA code, destinationAirport IATA code, departDate (DD/MM/YYYY), passengerCount (adults).
User: {{{userMessage}}}`,
});
```

### 4.2 planItineraryFlow

```ts
export const planItineraryFlow = ai.defineFlow(
  {
    name: "planItineraryFlow",
    inputSchema: z.object({
      userMessage: z.string(),
      previousQuery: z.any().optional(), // serialized TravelQuery from convo state
    }),
    outputSchema: z.union([
      z.object({ ask: z.string() }), // follow-up question
      z.object({ plan: z.custom<ItineraryPlan>() }), // final answer
    ]),
  },
  async ({ userMessage, previousQuery }) => {
    // 1. Extract slots
    const extraction = (await slotExtractionPrompt({ userMessage })).output;
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

    // 2. Ask follow-up if something is missing
    for (const [key, value] of Object.entries(merged) as [
      keyof TravelQuery,
      unknown
    ][]) {
      if (value === null) {
        return { ask: `Could you please tell me your ${key}?` };
      }
    }

    // 3. Search flights
    const flights = await flightSearchFn(merged);

    // 4. Build itinerary summary using Gemini
    const { output } = await itineraryPrompt({
      flights,
      ...merged,
    });

    return { plan: { ...output!, flights } };
  }
);
```

`flightSearchFn` lives in `src/lib/flight-search.ts` and wraps your external API.

---

## 5. Flight Search Utility – `src/lib/flight-search.ts`

```ts
import type { FlightOption, TravelQuery } from "@/types/travel";

export async function flightSearchFn(
  query: TravelQuery
): Promise<FlightOption[]> {
  const { NEXT_PUBLIC_FLIGHT_API_BASE } = process.env;
  const res = await fetch(`${NEXT_PUBLIC_FLIGHT_API_BASE}/search`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      // server-only key, never expose to browser
      Authorization: `Bearer ${process.env.FLIGHT_API_KEY}`,
    },
    body: JSON.stringify({
      origin: query.originAirport,
      destination: query.destinationAirport,
      date: query.departDate, // format as needed by provider
      adults: query.passengerCount,
    }),
  });

  if (!res.ok) throw new Error("Flight API error");
  const data = await res.json();

  // Adapt the provider schema → FlightOption[]
  return data.flights.map(mapProviderToFlightOption);
}
```

---

## 6. UI Changes

### 6.1 Render Logic

In `src/app/page.tsx` (or a new context provider) track a `travelQuery` state per chat. When `planItineraryFlow` returns `{ ask }`, append an **AI** message with that question. When it returns `{ plan }`, render:

1. A rich component `<FlightOptions flights={plan.flights} />` showing airline logo, times, price.
2. A markdown render of `plan.summary + dayByDay`.

### 6.2 Components

- `components/travel/flight-card.tsx`
- `components/travel/flight-options.tsx`
- `components/travel/itinerary-summary.tsx`
- `components/travel/flight-link.tsx`

Use ShadCN UI cards & tables for consistency.

### 6.3 Example Flight Card

```tsx
<Link
  href={flight.bookingUrl}
  target="_blank"
  rel="noopener noreferrer"
  className="block hover:shadow-lg transition-shadow"
>
  <Card>
    <CardHeader>
      <div className="flex items-center gap-2">
        <img src={`/airlines/${flight.airline}.png`} className="h-4" />
        <span>
          {flight.airline} {flight.flightNumber}
        </span>
      </div>
      <span className="ml-auto font-semibold">
        {flight.currency} {flight.price}
      </span>
    </CardHeader>
    <CardContent className="text-sm text-muted-foreground">
      {formatTime(flight.departTime)} → {formatTime(flight.arriveTime)} •{" "}
      {flight.stops === 0 ? "Direct" : `${flight.stops} stops`} •{" "}
      {minutesToHrs(flight.durationMinutes)}
    </CardContent>
  </Card>
</Link>
```

---

## 7. Conversation State Management

Keep `TravelQuery` in `allConversations` as a hidden system message or store it in a side map keyed by chat-id. You need it so that subsequent user messages continue slot-filling.

```ts
const [travelQueries, setTravelQueries] = useState<Record<string, TravelQuery>>(
  {}
);
```

Update it after each `planItineraryFlow` invocation.

---

## 8. Prompt Engineering Tips

1. Provide **explicit JSON schema** in prompts to reduce hallucinations.
2. Include examples of valid/invalid airport codes.
3. Ask Gemini to avoid apologetic or verbose language; keep answers concise & actionable.

---

## 9. Testing

- **Unit tests** – mock `flightSearchFn` and ensure slot-extraction / follow-up logic works.
- **E2E tests** – record VCR fixtures for the Flight API.

---

## 10. Roll-out Checklist

- [ ] Add environment vars to Vercel/Cloud Run.
- [ ] Deploy `planItineraryFlow` with `genkit start` and ensure it registers.
- [ ] Verify CORS since Flight API is server-side only.
- [ ] QA slot-filling in dev (`npm run dev` + `genkit:watch`).
- [ ] Ship 🛫.

---

## 11. References

- Genkit docs – https://ai.google.dev/genkit
- Gemini models – https://ai.google.dev/models
- ShadCN UI – https://ui.shadcn.com
