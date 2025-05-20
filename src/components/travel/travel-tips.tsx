'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Lightbulb } from 'lucide-react';
import { useEffect, useState } from 'react';
import { generateTravelTipsAction } from '../../ai/flows/travel-tips';

interface TravelTipsProps {
  originAirport: string;
  destinationAirport: string;
  departDate: string;
  returnDate?: string;
  userQuery: string;
}

interface TravelTip {
  title: string;
  content: string;
}

export function TravelTips({ 
  originAirport, 
  destinationAirport, 
  departDate, 
  returnDate,
  userQuery
}: TravelTipsProps) {
  const [tips, setTips] = useState<TravelTip[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const generateTips = async () => {
      console.log('Generating tips with:', { userQuery, originAirport, destinationAirport, departDate, returnDate });
      
      if (!userQuery) {
        console.log('No user query, skipping tips generation');
        setTips([]);
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        console.log('Calling server action...');
        const result = await generateTravelTipsAction({
          userQuery,
          originAirport,
          destinationAirport,
          departDate,
          returnDate,
        });
        console.log('Received tips:', result);
        setTips(result?.tips || []);
      } catch (error) {
        console.error('Error generating travel tips:', error);
        setTips([]);
      } finally {
        setIsLoading(false);
      }
    };

    generateTips();
  }, [userQuery, originAirport, destinationAirport, departDate, returnDate]);

  console.log('Current state:', { isLoading, tips });

  if (!userQuery) {
    return null;
  }

  return (
    <div className="my-4">
      <h3 className="text-lg font-semibold mb-2 flex items-center">
        <Lightbulb className="w-5 h-5 text-yellow-500 mr-2" />
        Travel Hacks
      </h3>
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3].map((index) => (
            <Card key={index} className="bg-blue-50 border-blue-100 animate-pulse">
              <CardHeader className="pb-2">
                <div className="h-4 bg-blue-200 rounded w-3/4"></div>
              </CardHeader>
              <CardContent>
                <div className="h-4 bg-blue-200 rounded w-full mb-2"></div>
                <div className="h-4 bg-blue-200 rounded w-5/6"></div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : tips && tips.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {tips.map((tip, index) => (
            <Card key={index} className="bg-blue-50 border-blue-100">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-blue-700">{tip.title}</CardTitle>
              </CardHeader>
              <CardContent className="text-sm text-gray-700">
                {tip.content}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-sm text-gray-500">No travel tips available at the moment.</div>
      )}
    </div>
  );
} 