import React, { useMemo, useState, useRef, useEffect } from 'react';

const DAY_LABELS = [
  { label: 'Mon', row: 1 },
  { label: 'Wed', row: 3 },
  { label: 'Fri', row: 5 },
];

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const CELL_SIZE = 12;
const CELL_GAP = 4;
const GRID_STEP = CELL_SIZE + CELL_GAP;
const LEVEL_CLASSES = [
  'bg-slate-800',
  'bg-emerald-950',
  'bg-emerald-800',
  'bg-emerald-600',
  'bg-emerald-400',
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

  const { calendarGrid, monthLabels, totalActivities } = useMemo(() => {
    const activityMap = heatmap.reduce((acc, item) => {
      acc[item.date] = item.count;
      return acc;
    }, {});

    const today = new Date();
    today.setHours(12, 0, 0, 0);

    const days = [];
    let total = 0;

    for (let i = 364; i >= 0; i -= 1) {
      const day = new Date(today);
      day.setDate(today.getDate() - i);

      const dateKey = formatDateKey(day, timezone);
      const count = activityMap[dateKey] || 0;
      total += count;

      days.push({
        date: dateKey,
        count,
        dateObj: day,
      });
    }

    const paddingCount = days[0]?.dateObj.getDay() || 0;
    const padding = Array.from({ length: paddingCount }, (_, index) => ({
      type: 'pad',
      key: `pad-${index}`,
    }));

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
      ],
      monthLabels: monthPositions,
      totalActivities: total,
    };
  }, [heatmap, timezone]);

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

  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollLeft = scrollRef.current.scrollWidth;
    }
  }, [calendarGrid]);

  return (
    <div className="relative rounded-2xl border border-slate-800 bg-slate-950 p-6 text-slate-100 shadow-sm">
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
            {tooltip.count === 0 ? 'No' : tooltip.count} activities
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
          .heatmap-scroll::-webkit-scrollbar { height: 6px; }
          .heatmap-scroll::-webkit-scrollbar-track { background: transparent; }
          .heatmap-scroll::-webkit-scrollbar-thumb { background-color: #374151; border-radius: 10px; }
          .heatmap-scroll::-webkit-scrollbar-thumb:hover { background-color: #4b5563; }
        `}
      </style>

      <div className="mb-4 flex items-center justify-between gap-4">
        <h3 className="text-lg font-semibold text-white">Activity</h3>
        <span className="text-xs text-slate-400">{totalActivities} activities in the last 365 days</span>
      </div>

      <div ref={scrollRef} className="heatmap-scroll overflow-x-auto pb-2">
        <div className="min-w-max">
          <div className="relative mb-2 ml-8 h-4 text-[10px] text-slate-500">
            {monthLabels.map((month) => (
              <span
                key={month.key}
                className="absolute"
                style={{ left: `${month.column * GRID_STEP}px` }}
              >
                {month.label}
              </span>
            ))}
          </div>

          <div className="flex items-start gap-3">
            <div
              className="relative w-5 text-[10px] text-slate-500"
              style={{ height: `${7 * CELL_SIZE + 6 * CELL_GAP}px` }}
            >
              {DAY_LABELS.map((item) => (
                <span
                  key={item.label}
                  className="absolute left-0"
                  style={{ top: `${item.row * GRID_STEP}px`, transform: 'translateY(-50%)' }}
                >
                  {item.label}
                </span>
              ))}
            </div>

            <div>
              <div
                className="grid"
                style={{
                  gridTemplateRows: `repeat(7, ${CELL_SIZE}px)`,
                  gridAutoFlow: 'column',
                  gridAutoColumns: `${CELL_SIZE}px`,
                  gap: `${CELL_GAP}px`,
                }}
              >
                {calendarGrid.map((entry) => {
                  if (entry.type === 'pad') {
                    return (
                      <div
                        key={entry.key}
                        className="h-3 w-3 rounded-sm bg-transparent"
                      />
                    );
                  }

                  return (
                    <button
                      key={entry.key}
                      type="button"
                      className={`h-3 w-3 rounded-xs border border-white/5 transition-transform duration-100 hover:scale-125 ${LEVEL_CLASSES[entry.level]}`}
                      onMouseEnter={(event) => handleMouseEnter(event, entry)}
                      onMouseLeave={handleMouseLeave}
                      aria-label={`${entry.count} activities on ${tooltipDateFormatter.format(entry.dateObj)}`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="mt-4 flex items-center justify-end gap-2 text-[11px] text-slate-400">
        <span>Less</span>
        <div className="flex gap-1">
          {LEVEL_CLASSES.map((className) => (
            <div
              key={className}
              className={`h-3 w-3 rounded-xs border border-white/5 ${className}`}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
