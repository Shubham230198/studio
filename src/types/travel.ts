export interface TravelQuery {
  originAirport: string;
  destinationAirport: string;
  departDate: string;
  returnDate?: string | null;
  passengerCount?: number;
  originCity?: string;
  originCountry?: string;
  destinationCity?: string;
  destinationCountry?: string;
  isRoundTrip?: boolean;
  filters?: Array<{
    type: string;
    value: string;
  }>;
}

export interface FlightOption {
  id: string;
  price: number; // total price in default currency
  currency: string;
  flightNumbers: string[];
  departTime: string; // ISO
  arriveTime: string; // ISO
  durationMinutes: number;
  stops: number;
  bookingUrl: string; // deep-link to provider booking page
  fareKey: string; // fare key from API
  fareBasisCode: string; // fare basis code from API
  originAirport: string; // origin airport code
  destinationAirport: string; // destination airport code
  couponData?: any; // <-- make this optional
  itineraryId?: string | null; // ID from flight review API
  itineraryStatus?: string; // Status from flight review API
  reviewUrl?: string; // URL to review the flight
  categories?: Array<"cheapest" | "fastest" | "non-stop">; // Changed to array of categories
}

export interface ItineraryPlan {
  summary: string; // high-level text summary
  dayByDay: string[]; // markdown list – 1 entry per day
  flights: FlightOption[]; // echoed back for UI rendering
}

export interface CouponData {
  discountAmount: number;
  couponCode: string;
  message: string;
  discountedPrice: number;
}
