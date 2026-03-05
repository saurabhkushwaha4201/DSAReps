import React, { useState, useEffect, useCallback } from 'react';
import { X, Save, Loader2, Edit3, Eye } from 'lucide-react';
import { Button } from '../ui/Button';
import { updateNotes } from '../../api/problem.api';
import toast from 'react-hot-toast';

/**
 * NotesDrawer - Slide-over drawer for viewing/editing problem notes
 * Features: View/Edit modes, Auto-save with debounce, Markdown support
 */
export function NotesDrawer({ isOpen, onClose, problemId, initialNotes = '', onNotesUpdate }) {
    const [notes, setNotes] = useState(initialNotes);
    const [isSaving, setIsSaving] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [isEditMode, setIsEditMode] = useState(false);

    // Update notes when props change
    useEffect(() => {
        setNotes(initialNotes);
        setHasUnsavedChanges(false);
        // Start in view mode if there are existing notes, edit mode if empty
        setIsEditMode(!initialNotes);
    }, [initialNotes, isOpen]);

    // Debounced auto-save
    useEffect(() => {
        if (!hasUnsavedChanges || !isOpen) return;

        const timeoutId = setTimeout(() => {
            saveNotes();
        }, 1000); // 1 second debounce

        return () => clearTimeout(timeoutId);
    }, [notes, hasUnsavedChanges]);

    const saveNotes = useCallback(async () => {
        if (!problemId) return;

        setIsSaving(true);
        try {
            await updateNotes(problemId, notes);
            setHasUnsavedChanges(false);
            // Notify parent of the update so UI reflects changes immediately
            if (onNotesUpdate) {
                onNotesUpdate(problemId, notes);
            }
            toast.success('Notes saved!');
        } catch (error) {
            console.error('Failed to save notes:', error);
            toast.error('Failed to save notes');
        } finally {
            setIsSaving(false);
        }
    }, [problemId, notes, onNotesUpdate]);

    const handleNotesChange = (e) => {
        setNotes(e.target.value);
        setHasUnsavedChanges(true);
    };

    const handleBlur = () => {
        if (hasUnsavedChanges) {
            saveNotes();
        }
    };

    const handleClose = () => {
        if (hasUnsavedChanges) {
            saveNotes();
        }
        setIsEditMode(false);
        onClose();
    };

    const handleSwitchToEdit = () => {
        setIsEditMode(true);
    };

    const handleSwitchToView = () => {
        if (hasUnsavedChanges) {
            saveNotes();
        }
        setIsEditMode(false);
    };

    // Simple markdown to HTML renderer for view mode
    const renderMarkdown = (text) => {
        if (!text) return '<p class="text-slate-400 italic">No notes yet. Click "Edit" to add notes.</p>';

        return text
            .split('\n')
            .map(line => {
                // Headers
                if (line.startsWith('### ')) return `<h3 class="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2">${line.slice(4)}</h3>`;
                if (line.startsWith('## ')) return `<h2 class="text-xl font-bold text-slate-900 dark:text-slate-100 mt-4 mb-2">${line.slice(3)}</h2>`;
                if (line.startsWith('# ')) return `<h1 class="text-2xl font-bold text-indigo-600 dark:text-indigo-400 mt-4 mb-2">${line.slice(2)}</h1>`;
                // List items
                if (line.startsWith('- ') || line.startsWith('• ')) return `<li class="text-slate-700 dark:text-slate-300 ml-4">${line.slice(2)}</li>`;
                // Code blocks
                if (line.startsWith('```')) return '';
                // Bold text
                line = line.replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold">$1</strong>');
                // Inline code
                line = line.replace(/`(.*?)`/g, '<code class="bg-slate-100 dark:bg-slate-800 px-1 rounded text-sm text-indigo-600 dark:text-indigo-400">$1</code>');
                // Regular paragraph
                if (line.trim()) return `<p class="text-slate-700 dark:text-slate-300 mb-2">${line}</p>`;
                return '<br/>';
            })
            .join('');
    };

    // Handle mounting/unmounting for animations
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
        } else {
            const timer = setTimeout(() => setIsMounted(false), 300); // Match transition duration
            return () => clearTimeout(timer);
        }
    }, [isOpen]);

    if (!isMounted) return null;

    return (
        <>
            {/* Glassmorphism Backdrop */}
            <div
                className={`fixed inset-0 bg-black/40 backdrop-blur-sm z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={handleClose}
            />

            {/* Drawer */}
            <div
                className={`fixed right-0 top-0 bottom-0 w-full md:w-112.5 lg:w-137.5 bg-white dark:bg-slate-900 shadow-2xl z-50 transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'
                    }`}
            >
                {/* Header */}
                <div className="flex items-center justify-between p-5 border-b border-slate-200 dark:border-slate-700 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-slate-800 dark:to-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg">
                            <span className="text-xl">📝</span>
                        </div>
                        <div>
                            <h2 className="text-lg font-bold text-slate-900 dark:text-white">
                                Problem Notes
                            </h2>
                            <p className="text-xs text-slate-500 dark:text-slate-400">
                                {isSaving ? (
                                    <span className="flex items-center gap-1 text-indigo-600">
                                        <Loader2 className="w-3 h-3 animate-spin" />
                                        Saving...
                                    </span>
                                ) : hasUnsavedChanges ? (
                                    <span className="text-amber-600">Unsaved changes</span>
                                ) : (
                                    <span className="text-emerald-600">✓ Saved</span>
                                )}
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Mode Toggle */}
                        <div className="flex bg-slate-100 dark:bg-slate-800 rounded-lg p-1">
                            <button
                                onClick={handleSwitchToView}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${!isEditMode
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <Eye className="w-4 h-4" />
                                View
                            </button>
                            <button
                                onClick={handleSwitchToEdit}
                                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${isEditMode
                                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-sm'
                                    : 'text-slate-500 hover:text-slate-700 dark:hover:text-slate-300'
                                    }`}
                            >
                                <Edit3 className="w-4 h-4" />
                                Edit
                            </button>
                        </div>

                        <button
                            onClick={handleClose}
                            className="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Content - adjusted height for footer */}
                <div className="p-6 pb-20 h-[calc(100vh-80px)] overflow-y-auto">
                    {isEditMode ? (
                        /* Edit Mode */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    ✏️ Edit Your Notes
                                </label>
                                <span className="text-xs text-slate-400">Markdown supported</span>
                            </div>
                            <textarea
                                value={notes}
                                onChange={handleNotesChange}
                                onBlur={handleBlur}
                                autoFocus
                                placeholder="# Approach&#10;Used HashMap for O(1) lookup...&#10;&#10;## Time Complexity&#10;O(n)&#10;&#10;## Space Complexity&#10;O(n)&#10;&#10;## Key Insight&#10;The trick is to..."
                                className="w-full h-64 md:h-80 p-4 bg-slate-50 dark:bg-slate-800 border-2 border-slate-200 dark:border-slate-600 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 resize-none font-mono text-sm text-slate-900 dark:text-slate-100 placeholder:text-slate-400"
                            />

                            {/* Quick Tips */}
                            <div className="p-4 bg-linear-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 rounded-xl border border-indigo-100 dark:border-indigo-800">
                                <h4 className="text-sm font-semibold text-indigo-900 dark:text-indigo-300 mb-2">
                                    💡 Markdown Tips
                                </h4>
                                <div className="grid grid-cols-2 gap-2 text-xs text-indigo-800 dark:text-indigo-400">
                                    <span><code className="bg-white dark:bg-slate-800 px-1 rounded"># Heading</code></span>
                                    <span><code className="bg-white dark:bg-slate-800 px-1 rounded">**bold**</code></span>
                                    <span><code className="bg-white dark:bg-slate-800 px-1 rounded">- list item</code></span>
                                    <span><code className="bg-white dark:bg-slate-800 px-1 rounded">`code`</code></span>
                                </div>
                            </div>
                        </div>
                    ) : (
                        /* View Mode */
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">
                                    📖 Your Notes
                                </label>
                                {notes && (
                                    <button
                                        onClick={handleSwitchToEdit}
                                        className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 dark:text-indigo-400 dark:hover:text-indigo-300 font-medium"
                                    >
                                        <Edit3 className="w-3 h-3" />
                                        Edit
                                    </button>
                                )}
                            </div>

                            {/* Rendered Notes */}
                            <div
                                className="prose prose-slate dark:prose-invert max-w-none p-5 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-200 dark:border-slate-700 min-h-50"
                                dangerouslySetInnerHTML={{ __html: renderMarkdown(notes) }}
                            />

                            {!notes && (
                                <button
                                    onClick={handleSwitchToEdit}
                                    className="w-full py-4 mt-4 bg-linear-to-r from-indigo-500 to-purple-500 hover:from-indigo-600 hover:to-purple-600 text-white font-semibold rounded-xl transition-all shadow-lg hover:shadow-xl"
                                >
                                    ✏️ Add Notes
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900">
                    <Button
                        onClick={handleClose}
                        variant="outline"
                        className="w-full"
                    >
                        Close
                    </Button>
                </div>
            </div>
        </>
    );
}
