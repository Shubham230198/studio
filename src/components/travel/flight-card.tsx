'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { FlightOption } from '@/types/travel';
import { getAirlineIcon, getAirlineName } from '@/lib/airline-utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';

interface FlightCardProps {
  flight: FlightOption;
}

function formatTime(isoTime: string): string {
  return new Date(isoTime).toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit',
    hour12: true 
  });
}

function minutesToHrs(minutes: number): string {
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hrs}h ${mins}m`;
}

export function FlightCard({ flight }: FlightCardProps) {
  // Format date as '14 May'
  function formatDate(isoTime: string): string {
    const date = new Date(isoTime);
    return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short' });
  }

  const handleCardClick = () => {
    if (flight.reviewUrl) {
      window.open(flight.reviewUrl, '_blank', 'noopener,noreferrer');
    }
  };

  return (
    <div 
      className="rounded-xl border bg-white p-4 shadow-sm flex flex-col gap-2 cursor-pointer hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <div className="flex items-center justify-between gap-4">
        {/* Airline logo and name */}
        <div className="flex items-center gap-3 min-w-[140px]">
          <div className="flex flex-col gap-1">
            {flight.flightNumbers.map((flightNumber, index) => {
              const airlineCode = flightNumber.split('-')[0];
              const icon = getAirlineIcon(airlineCode);
              return icon ? (
                <Image 
                  key={flightNumber}
                  src={icon}
                  alt={airlineCode}
                  width={48}
                  height={48}
                  className="object-contain rounded-lg border bg-white"
                />
              ) : (
                <div key={flightNumber} className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center text-xs border">
                  {airlineCode}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 font-semibold tracking-wide">
              {flight.originAirport} - {flight.destinationAirport}
            </span>
            <span className="text-xs text-gray-400">
              {flight.flightNumbers.join(' → ')}
            </span>
          </div>
        </div>

        {/* Times and date */}
        <div className="flex flex-col items-center flex-1">
          <div className="flex items-end gap-2">
            <span className="text-2xl font-bold text-gray-900">{formatTime(flight.departTime)}</span>
            <span className="text-xl font-light text-gray-400">-</span>
            <span className="text-2xl font-bold text-gray-900">{formatTime(flight.arriveTime)}</span>
            <span className="text-base text-red-500 font-semibold ml-2">{formatDate(flight.departTime)}</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {minutesToHrs(flight.durationMinutes)}
            {flight.stops > 0 ? (
              <span className="ml-2">({flight.stops} stop{flight.stops > 1 ? 's' : ''})</span>
            ) : (
              <span className="ml-2">(Direct)</span>
            )}
          </div>
        </div>

        {/* Price and Book button */}
        <div className="flex flex-col items-end min-w-[180px] gap-2">
          <span className="text-2xl font-bold text-gray-900">AED {flight.price}</span>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-lg text-lg font-semibold shadow"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              if (flight.reviewUrl) {
                window.open(flight.reviewUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            Book
          </Button>
        </div>
      </div>
      {/* Coupon discount message below the card, if available */}
      {flight.couponData && flight.couponData.message && (
        <div className="mt-2 text-green-700 text-sm font-medium bg-green-50 rounded px-3 py-2 border border-green-200 text-center">
          {flight.couponData.message
            .replace('{discountedPrice}', flight.couponData.discountedPrice)
            .replace('{discountAmount}', flight.couponData.discountAmount)
            .replace('{couponCode}', flight.couponData.couponCode)
          }
        </div>
      )}
    </div>
  );
} 