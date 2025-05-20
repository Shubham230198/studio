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

  const formatDate = (timestamp: string) => {
    return new Date(timestamp).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric'
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
      className="rounded-xl border bg-white py-3 px-4 shadow-sm flex flex-col gap-1.5 cursor-pointer hover:shadow-md transition-shadow relative w-full"
      onClick={handleCardClick}
    >
      {/* Category Tags - now inside the card, top-left, horizontal */}
      {flight.categories && flight.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 -mt-0.5">
          {flight.categories.map((category, index) => (
            <div
              key={index}
              className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded-full border border-white shadow text-[10px] font-bold tracking-wide uppercase text-white ${getCategoryColor(category)}`}
              style={{ minWidth: '48px' }}
            >
              {category === 'cheapest' && (
                <svg className="w-2 h-2 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M12 8v4l3 3" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {category === 'fastest' && (
                <svg className="w-2 h-2 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M13 16h-1v-4h-1m4 0h-1v-4h-1" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {category === 'non-stop' && (
                <svg className="w-2 h-2 mr-0.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M8 12h8" strokeLinecap="round" strokeLinejoin="round"/></svg>
              )}
              {getCategoryLabel(category)}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Airline logo and name */}
        <div className="flex items-center gap-2 min-w-[130px] w-full sm:w-auto">
          <div className="flex flex-col gap-0.5">
            {Array.from(new Set(flight.flightNumbers.map(flightNumber => flightNumber.split('-')[0]))).map((airlineCode) => (
              <div 
                key={airlineCode} 
                className="w-7 h-7 bg-gray-50 rounded-lg flex items-center justify-center text-sm font-semibold text-gray-700 border border-gray-200 shadow-sm"
              >
                {airlineCode}
              </div>
            ))}
          </div>
          <div className="flex flex-col">
            <span className="text-sm text-gray-500 font-semibold tracking-wide leading-tight">
              {flight.originAirport} - {flight.destinationAirport}
            </span>
            <span className="text-[10px] text-gray-400 leading-tight">
              {flight.flightNumbers.join(' → ')}
            </span>
          </div>
        </div>

        {/* Times and date */}
        <div className="flex flex-col items-center flex-1 w-full sm:w-auto">
          <div className="flex items-end gap-1.5">
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">{formatTime(flight.departTime)}</span>
              <span className="text-[10px] text-gray-500">{formatDate(flight.departTime)}</span>
            </div>
            <span className="text-base font-light text-gray-400">-</span>
            <div className="flex items-baseline gap-1">
              <span className="text-lg font-bold text-gray-900">{formatTime(flight.arriveTime)}</span>
              <span className="text-[10px] text-gray-500">{formatDate(flight.arriveTime)}</span>
            </div>
          </div>
          <div className="text-[10px] text-gray-600 leading-tight">
            {formatDuration(flight.durationMinutes)}
            {flight.stops > 0 ? (
              <span className="ml-1">({flight.stops} stop{flight.stops > 1 ? 's' : ''})</span>
            ) : (
              <span className="ml-1">(Direct)</span>
            )}
          </div>
        </div>

        {/* Price and Book button */}
        <div className="flex flex-col items-end min-w-[130px] w-full sm:w-auto gap-1">
          <span className="text-lg font-bold text-gray-900">OMR {flight.price}</span>
          <Button 
            className="bg-orange-500 hover:bg-orange-600 text-white px-5 py-1 rounded-lg text-sm font-semibold shadow h-7 w-full sm:w-auto"
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
        <div className="mt-1 text-green-800 text-[10px] font-semibold bg-green-100 rounded border border-green-400 text-center px-2 py-0.5 w-fit mx-auto">
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