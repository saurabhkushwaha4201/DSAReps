export default function MarkDoneModal({ isOpen, onClose, onConfirm, title }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="relative bg-white rounded-2xl shadow-xl w-full max-w-sm mx-4 p-6 animate-in fade-in zoom-in duration-200">
        
        {/* Header */}
        <h3 className="text-lg font-semibold text-slate-900 mb-1">
          Revision complete 🎉
        </h3>
        <p className="text-sm text-slate-500 mb-4 truncate">
          {title}
        </p>

        {/* Prompt */}
        <p className="text-sm font-medium text-slate-700 mb-5">
          How did it feel this time?
        </p>

        {/* Options */}
        <div className="space-y-3">
          <button
            onClick={() => onConfirm('No')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl
              border border-slate-200 hover:bg-slate-50 transition"
          >
            <span>😕 Struggled</span>
            <span className="text-xs text-slate-400">revise soon</span>
          </button>

          <button
            onClick={() => onConfirm('Maybe')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl
              border border-slate-200 hover:bg-slate-50 transition"
          >
            <span>🙂 Okay</span>
            <span className="text-xs text-slate-400">normal gap</span>
          </button>

          <button
            onClick={() => onConfirm('Yes')}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl
              bg-green-500 text-white hover:bg-green-600 transition shadow-sm"
          >
            <span>😄 Comfortable</span>
            <span className="text-xs text-green-100">longer gap</span>
          </button>
        </div>

        {/* Footer */}
        <p className="mt-4 text-xs text-slate-400 text-center">
          This helps schedule your next revision.
        </p>

        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600"
          aria-label="Close"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
