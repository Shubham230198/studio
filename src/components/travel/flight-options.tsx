'use client';

import { FlightOption } from "@/types/travel";
import { FlightCard } from "./flight-card";

interface FlightOptionsProps {
  flights: FlightOption[];
}

export function FlightOptions({ flights }: FlightOptionsProps) {
  if (flights.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No flights found for your search criteria.
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {flights.map((flight) => (
        <FlightCard key={flight.id} flight={flight} />
      ))}
    </div>
  );
} 