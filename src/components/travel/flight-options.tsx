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

  // Function to format date for Cleartrip URL (DD/MM/YYYY)
  const formatDateForUrl = (dateString: string | null) => {
    if (!dateString || dateString === '') {
      return '';
    }
    return dateString;
  };

  // Function to build Cleartrip search URL
  const buildCleartripUrl = () => {
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

    return `https://www.cleartrip.om/flights/international/results?${params.toString()}`;
  };

  const handleSeeMoreFlights = () => {
    window.open(buildCleartripUrl(), '_blank', 'noopener,noreferrer');
  };

  console.log('searchQuery ---> ', searchQuery)

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Search Query & Filters Summary */}
      <div className="bg-gray-900 text-white rounded-xl p-4 mb-2 shadow flex flex-col gap-2">
        <div className="flex flex-wrap gap-4 items-center text-base font-medium">
          <span>
            <span className="text-gray-300">From:</span> {searchQuery.originAirport || '-'}
          </span>
          <span>
            <span className="text-gray-300">To:</span> {searchQuery.destinationAirport || '-'}
          </span>
          <span>
            <span className="text-gray-300">Depart Date:</span> {searchQuery.departDate || '-'}
          </span>
          {searchQuery.returnDate && (
            <span>
              <span className="text-gray-300">Return Date:</span> {searchQuery.returnDate}
            </span>
          )}
          <span>
            <span className="text-gray-300">Passengers:</span> {searchQuery.passengerCount || 1}
          </span>
        </div>
        {searchQuery.filters && searchQuery.filters.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center mt-1">
            <span className="text-gray-300">Filters:</span>
            {searchQuery.filters.map((filter, idx) => (
              <span key={idx} className="bg-teal-600 text-xs px-2 py-1 rounded-full font-semibold">
                {(() => {
                  switch (filter.type) {
                    case 'STOPS':
                      return `${filter.value === '0' ? 'Direct' : filter.value + ' Stop' + (filter.value !== '1' ? 's' : '')}`;
                    case 'AIRLINE':
                      return `Airline: ${filter.value}`;
                    case 'DEPARTURE_TIME':
                      switch (filter.value) {
                        case 'EARLY_MORNING': return 'Early Morning';
                        case 'MORNING': return 'Morning';
                        case 'AFTERNOON': return 'Afternoon';
                        case 'EVENING': return 'Evening';
                        case 'NIGHT': return 'Night';
                        default: return filter.value;
                      }
                    default:
                      return `${filter.type}: ${filter.value}`;
                  }
                })()}
              </span>
            ))}
          </div>
        )}
      </div>
      {/* End Search Query & Filters Summary */}
      <div className="space-y-4 w-full">
        {flights.map((flight) => (
          <FlightCard key={flight.id} flight={flight} />
        ))}
      </div>

      {/* See More Flights Button with Progress */}
      <div className="space-y-2 w-full">
        <div className="flex justify-center w-full">
          <Button
            onClick={handleSeeMoreFlights}
            className="relative bg-orange-500 hover:bg-orange-600 text-white px-4 sm:px-6 py-2 rounded-lg text-base sm:text-lg font-semibold shadow flex items-center justify-between w-full sm:w-auto overflow-hidden"
          >
            {/* Fading Progress Overlay */}
            {!isCancelled && countdown > 0 && (
              <span
                className="absolute left-0 top-0 h-full bg-white/50 transition-all duration-1000 ease-linear rounded-lg pointer-events-none"
                style={{ width: `${progress}%`, zIndex: 1 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-2">
              {isCancelled 
                ? 'See All Flight Options' 
                : `See All Flight Options ${countdown > 0 ? `(${countdown}s)` : ''}`
              }
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
            </span>
            {/* Pill-shaped Close Icon */}
            {!isCancelled && countdown > 0 && (
              <button
                onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="relative z-10 ml-4 flex items-center px-2 py-1 rounded-full bg-white/80 hover:bg-white text-orange-600 hover:text-orange-700 shadow transition-all duration-200 text-sm font-bold"
                title="Cancel auto-redirect"
                style={{ minWidth: '2rem', minHeight: '2rem' }}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
} 