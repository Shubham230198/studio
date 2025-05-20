'use client';

import { ReactNode } from 'react';

interface MonitoringProviderProps {
  children: ReactNode;
}

export function MonitoringProvider({ children }: MonitoringProviderProps) {
  return <>{children}</>;
} 