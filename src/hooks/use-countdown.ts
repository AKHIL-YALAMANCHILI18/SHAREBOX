'use client';

import { useState, useEffect } from 'react';

export interface CountdownState {
  formatted: string;
  hours: number;
  minutes: number;
  seconds: number;
  isExpired: boolean;
  totalSecondsRemaining: number;
}

export function useCountdown(expiresAt: string | null | undefined): CountdownState {
  const calculate = (): CountdownState => {
    if (!expiresAt) {
      return {
        formatted: '—',
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: false,
        totalSecondsRemaining: 0,
      };
    }

    const expiryTime = new Date(expiresAt).getTime();
    const now = Date.now();
    const diff = expiryTime - now;

    if (diff <= 0) {
      return {
        formatted: 'Expired',
        hours: 0,
        minutes: 0,
        seconds: 0,
        isExpired: true,
        totalSecondsRemaining: 0,
      };
    }

    const totalSeconds = Math.floor(diff / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    let formatted = '';
    if (hours > 0) {
      formatted = `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      formatted = `${minutes}m ${seconds}s`;
    } else {
      formatted = `${seconds}s`;
    }

    return {
      formatted: `${formatted} remaining`,
      hours,
      minutes,
      seconds,
      isExpired: false,
      totalSecondsRemaining: totalSeconds,
    };
  };

  const [state, setState] = useState<CountdownState>(calculate);

  useEffect(() => {
    setState(calculate());

    const interval = setInterval(() => {
      const next = calculate();
      setState(next);
      if (next.isExpired) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [expiresAt]);

  return state;
}
