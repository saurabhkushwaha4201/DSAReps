import React from 'react';
import { Swords, Clock } from 'lucide-react';

export default function InterviewMode() {
  return (
    <div className="border rounded-2xl p-6 bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Swords className="w-5 h-5 text-slate-400" />
          <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
            Interview Mode
          </h3>
        </div>
        <span className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 border border-amber-200 dark:border-amber-700">
          <Clock className="w-3 h-3" />
          Coming Soon
        </span>
      </div>
      <p className="text-sm text-slate-500 dark:text-slate-400 mb-3">
        A 45-day countdown mode that tightens your triage — surfacing weak problems, boosting daily cap, and prioritizing Hard problems near your interview date.
      </p>
      <p className="text-xs text-slate-400 dark:text-slate-500">
        Available in the next version.
      </p>
    </div>
  );
}
