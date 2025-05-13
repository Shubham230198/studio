import axios from "axios";

interface FlightFare {
  fareKey: string;
  fareType: string;
  price: number;
  fareClass: string;
  comboFBC: string;
}

interface FlightParams {
  cabinType: string;
  departDate: string;
  from: string;
  to: string;
  onwardFares: FlightFare[];
}

interface ItineraryMeta {
  domain: string;
  externalApi: boolean;
  international: boolean;
  sid: string;
  sourceType: string;
  utmCurrency: string;
  convFeeRequired: boolean;
  couponCode: string;
  sft: string;
  dcFlow: boolean;
}

interface PaxInfo {
  adults: number;
  children: number;
  infants: number;
}

interface ReviewFlightRequest {
  flightParams: FlightParams[];
  itineraryMeta: ItineraryMeta;
  paxInfo: PaxInfo;
}

interface ReviewFlightResponse {
  itineraryId: string;
  itineraryStatus: string;
}

export async function reviewFlight(
  request: ReviewFlightRequest
): Promise<ReviewFlightResponse> {
  try {
    const response = await axios.post(
      `${process.env.CLEARTRIP_BASE_URL}/itin/itinerary/create`,
      request,
      {
        headers: {
          accept: "application/json",
          "dc-flow": "ENABLED",
          "Content-Type": "application/json",
          "referer": "https://www.cleartrip.ae/flights/international/results?adults=1&childs=0&infants=0&depart_date=14/05/2025&return_date=&intl=y&from=DXB&to=DEL&airline=&carrier=&sd=1747164224661&page=&sellingCountry=AE&ssfi=&flexi_search=&ssfc=&origin=DXB%20-%20Dubai,%20AE&destination=DEL%20-%20New%20Delhi,%20IN&class=Economy&sft="
        },
      }
    );
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(`Flight review failed: ${error.message}`);
    }
    throw error;
  }
}
