"use client";

import { FlightOption, TravelQuery } from "@/types/travel";
import { FlightCard } from "./flight-card";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { Progress } from "@/components/ui/progress";
import { X } from "lucide-react";
import { saveFlightData, loadFlightData } from "@/lib/storage";

interface FlightOptionsProps {
  flights: FlightOption[];
  searchQuery: TravelQuery;
  chatId: string;
}

const getCountdownTime = (flightsCount: number) => {
  if (flightsCount == 0) {
    return 1;
  }
  return flightsCount > 2 ? 3 : 15;
};

export function FlightOptions({
  flights: initialFlights,
  searchQuery: initialSearchQuery,
  chatId,
}: FlightOptionsProps) {
  console.log("FlightOptions - Component Render", {
    chatId,
    initialFlightsLength: initialFlights?.length,
    timestamp: new Date().toISOString(),
  });

  const [flights, setFlights] = useState<FlightOption[]>(initialFlights);
  const [searchQuery, setSearchQuery] =
    useState<TravelQuery>(initialSearchQuery);
  const [countdown, setCountdown] = useState(getCountdownTime(flights.length));
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [isCancelled, setIsCancelled] = useState(false);
  const [progress, setProgress] = useState(0);

  // Function to format date for Cleartrip URL (DD/MM/YYYY)
  const formatDateForUrl = (dateString: string | null) => {
    if (!dateString || dateString === "") {
      return "";
    }
    return dateString;
  };

  // Function to build Cleartrip search URL
  const buildCleartripUrl = () => {
    const baseUrl = "https://www.cleartrip.om";
    const params = new URLSearchParams({
      adults: (searchQuery.passengerCount || 1).toString(),
      childs: "0",
      infants: "0",
      class: "Economy",
      depart_date: formatDateForUrl(searchQuery.departDate),
      from: searchQuery.originAirport,
      to: searchQuery.destinationAirport,
    });

    if (searchQuery.returnDate) {
      params.append("return_date", formatDateForUrl(searchQuery.returnDate));
    }

    // Add filters if they exist
    if (searchQuery.filters && searchQuery.filters.length > 0) {
      const stops = searchQuery.filters
        .filter((f) => f.type === "STOPS")
        .map((f) => f.value)
        .join(",");
      if (stops) {
        params.append("stops", stops);
      }

      const airlines = searchQuery.filters
        .filter((f) => f.type === "AIRLINE")
        .map((f) => f.value)
        .join(",");
      if (airlines) {
        params.append("airlines", airlines);
      }

      const departureTimes = searchQuery.filters
        .filter((f) => f.type === "DEPARTURE_TIME")
        .map((f) => f.value)
        .join(",");
      if (departureTimes) {
        params.append("OW_DEPARTURE_TIME", departureTimes);
      }
    }

    console.log("FlightOptions - Building URL with params:", params.toString());

    return `${baseUrl}/flights/international/results?${params.toString()}`;
  };

  // Load saved flight data on component mount
  useEffect(() => {
    console.log("FlightOptions - Loading saved data for chatId:", chatId);
    if (chatId) {
      const savedData = loadFlightData(chatId);
      console.log("FlightOptions - Loaded saved data:", savedData);

      if (savedData && savedData.flights.length > 0) {
        console.log("FlightOptions - Using saved flight data");
        setFlights(savedData.flights);
        setSearchQuery(savedData.searchQuery);
      } else if (initialFlights.length > 0) {
        console.log("FlightOptions - No saved data, saving initial flights");
        saveFlightData(chatId, initialFlights, initialSearchQuery);
        setFlights(initialFlights);
        setSearchQuery(initialSearchQuery);
      } else {
        console.log("FlightOptions - No saved data and no initial flights");
      }
    } else {
      console.log("FlightOptions - No chatId available");
    }
  }, [chatId, initialFlights, initialSearchQuery]);

  // Save flight data whenever it changes
  useEffect(() => {
    console.log("FlightOptions - Current state:", {
      flights,
      searchQuery,
      chatId,
    });

    if (chatId && flights.length > 0) {
      console.log("FlightOptions - Saving flight data");
      saveFlightData(chatId, flights, searchQuery);
    }
  }, [chatId, flights, searchQuery]);

  useEffect(() => {
    if (countdown > 0 && !isCancelled && flights.length > 0) {
      const timer = setTimeout(() => {
        setCountdown(countdown - 1);
        // Calculate progress as a percentage of total time (15 seconds)
        const totalTime = getCountdownTime(flights.length);
        setProgress(((totalTime - countdown) / totalTime) * 100);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (
      countdown === 0 &&
      !isRedirecting &&
      !isCancelled &&
      flights.length > 0
    ) {
      setIsRedirecting(true);
      const url = buildCleartripUrl();
      window.open(url, "_blank", "noopener,noreferrer");
    }
  }, [countdown, isRedirecting, isCancelled, flights.length]);

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

  const handleSeeMoreFlights = () => {
    window.open(buildCleartripUrl(), "_blank", "noopener,noreferrer");
  };

  return (
    <div className="space-y-6 w-full max-w-full overflow-x-hidden">
      {/* Search Query & Filters Summary */}
      <div className="bg-[#23272f] border border-teal-500/20 rounded-2xl p-2 mb-3 shadow-xl flex flex-col gap-2">
        {/* Top: Route */}
        <div className="flex items-center justify-center gap-10">
          <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-base shadow">
            {searchQuery.originAirport || "-"}
          </span>
          <span className="flex items-center">
            <span className="w-2 h-2 bg-teal-400 rounded-full"></span>
            <span className="mx-1 w-12 border-t-2 border-dashed border-teal-400"></span>
            <span className="w-2 h-2 bg-cyan-400 rounded-full"></span>
          </span>
          <span className="px-3 py-1.5 rounded-full bg-gradient-to-r from-teal-500 to-cyan-500 text-white font-bold text-base shadow">
            {searchQuery.destinationAirport || "-"}
          </span>
        </div>
        {/* Middle: Dates */}
        <div className="flex flex-wrap justify-center gap-2 items-center">
          <span className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-cyan-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
            </svg>
            <span className="text-xs text-gray-400">Depart</span>
            <span className="text-white font-semibold text-sm">
              {searchQuery.departDate || "-"}
            </span>
          </span>
          {searchQuery.returnDate && (
            <span className="flex items-center gap-1.5">
              <svg
                className="h-4 w-4 text-cyan-400"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                viewBox="0 0 24 24"
              >
                <path d="M8 7V3m8 4V3M3 11h18M5 19h14a2 2 0 002-2v-7a2 2 0 00-2-2H5a2 2 0 00-2 2v7a2 2 0 002 2z" />
              </svg>
              <span className="text-xs text-gray-400">Return</span>
              <span className="text-white font-semibold text-sm">
                {searchQuery.returnDate}
              </span>
            </span>
          )}
        </div>
        {/* Bottom: Passengers & Filters */}
        <div className="flex flex-wrap justify-between items-center gap-2">
          <span className="flex items-center gap-1.5">
            <svg
              className="h-4 w-4 text-cyan-400"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="M17 20h5v-2a3 3 0 00-5.356-1.857M9 20H4v-2a3 3 0 015.356-1.857M15 11a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span className="text-xs text-gray-400">Passengers</span>
            <span className="text-white font-semibold text-sm">
              {searchQuery.passengerCount || 1}
            </span>
          </span>
          {searchQuery.filters && searchQuery.filters.length > 0 && (
            <div className="flex flex-wrap gap-1 items-center">
              <span className="flex items-center gap-1 text-teal-400 font-semibold">
                <span className="bg-teal-500/20 rounded-full p-0.5">
                  <svg
                    className="h-3 w-3"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                  >
                    <path d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2a1 1 0 01-.293.707L15 13.414V19a1 1 0 01-1.447.894l-4-2A1 1 0 019 17v-3.586L3.293 6.707A1 1 0 013 6V4z" />
                  </svg>
                </span>
                <span className="text-xs">Filters:</span>
              </span>
              {searchQuery.filters.map((filter, idx) => (
                <span
                  key={idx}
                  className="bg-gradient-to-r from-teal-500 to-cyan-500/80 text-[10px] px-2 py-0.5 rounded-full font-semibold text-white shadow-md backdrop-blur-sm"
                >
                  {(() => {
                    switch (filter.type) {
                      case "STOPS":
                        return `${
                          filter.value === "0"
                            ? "Direct"
                            : filter.value +
                              " Stop" +
                              (filter.value !== "1" ? "s" : "")
                        }`;
                      case "AIRLINE":
                        return `Airline: ${filter.value}`;
                      case "DEPARTURE_TIME":
                        switch (filter.value) {
                          case "EARLY_MORNING":
                            return "Early Morning";
                          case "MORNING":
                            return "Morning";
                          case "AFTERNOON":
                            return "Afternoon";
                          case "EVENING":
                            return "Evening";
                          case "NIGHT":
                            return "Night";
                          default:
                            return filter.value;
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
      </div>

      {flights.length > 2 ? (
        <div className="text-center text-muted-foreground py-8">
          Redirecting to Search Page
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {flights.map((flight) => (
            <FlightCard key={flight.id} flight={flight} />
          ))}
        </div>
      )}

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
                ? "See All Flight Options"
                : `See All Flight Options ${
                    countdown > 0 ? `(${countdown}s)` : ""
                  }`}
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
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  handleCancel();
                }}
                className="relative z-10 ml-4 flex items-center px-2 py-1 rounded-full bg-white/80 hover:bg-white text-orange-600 hover:text-orange-700 shadow transition-all duration-200 text-sm font-bold cursor-pointer"
                title="Cancel auto-redirect"
                style={{ minWidth: "2rem", minHeight: "2rem" }}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCancel();
                  }
                }}
              >
                <X className="h-4 w-4" />
              </div>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
