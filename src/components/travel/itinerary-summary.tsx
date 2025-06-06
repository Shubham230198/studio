'use client';

import { ItineraryPlan, TravelQuery } from "@/types/travel";
import { FlightOptions } from "./flight-options";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Markdown } from "@/components/ui/markdown";

interface ItinerarySummaryProps {
  plan: ItineraryPlan;
  chatId: string;
}

export function ItinerarySummary({ plan, chatId }: ItinerarySummaryProps) {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Trip Summary</h3>
        </CardHeader>
        <CardContent>
          <Markdown>{plan.summary}</Markdown>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Day by Day</h3>
        </CardHeader>
        <CardContent>
          <ul className="list-disc pl-4 space-y-2">
            {plan.dayByDay.map((day, index) => (
              <li key={index}>
                <Markdown>{day}</Markdown>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h3 className="text-lg font-semibold">Flight Options</h3>
        </CardHeader>
        <CardContent>
          <FlightOptions flights={plan.flights} searchQuery={{
            originAirport: '',
            destinationAirport: '',
            departDate: '',
            passengerCount: 1
          }} chatId={chatId} />
        </CardContent>
      </Card>
    </div>
  );
} 