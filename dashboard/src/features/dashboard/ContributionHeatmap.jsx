import React, { useMemo } from 'react';

/**
 * GitHub-style contribution heatmap — 52 weeks of revision activity.
 * Expects heatmap: Array<{ date: string, count: number }>
 */

const LEVEL_COLORS = [
  'bg-slate-100 dark:bg-slate-800',       // 0
  'bg-emerald-200 dark:bg-emerald-900',    // 1
  'bg-emerald-400 dark:bg-emerald-700',    // 2-3
  'bg-emerald-500 dark:bg-emerald-600',    // 4-5
  'bg-emerald-700 dark:bg-emerald-400',    // 6+
];

function getLevel(count) {
  if (count === 0) return 0;
  if (count === 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const DAYS = ['', 'Mon', '', 'Wed', '', 'Fri', ''];

export default function ContributionHeatmap({ heatmap = [] }) {
  const { weeks, monthLabels, totalRevisions } = useMemo(() => {
    // Build a map of date → count
    const map = {};
    let total = 0;
    heatmap.forEach((h) => {
      map[h.date] = h.count;
      total += h.count;
    });

    // Build 52 weeks (364 days) ending today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 363); // 364 days total

    // Align to the Sunday of that week
    const dayOfWeek = startDate.getDay();
    startDate.setDate(startDate.getDate() - dayOfWeek);

    const weeksArr = [];
    const labels = [];
    let currentDate = new Date(startDate);
    let lastMonth = -1;

    while (currentDate <= today || weeksArr.length < 53) {
      const week = [];
      for (let d = 0; d < 7; d++) {
        const dateStr = currentDate.toISOString().slice(0, 10);
        const count = map[dateStr] || 0;
        const isFuture = currentDate > today;
        week.push({
          date: dateStr,
          count: isFuture ? -1 : count,
          level: isFuture ? -1 : getLevel(count),
        });

        // Track month boundaries
        const month = currentDate.getMonth();
        if (month !== lastMonth && d === 0) {
          labels.push({ weekIdx: weeksArr.length, label: MONTHS[month] });
          lastMonth = month;
        }

        currentDate.setDate(currentDate.getDate() + 1);
      }
      weeksArr.push(week);
      if (weeksArr.length >= 53) break;
    }

    return { weeks: weeksArr, monthLabels: labels, totalRevisions: total };
  }, [heatmap]);

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-white">
          Activity
        </h3>
        <span className="text-xs text-slate-500 dark:text-slate-400">
          {totalRevisions} revisions this year
        </span>
      </div>

      <div className="overflow-x-auto">
        {/* Month labels */}
        <div className="flex mb-1 ml-8">
          {monthLabels.map((m, i) => (
            <span
              key={i}
              className="text-[10px] text-slate-400 dark:text-slate-500"
              style={{ position: 'relative', left: `${m.weekIdx * 14}px` }}
            >
              {m.label}
            </span>
          ))}
        </div>

        <div className="flex gap-px">
          {/* Day labels */}
          <div className="flex flex-col gap-px mr-1 pt-0">
            {DAYS.map((day, i) => (
              <span
                key={i}
                className="text-[10px] text-slate-400 dark:text-slate-500 h-[12px] w-6 flex items-center"
              >
                {day}
              </span>
            ))}
          </div>

          {/* Grid */}
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-px">
              {week.map((day, di) => (
                <div
                  key={di}
                  className={`w-[12px] h-[12px] rounded-[2px] ${
                    day.level === -1
                      ? 'bg-transparent'
                      : LEVEL_COLORS[day.level]
                  }`}
                  title={day.level === -1 ? '' : `${day.date}: ${day.count} revision${day.count !== 1 ? 's' : ''}`}
                />
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1 mt-3 justify-end">
        <span className="text-[10px] text-slate-400 dark:text-slate-500 mr-1">Less</span>
        {LEVEL_COLORS.map((cls, i) => (
          <div key={i} className={`w-[12px] h-[12px] rounded-[2px] ${cls}`} />
        ))}
        <span className="text-[10px] text-slate-400 dark:text-slate-500 ml-1">More</span>
      </div>
    </div>
  );
}
