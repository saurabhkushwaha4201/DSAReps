import React, { useState, useEffect } from 'react';
import { Swords, Shield } from 'lucide-react';

/**
 * Interview Mode Toggle — 45-day countdown that persists in localStorage.
 * When active, it can influence triage priority (frontend hint only).
 */

const STORAGE_KEY = 'dsa-interview-mode';

function getStoredState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

export default function InterviewMode() {
  const [active, setActive] = useState(false);
  const [daysLeft, setDaysLeft] = useState(0);
  const [startDate, setStartDate] = useState(null);

  useEffect(() => {
    const stored = getStoredState();
    if (stored?.active && stored.startDate) {
      const start = new Date(stored.startDate);
      const now = new Date();
      const elapsed = Math.floor((now - start) / (1000 * 60 * 60 * 24));
      const remaining = Math.max(0, 45 - elapsed);

      if (remaining > 0) {
        setActive(true);
        setStartDate(start);
        setDaysLeft(remaining);
      } else {
        // Expired
        localStorage.removeItem(STORAGE_KEY);
      }
    }
  }, []);

  const handleToggle = () => {
    if (active) {
      // Deactivate
      setActive(false);
      setDaysLeft(0);
      setStartDate(null);
      localStorage.removeItem(STORAGE_KEY);
    } else {
      // Activate
      const now = new Date();
      setActive(true);
      setStartDate(now);
      setDaysLeft(45);
      saveState({ active: true, startDate: now.toISOString() });
    }
  };

  const progress = active ? ((45 - daysLeft) / 45) * 100 : 0;

  return (
    <div className={`border rounded-2xl p-6 transition-colors ${
      active
        ? 'bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 border-red-200 dark:border-red-800'
        : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800'
    }`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {active ? (
            <Swords className="w-5 h-5 text-red-500" />
          ) : (
            <Shield className="w-5 h-5 text-slate-400" />
          )}
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Interview Mode
          </h3>
        </div>
        <button
          onClick={handleToggle}
          className={`px-4 py-1.5 text-xs font-semibold rounded-full transition-colors ${
            active
              ? 'bg-red-600 text-white hover:bg-red-700'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {active ? 'Deactivate' : 'Activate'}
        </button>
      </div>

      {active ? (
        <>
          <p className="text-sm text-slate-600 dark:text-slate-400 mb-3">
            <span className="font-bold text-red-600 dark:text-red-400">{daysLeft} days</span> until interview. Stay focused.
          </p>
          <div className="w-full bg-slate-200 dark:bg-slate-700 rounded-full h-2">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-red-500 to-orange-500 transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[10px] text-slate-400 dark:text-slate-500 mt-1.5 text-right">
            Day {45 - daysLeft} of 45
          </p>
        </>
      ) : (
        <p className="text-sm text-slate-500 dark:text-slate-400">
          Activate to start a 45-day countdown. Prioritizes weak problems in your daily triage.
        </p>
      )}
    </div>
  );
}
