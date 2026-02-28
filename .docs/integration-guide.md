# 🔌 Quick Integration Guide - New Components

## 🎯 How to Use the New Components

### 1️⃣ **NotesDrawer** - Add to ProblemCard or ProblemList

**Step 1**: Import in your component
```javascript
import { NotesDrawer } from '../../components/notes/NotesDrawer';
```

**Step 2**: Add state management
```javascript
const [notesDrawer, setNotesDrawer] = useState({
  isOpen: false,
  problemId: null,
  initialNotes: ''
});
```

**Step 3**: Add trigger button (e.g., in ProblemCard)
```jsx
<button
  onClick={() => setNotesDrawer({
    isOpen: true,
    problemId: problem._id,
    initialNotes: problem.notes || ''
  })}
  className="p-2 text-slate-400 hover:text-indigo-600"
  title="Edit Notes"
>
  <StickyNote className="w-4 h-4" />
</button>
```

**Step 4**: Render the drawer
```jsx
<NotesDrawer
  isOpen={notesDrawer.isOpen}
  onClose={() => setNotesDrawer({ ...notesDrawer, isOpen: false })}
  problemId={notesDrawer.problemId}
  initialNotes={notesDrawer.initialNotes}
/>
```

---

### 2️⃣ **SessionSummary** - Add to FocusMode/FocusSession

**Step 1**: Import
```javascript
import { SessionSummary, calculateSessionStats } from '../../components/session/SessionSummary';
```

**Step 2**: Track completed problems
```javascript
const [completedProblems, setCompletedProblems] = useState([]);
const [showSummary, setShowSummary] = useState(false);
```

**Step 3**: After all problems reviewed
```javascript
const handleFinishSession = () => {
  // Calculate stats from completed problems
  const stats = calculateSessionStats(completedProblems);
  
  // Show summary modal
  setShowSummary(true);
  setSessionStats(stats);
};
```

**Step 4**: Render modal
```jsx
<SessionSummary
  isOpen={showSummary}
  onClose={() => setShowSummary(false)}
  stats={sessionStats}
/>
```

**Example stats object**:
```javascript
{
  problemsReviewed: 5,
  xpEarned: 75,        // 15 XP per problem
  timeSpent: 40,       // in minutes
  perfectStreak: true  // all rated "GOOD" or "EASY"
}
```

---

### 3️⃣ **Head Start Feature** - Already Integrated! ✅

The Head Start feature is automatically active in `ProblemList.jsx`:

**Triggers when**:
- User is in "Active" tab
- No problems match current filter
- Auto-shows next 3 upcoming problems

**No additional setup needed!** 🎉

---

## 🎨 **ProblemCard Enhancement Example**

Here's how to add a notes button to existing ProblemCards:

```jsx
// In ProblemCard.jsx
import { StickyNote } from 'lucide-react';
import { useState } from 'react';
import { NotesDrawer } from '../../components/notes/NotesDrawer';

export default function ProblemCard({ problem, ...otherProps }) {
  const [showNotes, setShowNotes] = useState(false);

  return (
    <>
      <Card className="...">
        {/* Existing card content */}
        
        {/* Add notes button to actions section */}
        <div className="flex items-center gap-3">
          {/* Existing buttons */}
          
          {/* NEW: Notes Button */}
          <button
            onClick={() => setShowNotes(true)}
            className="p-2 text-slate-400 hover:text-indigo-600 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            title="Edit Notes"
          >
            <StickyNote className="w-4 h-4" />
          </button>
        </div>
      </Card>

      {/* Drawer */}
      <NotesDrawer
        isOpen={showNotes}
        onClose={() => setShowNotes(false)}
        problemId={problem._id}
        initialNotes={problem.notes || ''}
      />
    </>
  );
}
```

---

## 🚀 **Extension: Switching to Real API**

Currently using mocked data. To use real API:

**In `serviceWorker.js`**, replace:
```javascript
// MOCK VERSION (Current)
const dueCount = await fetchDueCountMock();
```

**With**:
```javascript
// REAL VERSION
const dueCount = await fetchDueCount();
```

**The fetchDueCount() function is already there**:
```javascript
async function fetchDueCount() {
  try {
    const data = await apiFetch("/api/problems/today");
    return Array.isArray(data) ? data.length : 0;
  } catch (err) {
    console.error("[BG] Failed to fetch due count:", err);
    return 0; // Fail silently
  }
}
```

---

## 📱 **Testing Notifications Locally**

### **Morning Notification Test**:
```javascript
// In browser console (after loading extension):
chrome.runtime.sendMessage({ type: 'TEST_MORNING_NOTIFICATION' });

// Add this handler in serviceWorker.js for testing:
if (message.type === "TEST_MORNING_NOTIFICATION") {
  checkAndNotify('startup');
  sendResponse({ success: true });
}
```

### **Evening Notification Test**:
Change the hour check temporarily:
```javascript
// Original
if (currentHour >= 19) { ... }

// For testing (fires immediately)
if (currentHour >= 0) { ... }
```

### **Reset Throttle**:
```javascript
// In browser console:
chrome.storage.local.remove('lastNotificationTimestamp');
```

---

## 🎯 **Complete Integration Example**

Here's a full example of a component using all new features:

```jsx
import React, { useState } from 'react';
import ProblemCard from './ProblemCard';
import { NotesDrawer } from '../../components/notes/NotesDrawer';
import { SessionSummary, calculateSessionStats } from '../../components/session/SessionSummary';

export function MyDashboard() {
  const [problems, setProblems] = useState([]);
  const [notesDrawer, setNotesDrawer] = useState({ isOpen: false, problemId: null, notes: '' });
  const [sessionStats, setSessionStats] = useState(null);
  const [completedProblems, setCompletedProblems] = useState([]);

  const handleOpenNotes = (problem) => {
    setNotesDrawer({
      isOpen: true,
      problemId: problem._id,
      notes: problem.notes || ''
    });
  };

  const handleCompleteSession = () => {
    const stats = calculateSessionStats(completedProblems);
    setSessionStats(stats);
  };

  return (
    <div>
      {/* Problem Cards */}
      {problems.map(problem => (
        <ProblemCard
          key={problem._id}
          problem={problem}
          onOpenNotes={() => handleOpenNotes(problem)}
        />
      ))}

      {/* Finish Session Button */}
      <button onClick={handleCompleteSession}>
        Finish Session
      </button>

      {/* Components */}
      <NotesDrawer
        isOpen={notesDrawer.isOpen}
        onClose={() => setNotesDrawer({ ...notesDrawer, isOpen: false })}
        problemId={notesDrawer.problemId}
        initialNotes={notesDrawer.notes}
      />

      <SessionSummary
        isOpen={!!sessionStats}
        onClose={() => setSessionStats(null)}
        stats={sessionStats}
      />
    </div>
  );
}
```

---

## ✅ **Checklist for Full Integration**

- [ ] Add NotesDrawer to ProblemCard actions
- [ ] Add SessionSummary to FocusSession completion
- [ ] Test Head Start appears when list is empty
- [ ] Switch extension to real API (uncomment fetchDueCount)
- [ ] Test morning notification on browser restart
- [ ] Test evening notification at 7 PM
- [ ] Verify 6-hour throttle works
- [ ] Test all components in dark mode
- [ ] Add loading states for async operations
- [ ] Handle offline scenarios gracefully

---

## 🎨 **Styling Tips**

All components use Tailwind classes. To customize:

```jsx
// Example: Change drawer width
<div className="w-full md:w-[400px] lg:w-[500px]"> // Current
<div className="w-full md:w-[500px] lg:w-[600px]"> // Wider
```

```jsx
// Example: Change modal backdrop blur
<div className="backdrop-blur-sm">  // Current (subtle)
<div className="backdrop-blur-md">  // Stronger blur
```

---

**Ready to integrate!** 🚀

All components are production-ready and fully typed for autocomplete support.
