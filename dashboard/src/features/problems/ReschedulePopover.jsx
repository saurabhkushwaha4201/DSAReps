import React, { useState, useLayoutEffect } from 'react';
import { addDays, format, nextMonday } from 'date-fns';
import { Calendar, X } from 'lucide-react';
import { createPortal } from 'react-dom';

export function ReschedulePopover({ isOpen, onClose, onSelect, triggerRef }) {
    const [position, setPosition] = useState(null);

    // Use useLayoutEffect to calculate position BEFORE paint
    useLayoutEffect(() => {
        if (isOpen && triggerRef?.current) {
            const rect = triggerRef.current.getBoundingClientRect();
            const viewportWidth = window.innerWidth;
            const viewportHeight = window.innerHeight;
            const popoverWidth = 280;
            const popoverHeight = 320;

            let left = rect.left;
            let top = rect.bottom + 8;

            // Adjust for right edge
            if (left + popoverWidth > viewportWidth - 16) {
                left = viewportWidth - popoverWidth - 16;
            }

            // Adjust for left edge
            if (left < 16) {
                left = 16;
            }

            // Adjust for bottom edge - show above if needed
            if (top + popoverHeight > viewportHeight - 16) {
                top = rect.top - popoverHeight - 8;
                if (top < 16) top = 16;
            }

            setPosition({ top, left });
        } else {
            setPosition(null);
        }
    }, [isOpen, triggerRef]);

    // Don't render until position is calculated
    if (!isOpen || !position) return null;

    const today = new Date();
    const presets = [
        { label: 'Tomorrow', date: addDays(today, 1), icon: '📅' },
        { label: 'In 3 Days', date: addDays(today, 3), icon: '📆' },
        { label: 'This Weekend', date: addDays(today, (6 - today.getDay() + 7) % 7 || 7), icon: '🗓️' },
        { label: 'Next Monday', date: nextMonday(today), icon: '📋' },
        { label: 'Next Week', date: addDays(today, 7), icon: '🗂️' },
    ];

    const handlePresetClick = (date) => {
        onSelect(date);
        onClose();
    };

    const handleCustomDate = (e) => {
        if (e.target.value) {
            onSelect(new Date(e.target.value));
            onClose();
        }
    };

    return createPortal(
        <>
            {/* Backdrop */}
            <div
                className="fixed inset-0 z-100 bg-black/10"
                onClick={onClose}
            />

            {/* Popover - positioned exactly where calculated */}
            <div
                className="fixed z-101 w-72 bg-white dark:bg-slate-800 rounded-xl shadow-2xl border border-slate-200 dark:border-slate-700 overflow-hidden"
                style={{
                    top: position.top,
                    left: position.left,
                    maxWidth: 'calc(100vw - 32px)'
                }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header */}
                <div className="flex justify-between items-center px-4 py-3 bg-linear-to-r from-indigo-500 to-purple-500">
                    <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-white" />
                        <h4 className="text-sm font-semibold text-white">Reschedule</h4>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1 rounded-md hover:bg-white/20 text-white/80 hover:text-white transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

                {/* Quick Options */}
                <div className="p-2 max-h-50 overflow-y-auto">
                    {presets.map((p) => (
                        <button
                            key={p.label}
                            onClick={() => handlePresetClick(p.date)}
                            className="w-full text-left px-3 py-2.5 text-sm text-slate-700 dark:text-slate-200 hover:bg-indigo-50 dark:hover:bg-slate-700 rounded-lg transition-all flex justify-between items-center group"
                        >
                            <div className="flex items-center gap-2">
                                <span className="text-base">{p.icon}</span>
                                <span className="font-medium">{p.label}</span>
                            </div>
                            <span className="text-xs text-slate-400 group-hover:text-indigo-500 dark:group-hover:text-indigo-400 font-medium">
                                {format(p.date, 'EEE, MMM d')}
                            </span>
                        </button>
                    ))}
                </div>

                {/* Custom Date Picker */}
                <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                    <label className="text-xs font-medium text-slate-500 dark:text-slate-400 mb-2 block">
                        Or pick a specific date
                    </label>
                    <div className="relative">
                        <Calendar size={16} className="absolute left-3 top-2.5 text-slate-400 pointer-events-none" />
                        <input
                            type="date"
                            min={format(addDays(today, 1), 'yyyy-MM-dd')}
                            onChange={handleCustomDate}
                            className="w-full pl-10 pr-3 py-2.5 text-sm bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-700 dark:text-slate-200 cursor-pointer"
                        />
                    </div>
                </div>
            </div>
        </>,
        document.body
    );
}
