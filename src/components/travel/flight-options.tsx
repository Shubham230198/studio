'use client';

import { FlightOption, TravelQuery } from "@/types/travel";
import { FlightCard } from "./flight-card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";

interface FlightOptionsProps {
  flights: FlightOption[];
  searchQuery: TravelQuery;
}

export function FlightOptions({ flights, searchQuery }: FlightOptionsProps) {
  const [countdown, setCountdown] = useState(15);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (countdown > 0 && !isCancelled) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        // Calculate progress as a percentage of total time (15 seconds)
        setProgress(((15 - countdown) / 15) * 100);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !isRedirecting && !isCancelled) {
      setIsRedirecting(true);
      const url = buildCleartripUrl();
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  }, [countdown, isRedirecting, isCancelled]);

  const handleCancel = () => {
    setIsCancelled(true);
  };

  if (flights.length === 0) {
    return (
      <div className="text-center text-muted-foreground py-8">
        No flights found for your search criteria.
      </div>
    );
  }

  console.error('flights', flights);

  // Function to format date for Cleartrip URL (DD/MM/YYYY)
  const formatDateForUrl = (dateString: string | null) => {
    if (!dateString || dateString === '') {
      return '';
    }
    return dateString;
  };

  // Function to build Cleartrip search URL
  const buildCleartripUrl = () => {
    console.error('buildCleartripUrl', JSON.stringify(searchQuery));
    const params = new URLSearchParams({
      adults: (searchQuery.passengerCount || 1).toString(),
      childs: '0',
      infants: '0',
      class: 'Economy',
      depart_date: formatDateForUrl(searchQuery.departDate),
      from: searchQuery.originAirport,
      to: searchQuery.destinationAirport
    });

    if (searchQuery.returnDate) {
      params.append('return_date', formatDateForUrl(searchQuery.returnDate));
    }

    return `https://www.cleartrip.ae/flights/international/results?${params.toString()}`;
  };

  const handleSeeMoreFlights = () => {
    window.open(buildCleartripUrl(), '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6">
      <div className="space-y-4">
        {flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>

      {/* See More Flights Button with Progress */}
      <div className="space-y-2">
        {!isCancelled && countdown > 0 && (
          <div className="relative">
            <Progress value={progress} className="h-2 transition-all duration-1000 ease-linear" />
            <button
              onClick={handleCancel}
              className="absolute -right-2 -top-2 bg-gray-200 hover:bg-gray-300 rounded-full p-1"
              title="Cancel auto-redirect"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        )}
        <div className="flex justify-center">
          <Button
            onClick={handleSeeMoreFlights}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg text-lg font-semibold shadow flex items-center gap-2"
          >
            <span>
              {isCancelled 
                ? 'See All Flight Options' 
                : `See All Flight Options ${countdown > 0 ? `(${countdown}s)` : ''}`
              }
            </span>
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
    </div>
  );
} 