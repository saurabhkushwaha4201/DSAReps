import React, { useState, useEffect } from 'react';

/**
 * Capture Modal — rendered inside Shadow DOM
 *
 * Asks the user for difficulty (which sets the initial review interval)
 * and an optional "core trick" note. Clicking a difficulty button
 * instantly saves to backend and closes.
 */

const STYLES = `
  * { box-sizing: border-box; margin: 0; padding: 0; }

  .overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
    z-index: 2147483647;
    animation: fadeIn 0.15s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  @keyframes slideUp {
    from { opacity: 0; transform: translateY(12px) scale(0.97); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }

  .modal {
    background: #1e1e2e;
    border: 1px solid #313244;
    border-radius: 16px;
    padding: 28px 32px;
    width: 380px;
    max-width: 90vw;
    box-shadow: 0 25px 50px rgba(0,0,0,0.4);
    animation: slideUp 0.2s ease-out;
    color: #cdd6f4;
  }

  .modal-title {
    font-size: 18px;
    font-weight: 600;
    color: #cdd6f4;
    margin-bottom: 4px;
  }

  .modal-subtitle {
    font-size: 13px;
    color: #6c7086;
    margin-bottom: 20px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .label {
    font-size: 13px;
    font-weight: 500;
    color: #a6adc8;
    margin-bottom: 8px;
    display: block;
  }

  .difficulty-grid {
    display: grid;
    grid-template-columns: 1fr 1fr 1fr;
    gap: 10px;
    margin-bottom: 20px;
  }

  .diff-btn {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
    padding: 14px 8px;
    border: 2px solid transparent;
    border-radius: 12px;
    cursor: pointer;
    font-family: inherit;
    font-weight: 600;
    font-size: 14px;
    transition: all 0.15s ease;
    color: #cdd6f4;
    background: #313244;
  }

  .diff-btn:hover { transform: translateY(-2px); box-shadow: 0 4px 12px rgba(0,0,0,0.3); }

  .diff-btn.hard { border-color: #f38ba8; color: #f38ba8; }
  .diff-btn.hard:hover { background: rgba(243, 139, 168, 0.15); }
  .diff-btn.hard.selected { background: rgba(243, 139, 168, 0.25); box-shadow: 0 0 0 2px #f38ba8; }

  .diff-btn.medium { border-color: #fab387; color: #fab387; }
  .diff-btn.medium:hover { background: rgba(250, 179, 135, 0.15); }
  .diff-btn.medium.selected { background: rgba(250, 179, 135, 0.25); box-shadow: 0 0 0 2px #fab387; }

  .diff-btn.easy { border-color: #a6e3a1; color: #a6e3a1; }
  .diff-btn.easy:hover { background: rgba(166, 227, 161, 0.15); }
  .diff-btn.easy.selected { background: rgba(166, 227, 161, 0.25); box-shadow: 0 0 0 2px #a6e3a1; }

  .diff-btn .interval {
    font-size: 11px;
    font-weight: 400;
    opacity: 0.7;
  }

  .trick-input {
    width: 100%;
    padding: 10px 14px;
    border: 1px solid #45475a;
    border-radius: 10px;
    background: #181825;
    color: #cdd6f4;
    font-size: 14px;
    font-family: inherit;
    outline: none;
    transition: border-color 0.15s;
    margin-bottom: 16px;
  }

  .trick-input::placeholder { color: #585b70; }
  .trick-input:focus { border-color: #6366f1; }

  .cancel-btn {
    width: 100%;
    padding: 10px;
    border: none;
    border-radius: 10px;
    background: transparent;
    color: #6c7086;
    font-size: 13px;
    font-family: inherit;
    cursor: pointer;
    transition: color 0.15s;
  }

  .cancel-btn:hover { color: #cdd6f4; }

  .save-btn {
    width: 100%;
    padding: 11px;
    border: none;
    border-radius: 10px;
    background: #6366f1;
    color: #fff;
    font-size: 14px;
    font-weight: 600;
    font-family: inherit;
    cursor: pointer;
    transition: background 0.15s, opacity 0.15s;
    margin-bottom: 8px;
  }

  .save-btn:hover:not(:disabled) { background: #4f46e5; }
  .save-btn:disabled { opacity: 0.4; cursor: not-allowed; }

  .status-msg {
    text-align: center;
    padding: 20px;
    font-size: 14px;
  }

  .status-msg.success { color: #a6e3a1; }
  .status-msg.error { color: #f38ba8; }
`;

export default function CaptureModal({ problemDetails, onClose }) {
  const [coreTrick, setCoreTrick] = useState('');
  const [status, setStatus] = useState(null); // null | 'saving' | 'success' | 'error' | 'duplicate' | 'restored'
  const [intervals, setIntervals] = useState({ hard: 1, medium: 3, easy: 5 });
  const [selectedDifficulty, setSelectedDifficulty] = useState(null);

  // Fetch user's revision intervals so labels stay in sync with dashboard settings
  useEffect(() => {
    chrome.runtime.sendMessage({ type: 'GET_INTERVALS' }, (res) => {
      if (res?.intervals) setIntervals(res.intervals);
    });
  }, []);

  const handleSave = async (difficulty) => {
    if (!problemDetails) return;
    setStatus('saving');

    try {
      const response = await new Promise((resolve, reject) => {
        chrome.runtime.sendMessage(
          {
            type: 'SAVE_PROBLEM',
              data: {
                platform: problemDetails.platform,
                title: problemDetails.problemTitle,
                url: problemDetails.url,
                difficulty,
                attemptType: 'solved',
                notes: coreTrick ? `**Core Trick:** ${coreTrick}` : '',
                device: 'Extension',
                timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
              },
          },
          (res) => {
            if (chrome.runtime.lastError) {
              reject(new Error(chrome.runtime.lastError.message));
              return;
            }
            resolve(res);
          }
        );
      });

      if (response?.error) {
        setStatus('error');
        setTimeout(() => onClose(false, null), 1500);
        return;
      }

      if (response?.isDuplicate) {
        setStatus('duplicate');
        setTimeout(() => onClose(true, response.problem?._id || null, false), 1200);
        return;
      }

      if (response?.restored) {
        setStatus('restored');
        chrome.runtime.sendMessage({ type: 'GET_DAILY_TASKS' });
        setTimeout(() => onClose(true, response.problem?._id || null, true), 900);
        return;
      }

      setStatus('success');
      chrome.runtime.sendMessage({ type: 'GET_DAILY_TASKS' });
      setTimeout(() => onClose(true, response.problem?._id || null, false), 800);
    } catch (err) {
      console.error('[CaptureModal] Save error:', err);
      setStatus('error');
      setTimeout(onClose, 1500);
    }
  };

  return (
    <>
      <style>{STYLES}</style>
        <div className="overlay" onClick={(e) => e.target === e.currentTarget && onClose(false)}>
        <div className="modal">
          {status === 'saving' && (
            <div className="status-msg">Saving...</div>
          )}
          {status === 'success' && (
            <div className="status-msg success">Saved!</div>
          )}
          {status === 'duplicate' && (
            <div className="status-msg" style={{ color: '#fab387' }}>Already saved</div>
          )}
          {status === 'restored' && (
            <div className="status-msg success">Restored to tracker</div>
          )}
          {status === 'error' && (
            <div className="status-msg error">Failed to save</div>
          )}
          {!status && (
            <>
              <div className="modal-title">Save for Revision</div>
              <div className="modal-subtitle" title={problemDetails?.problemTitle || ''}>
                {problemDetails?.problemTitle || 'Unknown problem'}
              </div>

              <span className="label">Difficulty?</span>
              <div className="difficulty-grid">
                <button
                  className={`diff-btn hard${selectedDifficulty === 'hard' ? ' selected' : ''}`}
                  onClick={() => setSelectedDifficulty('hard')}
                >
                  Hard
                  <span className="interval">Review in {intervals.hard}d</span>
                </button>
                <button
                  className={`diff-btn medium${selectedDifficulty === 'medium' ? ' selected' : ''}`}
                  onClick={() => setSelectedDifficulty('medium')}
                >
                  Medium
                  <span className="interval">Review in {intervals.medium}d</span>
                </button>
                <button
                  className={`diff-btn easy${selectedDifficulty === 'easy' ? ' selected' : ''}`}
                  onClick={() => setSelectedDifficulty('easy')}
                >
                  Easy
                  <span className="interval">Review in {intervals.easy}d</span>
                </button>
              </div>

              <span className="label">Core trick (optional)</span>
              <input
                className="trick-input"
                type="text"
                placeholder="e.g. Two-pointer with sorted array"
                value={coreTrick}
                onChange={(e) => setCoreTrick(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Escape') onClose(false);
                  if (e.key === 'Enter' && selectedDifficulty) handleSave(selectedDifficulty);
                }}
                autoFocus
              />

              <button
                className="save-btn"
                disabled={!selectedDifficulty}
                onClick={() => handleSave(selectedDifficulty)}
              >
                Save
              </button>

              <button className="cancel-btn" onClick={() => onClose(false)}>
                Cancel (Esc)
              </button>
            </>
          )}
        </div>
      </div>
    </>
  );
}
