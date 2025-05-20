# Flight Search Enhancements Plan

## 1. Enhanced Flight Display Categories

### Current Implementation

Currently, the system shows only the top 2 cheapest flights:

```typescript
const topFlights = allFlights.sort((a, b) => a.price - b.price).slice(0, 2);
```

### Proposed Changes

#### 1.1 Modify Flight Selection Logic in `src/ai/flows/plan-itinerary.ts`

```typescript
// Get flights by different categories
console.log("Step 7: Categorizing and selecting flights...");

// Find cheapest flight
const cheapestFlight = [...allFlights].sort((a, b) => a.price - b.price)[0];

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

// Combine flights, removing duplicates
const topFlights = [];
if (cheapestFlight) {
  cheapestFlight.category = "cheapest";
  topFlights.push(cheapestFlight);
}

if (fastestFlight && fastestFlight.id !== cheapestFlight.id) {
  fastestFlight.category = "fastest";
  topFlights.push(fastestFlight);
}

if (
  cheapestNonStopFlight &&
  cheapestNonStopFlight.id !== cheapestFlight.id &&
  cheapestNonStopFlight.id !== fastestFlight.id
) {
  cheapestNonStopFlight.category = "non-stop";
  topFlights.push(cheapestNonStopFlight);
}
```

#### 1.2 Update `FlightOption` type in `src/types/travel.ts`

```typescript
export interface FlightOption {
  // Existing properties
  id: string;
  price: number;
  currency: string;
  flightNumbers: string[];
  departTime: number | string;
  arriveTime: number | string;
  durationMinutes: number;
  stops: number;
  bookingUrl: string;
  // New properties
  category?: "cheapest" | "fastest" | "non-stop";
  // Other existing properties
  fareKey: string;
  fareBasisCode: string;
  originAirport: string;
  destinationAirport: string;
  couponData: any;
  itineraryId?: string;
  itineraryStatus?: string;
  reviewUrl?: string;
}
```

#### 1.3 Enhance `FlightCard` component in `src/components/travel/flight-card.tsx`

```typescript
export function FlightCard({ flight }: FlightCardProps) {
  // Existing code...

  return (
    <div
      className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={handleCardClick}
    >
      {/* Category Tag */}
      {flight.category && (
        <div
          className={`absolute top-0 right-0 -mt-2 -mr-2 px-3 py-1 rounded-full text-xs font-bold text-white
          ${
            flight.category === "cheapest"
              ? "bg-green-500"
              : flight.category === "fastest"
              ? "bg-blue-500"
              : "bg-yellow-500"
          }`}
        >
          {flight.category === "cheapest"
            ? "CHEAPEST"
            : flight.category === "fastest"
            ? "FASTEST"
            : "NON-STOP"}
        </div>
      )}

      {/* Existing flight card content */}
      {/* ... */}
    </div>
  );
}
```

## 2. Travel Hacks and Suggestions

### 2.1 Create New Component `src/components/travel/travel-tips.tsx`

```typescript
"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LightbulbIcon } from "@heroicons/react/24/outline";

interface TravelTipsProps {
  originAirport: string;
  destinationAirport: string;
  departDate: string;
  returnDate?: string;
}

export function TravelTips({
  originAirport,
  destinationAirport,
  departDate,
  returnDate,
}: TravelTipsProps) {
  // Function to get travel tips based on destination and dates
  const getTravelTips = () => {
    const tips = [];
    const date = new Date(departDate);
    const month = date.getMonth();

    // Destination-specific tips
    switch (destinationAirport) {
      case "DXB":
        tips.push({
          title: "Dubai Travel Tip",
          content:
            "Consider visiting indoor attractions during midday to avoid the heat.",
        });
        break;
      case "DEL":
        if (month >= 4 && month <= 8) {
          // Summer months
          tips.push({
            title: "Delhi Summer Travel",
            content:
              "Delhi can be extremely hot in summer. Stay hydrated and plan indoor activities during peak afternoon hours.",
          });
        } else if (month >= 11 || month <= 1) {
          // Winter months
          tips.push({
            title: "Delhi Winter Travel",
            content:
              "Delhi winters can be foggy affecting flight schedules. Check flight status before heading to the airport.",
          });
        }
        break;
      default:
        tips.push({
          title: "General Travel Tip",
          content:
            "Consider booking airport transfers in advance to avoid last-minute hassles.",
        });
    }

    // General tips (limit to 2 total)
    if (tips.length < 2) {
      tips.push({
        title: "Baggage Allowance",
        content:
          "Check baggage allowance beforehand to avoid excess baggage fees at the airport.",
      });
    }

    return tips.slice(0, 2); // Ensure no more than 2 tips
  };

  const tips = getTravelTips();

  return (
    <div className="my-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <LightbulbIcon className="w-5 h-5 text-yellow-500 mr-2" />
        Travel Hacks
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {tips.map((tip, index) => (
          <Card key={index} className="bg-blue-50 border-blue-100">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-blue-700">
                {tip.title}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-sm text-gray-700">
              {tip.content}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
```

### 2.2 Integrate Travel Tips in `src/components/travel/flight-options.tsx`

```typescript
"use client";

import { FlightOption, TravelQuery } from "@/types/travel";
import { FlightCard } from "./flight-card";
import { TravelTips } from "./travel-tips";
import { Button } from "@/components/ui/button";

interface FlightOptionsProps {
  flights: FlightOption[];
  searchQuery: TravelQuery;
}

export function FlightOptions({ flights, searchQuery }: FlightOptionsProps) {
  if (flights.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No flights found for your search criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="space-y-4">
        {flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>

      {/* Travel Tips Section */}
      <TravelTips
        originAirport={searchQuery.originAirport}
        destinationAirport={searchQuery.destinationAirport}
        departDate={searchQuery.departDate}
        returnDate={searchQuery.returnDate}
      />

      {/* See More Flights Button - Will add this in the next section */}
    </div>
  );
}
```

## 3. "See More Flights" Redirect Button

### 3.1 Add Button to `src/components/travel/flight-options.tsx`

Update the `FlightOptions` component to include the redirect button:

```typescript
export function FlightOptions({ flights, searchQuery }: FlightOptionsProps) {
  // Existing code...

  // Function to format date for Cleartrip URL (DD/MM/YYYY)
  const formatDateForUrl = (dateString: string) => {
    const date = new Date(dateString);
    return `${date.getDate().toString().padStart(2, "0")}/${(
      date.getMonth() + 1
    )
      .toString()
      .padStart(2, "0")}/${date.getFullYear()}`;
  };

  // Function to build Cleartrip search URL
  const buildCleartripUrl = () => {
    const params = new URLSearchParams({
      adults: (searchQuery.passengerCount || 1).toString(),
      childs: "0",
      infants: "0",
      class: "Economy",
      depart_date: formatDateForUrl(searchQuery.departDate),
      from: searchQuery.originAirport,
      to: searchQuery.destinationAirport,
      intl: "y",
      origin: `${searchQuery.originAirport} - ${
        searchQuery.originCity || "Origin"
      }, ${searchQuery.originCountry || "AE"}`,
      destination: `${searchQuery.destinationAirport} - ${
        searchQuery.destinationCity || "Destination"
      }, ${searchQuery.destinationCountry || "IN"}`,
      sd: Date.now().toString(),
      rnd_one: "O",
      sourceCountry: searchQuery.originCity || "Origin",
      destinationCountry: searchQuery.destinationCity || "Destination",
      sft: "",
    });

    if (searchQuery.returnDate) {
      params.append("return_date", formatDateForUrl(searchQuery.returnDate));
    }

    return `${process.env.CLEARTRIP_BASE_URL}/flights/international/results?${params.toString()}`;
  };

  const handleSeeMoreFlights = () => {
    window.open(buildCleartripUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>

      {/* Travel Tips Section */}
      <TravelTips
        originAirport={searchQuery.originAirport}
        destinationAirport={searchQuery.destinationAirport}
        departDate={searchQuery.departDate}
        returnDate={searchQuery.returnDate}
      />

      {/* See More Flights Button */}
      <div className="flex justify-center mt-6">
        <Button
          onClick={handleSeeMoreFlights}
          className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-lg font-semibold shadow flex items-center gap-2"
        >
          <span>See All Flight Options</span>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z"
              clipRule="evenodd"
            />
          </svg>
        </Button>
      </div>
    </div>
  );
}
```

### 3.2 Update Props in Higher-Level Components

Ensure the `searchQuery` is passed to the `FlightOptions` component in all places where it's used.

For example, in `src/ai/flows/plan-itinerary.ts`:

```typescript
// After flight processing
return {
  flights: formattedFlights,
  searchQuery: validQuery, // Add this to make it available to components
};

// Then ensure the UI components receive this data
```

## Implementation Steps

1. **Update Types**:

   - Enhance the `FlightOption` interface in `src/types/travel.ts` to include the `category` field

2. **Modify Flight Selection Logic**:

   - Update the flight selection algorithm in `src/ai/flows/plan-itinerary.ts` to select and categorize flights

3. **Create UI Components**:

   - Create the `TravelTips` component
   - Enhance the `FlightCard` component to display category tags
   - Update the `FlightOptions` component to include travel tips and the redirect button

4. **Test the Changes**:
   - Test with various origin/destination combinations
   - Verify that the correct flight categories are displayed
   - Ensure travel tips are contextually relevant
   - Confirm the redirect button works with the correct parameters

## Future Enhancements

- **Personalized Travel Tips**: Integrate with a travel destination API to provide more specific and up-to-date tips
- **Filter Options**: Allow users to filter and sort flights directly within the chat interface
- **Price Alerts**: Offer to set up price alerts for the searched route
- **Alternative Dates**: Show cheaper options on alternative dates close to the requested travel dates
