'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import type { FlightOption } from '@/types/travel';
import { getAirlineIcon, getAirlineName } from '@/lib/airline-utils';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';

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
  const handleCardClick = () => {
    window.open(flight.bookingUrl, '_blank', 'noopener,noreferrer');
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'cheapest':
        return 'bg-green-500';
      case 'fastest':
        return 'bg-blue-500';
      case 'non-stop':
        return 'bg-yellow-500';
      default:
        return 'bg-gray-500';
    }
  };

  const getCategoryLabel = (category: string) => {
    switch (category) {
      case 'cheapest':
        return 'CHEAPEST';
      case 'fastest':
        return 'FASTEST';
      case 'non-stop':
        return 'NON-STOP';
      default:
        return category.toUpperCase();
    }
  };

  return (
    <div 
      className="rounded-xl border bg-white py-5 px-3 shadow-sm flex flex-col gap-3 cursor-pointer hover:shadow-md transition-shadow relative"
      onClick={handleCardClick}
    >
      {/* Category Tags - now inside the card, top-left, horizontal */}
      {flight.categories && flight.categories.length > 0 && (
        <div className="flex flex-row gap-1">
          {flight.categories.map((category, index) => (
            <div
              key={index}
              className={`flex items-center gap-1 px-2 py-0 rounded-full border border-white shadow text-[11px] font-bold tracking-wide uppercase text-white ${getCategoryColor(category)}`}
              style={{ minWidth: '56px' }}
            >
              {category === 'cheapest' && (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {category === 'fastest' && (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m4 0h-1v-4h-1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {category === 'non-stop' && (
                <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {getCategoryLabel(category)}
            </div>
          ))}
        </div>
      )}

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
                <div key={flightNumber} className="w-9 h-9 bg-muted rounded-lg flex items-center justify-center text-sm border">
                  {airlineCode}
                </div>
              );
            })}
          </div>
          <div className="flex flex-col">
            <span className="text-base text-gray-500 font-semibold tracking-wide">
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
            <span className="text-base text-red-500 font-semibold ml-2">{formatDistanceToNow(new Date(flight.departTime))}</span>
          </div>
          <div className="text-sm text-gray-600 mt-1">
            {formatDuration(flight.durationMinutes)}
            {flight.stops > 0 ? (
              <span className="ml-2">({flight.stops} stop{flight.stops > 1 ? 's' : ''})</span>
            ) : (
              <span className="ml-2">(Direct)</span>
            )}
          </div>
        </div>

        {/* Price and Book button */}
        <div className="flex flex-col items-end min-w-[140px] gap-2">
          <span className="text-2xl font-bold text-gray-900">AED {flight.price}</span>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white px-8 py-2 rounded-lg text-lg font-semibold shadow"
            onClick={(e) => {
              e.stopPropagation(); // Prevent card click event
              if (flight.bookingUrl) {
                window.open(flight.bookingUrl, '_blank', 'noopener,noreferrer');
              }
            }}
          >
            Book
          </Button>
        </div>
      </div>
      {/* Coupon discount message below the card, if available */}
      {flight.couponData && flight.couponData.message && (
        <div className="mt-2 text-green-800 text-sm font-semibold bg-green-100 rounded border border-green-400 text-center px-3 py-1 w-fit mx-auto">
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