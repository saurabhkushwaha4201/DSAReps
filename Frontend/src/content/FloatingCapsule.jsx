import React, { useState, useEffect, useRef, useCallback } from 'react';

/**
 * Floating Capsule — Sequential single-task view
 *
 * Collapsed: "Tasks: N left"
 * Expanded: Shows ONE task at a time with progress dots + rating buttons
 * Draggable via pointer events, constrained to viewport (avoids submit button).
 */

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .capsule-wrapper {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    user-select: none;
  }

  /* ── Collapsed Pill ──────────────────────────────────────── */
  .capsule-pill {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 999px;
    color: #cdd6f4;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    transition: background 0.15s, box-shadow 0.15s;
    white-space: nowrap;
  }

  .capsule-pill:hover {
    background: #313244;
    box-shadow: 0 6px 24px rgba(0, 0, 0, 0.5);
  }

  .capsule-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #a6e3a1;
    flex-shrink: 0;
  }

  .capsule-dot.has-tasks { background: #fab387; }
  .capsule-dot.urgent { background: #f38ba8; animation: pulse 1.5s ease-in-out infinite; }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.4; }
  }

  /* ── Expanded Panel ──────────────────────────────────────── */
  .capsule-panel {
    width: 320px;
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 16px;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
    overflow: hidden;
    animation: panelSlideUp 0.2s ease-out;
  }

  @keyframes panelSlideUp {
    from { opacity: 0; transform: translateY(8px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .panel-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 14px 16px 10px;
    border-bottom: 1px solid #313244;
  }

  .panel-title {
    font-size: 13px;
    font-weight: 700;
    color: #89b4fa;
    background: rgba(137,180,250,0.12);
    border: 1px solid rgba(137,180,250,0.25);
    border-radius: 999px;
    padding: 2px 10px;
    letter-spacing: 0.2px;
  }

  .panel-close {
    background: none;
    border: none;
    color: #6c7086;
    cursor: pointer;
    font-size: 18px;
    padding: 4px;
    line-height: 1;
    transition: color 0.15s;
  }

  .panel-close:hover { color: #cdd6f4; }

  .panel-body {
    padding: 14px 16px 16px;
  }

  /* ── Single Task Card ────────────────────────────────────── */
  .task-card {
    padding: 16px;
    background: #181825;
    border: 1px solid #313244;
    border-radius: 12px;
    margin-bottom: 12px;
  }

  .task-title {
    font-size: 14px;
    font-weight: 600;
    color: #cdd6f4;
    margin-bottom: 8px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .task-meta {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 11px;
    color: #6c7086;
    margin-bottom: 12px;
  }

  .task-badge {
    padding: 2px 8px;
    border-radius: 999px;
    font-size: 10px;
    font-weight: 600;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .badge-hard { background: rgba(243,139,168,0.15); color: #f38ba8; }
  .badge-medium { background: rgba(250,179,135,0.15); color: #fab387; }
  .badge-easy { background: rgba(166,227,161,0.15); color: #a6e3a1; }

  .task-type {
    font-size: 10px;
    color: #585b70;
  }

  .rating-row {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 6px;
  }

  .rate-btn {
    padding: 8px 4px;
    border: 1px solid #45475a;
    border-radius: 8px;
    background: #313244;
    color: #cdd6f4;
    font-size: 12px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: all 0.15s;
  }

  .rate-btn:hover { transform: translateY(-1px); }

  .rate-btn.forgot { border-color: #f38ba8; color: #f38ba8; }
  .rate-btn.forgot:hover { background: rgba(243,139,168,0.15); }

  .rate-btn.slow { border-color: #fab387; color: #fab387; }
  .rate-btn.slow:hover { background: rgba(250,179,135,0.15); }

  .rate-btn.clean { border-color: #a6e3a1; color: #a6e3a1; }
  .rate-btn.clean:hover { background: rgba(166,227,161,0.15); }

  .rate-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
    transform: none;
  }

  /* ── Task Title Link ─────────────────────────────────────── */
  .task-title-link {
    display: flex;
    align-items: center;
    gap: 4px;
    color: #cdd6f4;
    text-decoration: none;
    font-size: 14px;
    font-weight: 600;
    margin-bottom: 8px;
    transition: color 0.15s;
  }
  .task-title-link:hover {
    color: #89b4fa;
    text-decoration: underline;
    text-underline-offset: 3px;
  }
  .task-title-link .task-title-text {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .task-title-link .ext-icon {
    font-size: 11px;
    flex-shrink: 0;
    opacity: 0.55;
  }
  .task-title-link:hover .ext-icon { opacity: 1; }

  /* ── Header Nav Arrows ───────────────────────────────────── */
  .panel-title-group {
    display: flex;
    align-items: center;
    gap: 2px;
  }

  .panel-nav-btn {
    background: none;
    border: none;
    color: #6c7086;
    cursor: pointer;
    font-size: 15px;
    padding: 2px 5px;
    line-height: 1;
    border-radius: 4px;
    font-family: inherit;
    transition: color 0.15s, background 0.15s;
  }
  .panel-nav-btn:hover:not(:disabled) {
    color: #cdd6f4;
    background: #313244;
  }
  .panel-nav-btn:disabled { opacity: 0.2; cursor: not-allowed; }

  /* ── Progress Dots ───────────────────────────────────────── */
  .progress-dots {
    display: flex;
    justify-content: center;
    gap: 6px;
    margin-top: 12px;
  }

  .prog-dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: #45475a;
    transition: background 0.2s, transform 0.15s;
    cursor: pointer;
  }
  .prog-dot:not(.done):not(.active):hover { transform: scale(1.4); }
  .prog-dot.done  { background: #a6e3a1; cursor: default; }
  .prog-dot.active { background: #89b4fa; cursor: default; }

  /* ── Empty State ─────────────────────────────────────────── */
  .empty-state {
    text-align: center;
    padding: 24px 12px;
    color: #6c7086;
  }

  .empty-state .emoji { font-size: 32px; margin-bottom: 8px; }
  .empty-state .msg { font-size: 14px; font-weight: 500; }
  .empty-state .sub { font-size: 12px; margin-top: 4px; }

  .revise-more-btn {
    margin-top: 12px;
    padding: 6px 16px;
    font-size: 13px;
    font-weight: 500;
    color: #818cf8;
    background: rgba(129,140,248,0.1);
    border: 1px solid rgba(129,140,248,0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: background 0.15s;
  }
  .revise-more-btn:hover { background: rgba(129,140,248,0.2); }

  .loading { text-align: center; padding: 24px; color: #6c7086; font-size: 13px; }
`;

const REVIEW_TYPE_LABEL = {
  MICRO_RECALL: 'Micro Recall',
  PATTERN_REBUILD: 'Pattern Rebuild',
  FULL_RECODE: 'Full Recode',
};

// Maximum drag bounds to avoid overlapping the LeetCode submit button area
const MIN_BOTTOM = 80;
const MIN_RIGHT = 16;

export default function FloatingCapsule({ pageType = 'problem' }) {
  const [expanded, setExpanded] = useState(false);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [ratingInProgress, setRatingInProgress] = useState(null);
  const [completedIds, setCompletedIds] = useState(new Set());

  // ── Drag state ────────────────────────────────────────────
  const wrapperRef = useRef(null);
  const dragState = useRef({ dragging: false, startX: 0, startY: 0, offsetX: 0, offsetY: 0 });
  const [position, setPosition] = useState({ right: MIN_RIGHT, bottom: MIN_BOTTOM });
  const posRef = useRef(position);
  posRef.current = position;

  // ── Fetch tasks ───────────────────────────────────────────
  const fetchTasks = useCallback(() => {
    setLoading(true);
    chrome.runtime.sendMessage({ type: 'GET_DAILY_TASKS' }, (response) => {
      setLoading(false);
      if (response?.problems) {
        setTasks(response.problems);
        setCurrentIdx(0);
        setCompletedIds(new Set());
      }
    });
  }, []);

  useEffect(() => {
    fetchTasks();

    // Multi-tab sync: react to storage changes from any tab's rating
    const storageListener = (changes) => {
      if (changes.tasksState?.newValue) {
        const { problems } = changes.tasksState.newValue;
        if (problems) {
          setTasks(problems);
          setCurrentIdx(0);
          setCompletedIds(new Set());
        }
      }
    };
    chrome.storage.onChanged.addListener(storageListener);
    return () => chrome.storage.onChanged.removeListener(storageListener);
  }, [fetchTasks]);

  // ── Rate a problem ────────────────────────────────────────
  const handleRate = async (problemId, rating) => {
    setRatingInProgress(problemId);
    try {
      await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          { type: 'RATE_PROBLEM', data: { problemId, rating } },
          (res) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(res);
          }
        );
      });

      // Mark completed and auto-advance
      setCompletedIds((prev) => new Set([...prev, problemId]));
      setTasks((prev) => prev.filter((t) => t._id !== problemId));

      // Auto-advance: if there are more tasks, stay at 0 (since we removed the current)
      // The list shrinks, so currentIdx stays at 0
      setCurrentIdx(0);
    } catch (err) {
      console.error('[Capsule] Rating error:', err);
    } finally {
      setRatingInProgress(null);
    }
  };

  // ── Drag handlers ─────────────────────────────────────────
  const onPointerDown = (e) => {
    if (expanded) return;
    const ds = dragState.current;
    ds.dragging = false;
    ds.startX = e.clientX;
    ds.startY = e.clientY;
    ds.offsetX = posRef.current.right;
    ds.offsetY = posRef.current.bottom;
    e.currentTarget.setPointerCapture(e.pointerId);
  };

  const onPointerMove = (e) => {
    const ds = dragState.current;
    const dx = ds.startX - e.clientX;
    const dy = ds.startY - e.clientY;

    if (!ds.dragging && (Math.abs(dx) > 4 || Math.abs(dy) > 4)) {
      ds.dragging = true;
    }

    if (ds.dragging) {
      const vw = window.innerWidth;
      const vh = window.innerHeight;
      const newRight = Math.max(MIN_RIGHT, Math.min(vw - 200, ds.offsetX + dx));
      const newBottom = Math.max(MIN_BOTTOM, Math.min(vh - 60, ds.offsetY + dy));
      setPosition({ right: newRight, bottom: newBottom });
    }
  };

  const onPointerUp = () => {
    const ds = dragState.current;
    if (!ds.dragging) {
      setExpanded((prev) => !prev);
      if (!expanded) fetchTasks();
    }
    ds.dragging = false;
  };

  const dotClass = tasks.length === 0 ? '' : tasks.length >= 3 ? 'urgent' : 'has-tasks';
  const currentTask = tasks[currentIdx] || null;
  const originalTotal = tasks.length + completedIds.size;

  return (
    <>
      <style>{STYLES}</style>
      <div
        ref={wrapperRef}
        className="capsule-wrapper"
        style={{
          position: 'relative',
          right: `${position.right}px`,
          bottom: `${position.bottom}px`,
        }}
      >
        {!expanded ? (
          <div
            className="capsule-pill"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
          >
            <span className={`capsule-dot ${dotClass}`} />
            Tasks: {tasks.length} left
          </div>
        ) : (
          <div className="capsule-panel">
            <div className="panel-header">
              <div className="panel-title-group">
                <button
                  className="panel-nav-btn"
                  disabled={currentIdx === 0}
                  onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                >‹</button>
                <span className="panel-title">
                  {originalTotal === 0 ? 'No tasks' : `Task ${completedIds.size + currentIdx + 1} of ${originalTotal}`}
                </span>
                <button
                  className="panel-nav-btn"
                  disabled={tasks.length === 0 || currentIdx >= tasks.length - 1}
                  onClick={() => setCurrentIdx(i => Math.min(tasks.length - 1, i + 1))}
                >›</button>
              </div>
              <button className="panel-close" onClick={() => setExpanded(false)}>
                ✕
              </button>
            </div>
            <div className="panel-body">
              {loading && <div className="loading">Loading tasks...</div>}

              {!loading && tasks.length === 0 && (
                <div className="empty-state">
                  <div className="emoji">🎉</div>
                  <div className="msg">All done for today!</div>
                  <div className="sub">No reviews pending</div>
                  <button
                    className="revise-more-btn"
                    onClick={() => {
                      setCompletedIds(new Set());
                      setCurrentIdx(0);
                      setLoading(true);
                      chrome.runtime.sendMessage({ type: 'GET_DAILY_TASKS' }, (res) => {
                        const list = res?.problems || [];
                        setTasks(list);
                        setLoading(false);
                      });
                    }}
                  >
                    🔄 Revise More
                  </button>
                </div>
              )}

              {!loading && currentTask && (
                <>
                  <div className="task-card">
                    {currentTask.url ? (
                      <a
                        className="task-title-link"
                        href={currentTask.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        title={currentTask.title}
                      >
                        <span className="task-title-text">{currentTask.title}</span>
                        <span className="ext-icon">↗</span>
                      </a>
                    ) : (
                      <div className="task-title" title={currentTask.title}>
                        {currentTask.title}
                      </div>
                    )}
                    <div className="task-meta">
                      <span className={`task-badge badge-${currentTask.difficulty}`}>
                        {currentTask.difficulty}
                      </span>
                      <span className="task-type">
                        {REVIEW_TYPE_LABEL[currentTask.nextReviewType] || 'Review'}
                      </span>
                      <span>Stability: {currentTask.stabilityScore}%</span>
                    </div>
                    {pageType === 'problem' && (
                    <div className="rating-row">
                      <button
                        className="rate-btn forgot"
                        disabled={ratingInProgress === currentTask._id}
                        onClick={() => handleRate(currentTask._id, 'FORGOT')}
                      >
                        Forgot
                      </button>
                      <button
                        className="rate-btn slow"
                        disabled={ratingInProgress === currentTask._id}
                        onClick={() => handleRate(currentTask._id, 'SLOW')}
                      >
                        Slow
                      </button>
                      <button
                        className="rate-btn clean"
                        disabled={ratingInProgress === currentTask._id}
                        onClick={() => handleRate(currentTask._id, 'CLEAN')}
                      >
                        Clean
                      </button>
                    </div>
                    )}
                  </div>

                  {/* Progress dots */}
                  {originalTotal > 1 && (
                    <div className="progress-dots">
                      {Array.from({ length: originalTotal }).map((_, i) => {
                        const isDone = i < completedIds.size;
                        const isActive = i === completedIds.size + currentIdx;
                        return (
                          <span
                            key={i}
                            className={`prog-dot ${isDone ? 'done' : ''} ${isActive ? 'active' : ''}`}
                            onClick={() => {
                              if (!isDone && !isActive) {
                                setCurrentIdx(i - completedIds.size);
                              }
                            }}
                          />
                        );
                      })}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </>
  );
}
