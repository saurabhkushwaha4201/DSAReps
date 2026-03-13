import React, { useEffect, useMemo, useRef, useState } from 'react';

const DAY_LABELS = [
  { label: 'Mon', row: 1 },
  { label: 'Wed', row: 3 },
  { label: 'Fri', row: 5 },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CELL_GAP = 4;
const DAYS_TO_SHOW = 182;
const LEVEL_CLASSES = [
  'bg-slate-200 dark:bg-slate-800',
  'bg-emerald-200 dark:bg-emerald-950',
  'bg-emerald-400 dark:bg-emerald-800',
  'bg-emerald-500 dark:bg-emerald-600',
  'bg-emerald-600 dark:bg-emerald-400',
];

function getLevel(count) {
  if (count === 0) return 0;
  if (count <= 1) return 1;
  if (count <= 3) return 2;
  if (count <= 5) return 3;
  return 4;
}

function formatDateKey(date, timezone) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value;
  const month = parts.find((part) => part.type === 'month')?.value;
  const day = parts.find((part) => part.type === 'day')?.value;

  return `${year}-${month}-${day}`;
}

export default function ContributionHeatmap({ heatmap = [] }) {
  const [tooltip, setTooltip] = useState({
    visible: false,
    x: 0,
    y: 0,
    count: 0,
    date: '',
  });

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const tooltipDateFormatter = useMemo(
    () =>
      new Intl.DateTimeFormat('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
        timeZone: timezone,
      }),
    [timezone]
  );

  const { calendarGrid, monthLabels, monthlyReps, longestStreak, weekCount } = useMemo(() => {
    const activityMap = heatmap.reduce((acc, item) => {
      acc[item.date] = item.count;
      return acc;
    }, {});

    const today = new Date();
    today.setHours(12, 0, 0, 0);
    const currentMonth = today.getMonth();
    const currentYear = today.getFullYear();

    const days = [];
    let monthTotal = 0;

    for (let i = DAYS_TO_SHOW - 1; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);

      const dateKey = formatDateKey(day, timezone);
      const count = activityMap[dateKey] || 0;
      if (day.getMonth() === currentMonth && day.getFullYear() === currentYear) {
        monthTotal += count;
      }

      days.push({
        date: dateKey,
        count,
        dateObj: day,
      });
    }

    const paddingCount = days[0]?.dateObj.getDay() || 0;
    let runningStreak = 0;
    let maxStreak = 0;
    for (const day of days) {
      if (day.count > 0) {
        runningStreak += 1;
        maxStreak = Math.max(maxStreak, runningStreak);
      } else {
        runningStreak = 0;
      }
    }

    const padding = Array.from({ length: paddingCount }, (_, index) => ({
      type: 'pad',
      key: `pad-${index}`,
    }));
    const trailingPadCount = (7 - ((paddingCount + days.length) % 7)) % 7;
    const trailingPadding = Array.from({ length: trailingPadCount }, (_, index) => ({
      type: 'pad',
      key: `pad-end-${index}`,
    }));
    const totalColumns = Math.ceil((paddingCount + days.length + trailingPadCount) / 7);

    const monthPositions = [];
    let lastMonth = -1;
    days.forEach((day, index) => {
      const monthIndex = day.dateObj.getMonth();
      if (monthIndex !== lastMonth) {
        monthPositions.push({
          key: `${day.date}-month`,
          label: MONTHS[monthIndex],
          column: Math.floor((paddingCount + index) / 7),
        });
        lastMonth = monthIndex;
      }
    });

    return {
      calendarGrid: [
        ...padding,
        ...days.map((day) => ({
          ...day,
          type: 'day',
          level: getLevel(day.count),
          key: day.date,
        })),
        ...trailingPadding,
      ],
      monthLabels: monthPositions,
      monthlyReps: monthTotal,
      longestStreak: maxStreak,
      weekCount: totalColumns,
    };
  }, [heatmap, timezone]);

  const gridContainerRef = useRef(null);
  const [gridWidth, setGridWidth] = useState(0);

  useEffect(() => {
    if (!gridContainerRef.current) return undefined;

    const updateWidth = () => {
      if (gridContainerRef.current) {
        setGridWidth(gridContainerRef.current.clientWidth);
      }
    };

    updateWidth();

    const observer = new ResizeObserver(() => {
      updateWidth();
    });

    observer.observe(gridContainerRef.current);

    return () => observer.disconnect();
  }, [weekCount]);

  const cellSize = useMemo(() => {
    if (!gridWidth || !weekCount) return 12;
    const size = (gridWidth - (weekCount - 1) * CELL_GAP) / weekCount;
    return Math.min(22, Math.max(10, size));
  }, [gridWidth, weekCount]);

  const gridStep = cellSize + CELL_GAP;
  const gridHeight = 7 * cellSize + 6 * CELL_GAP;

  const handleMouseEnter = (event, day) => {
    const rect = event.currentTarget.getBoundingClientRect();
    setTooltip({
      visible: true,
      x: rect.left + rect.width / 2,
      y: rect.top - 8,
      count: day.count,
      date: tooltipDateFormatter.format(day.dateObj),
    });
  };

  const handleMouseLeave = () => {
    setTooltip((current) => ({ ...current, visible: false }));
  };

  return (
    <div className="relative rounded-2xl border border-slate-200 bg-slate-50 dark:border-slate-800 dark:bg-slate-950 p-6 text-slate-700 dark:text-slate-100 shadow-sm">
      {tooltip.visible && (
        <div
          className="pointer-events-none fixed z-50 whitespace-nowrap rounded-md border border-slate-700 bg-slate-800 px-3 py-1.5 text-xs text-slate-100 shadow-lg"
          style={{
            left: tooltip.x,
            top: tooltip.y,
            transform: 'translate(-50%, -100%)',
            animation: 'heatmap-tooltip-fade 150ms ease-out forwards',
          }}
        >
          <strong className="font-semibold text-emerald-400">
            {tooltip.count === 0 ? 'No' : tooltip.count} reps
          </strong>{' '}
          on {tooltip.date}
          <span
            className="absolute left-1/2 top-full h-0 w-0 -translate-x-1/2"
            style={{
              borderLeft: '5px solid transparent',
              borderRight: '5px solid transparent',
              borderTop: '5px solid #1e293b',
            }}
          />
        </div>
      )}

      <style>
        {`
          @keyframes heatmap-tooltip-fade {
            from { opacity: 0; transform: translate(-50%, -90%); }
            to { opacity: 1; transform: translate(-50%, -100%); }
          }
        `}
      </style>

      <div className="mb-6 flex items-center justify-between gap-4">
        <h3 className="text-lg font-bold text-slate-900 dark:text-white">Activity</h3>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1">
            <span className="text-sm">🎯</span>
            <span className="text-sm font-semibold text-indigo-700 dark:text-indigo-100">
              {monthlyReps}
              <span className="ml-0.5 text-xs font-normal text-indigo-500/80 dark:text-indigo-300/70">
                {' '}reps this month
              </span>
            </span>
          </div>

          <div className="flex items-center gap-1.5 rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
            <span className="text-sm">🏆</span>
            <span className="text-sm font-semibold text-amber-700 dark:text-amber-100">
              {longestStreak}
              <span className="ml-0.5 text-xs font-normal text-amber-600/80 dark:text-amber-300/70">
                {' '}max streak
              </span>
            </span>
          </div>
        </div>
      </div>

      <div className="overflow-hidden pb-2">
        <div className="w-full">
          <div className="flex items-start gap-3">
            <div
              className="relative w-5 text-[10px] text-slate-400 dark:text-slate-500"
              style={{ height: `${gridHeight}px` }}
            >
              {DAY_LABELS.map((item) => (
                <span
                  key={item.label}
                  className="absolute left-0"
                  style={{ top: `${item.row * gridStep}px`, transform: 'translateY(-50%)' }}
                >
                  {item.label}
                </span>
              ))}
            </div>

            <div ref={gridContainerRef} className="min-w-0 flex-1">
              <div className="relative mb-2 h-4 text-[10px] text-slate-400 dark:text-slate-500">
                {monthLabels.map((month) => (
                  <span
                    key={month.key}
                    className="absolute"
                    style={{ left: `${month.column * gridStep}px` }}
                  >
                    {month.label}
                  </span>
                ))}
              </div>

              <div
                className="grid w-full"
                style={{
                  gridTemplateRows: `repeat(7, ${cellSize}px)`,
                  gridAutoFlow: 'column',
                  gridAutoColumns: `${cellSize}px`,
                  gap: `${CELL_GAP}px`,
                }}
              >
                {calendarGrid.map((entry) => {
                  if (entry.type === 'pad') {
                    return (
                      <div
                        key={entry.key}
                        className="rounded-sm bg-transparent"
                        style={{ height: `${cellSize}px`, width: `${cellSize}px` }}
                      />
                    );
                  }

                  return (
                    <button
                      key={entry.key}
                      type="button"
                      className={`rounded-xs border border-white/5 transition-transform duration-100 hover:scale-110 ${LEVEL_CLASSES[entry.level]}`}
                      style={{ height: `${cellSize}px`, width: `${cellSize}px` }}
                      onMouseEnter={(event) => handleMouseEnter(event, entry)}
                      onMouseLeave={handleMouseLeave}
                      onFocus={(event) => handleMouseEnter(event, entry)}
                      onBlur={handleMouseLeave}
                      aria-label={`${entry.count} reps on ${tooltipDateFormatter.format(entry.dateObj)}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-slate-500 dark:text-slate-400">
        <span>Less</span>
        <div className="flex gap-1">
          {LEVEL_CLASSES.map((cls) => (
            <div
              key={cls}
              className={`h-3 w-3 rounded-xs border border-black/5 dark:border-white/5 ${cls}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}

