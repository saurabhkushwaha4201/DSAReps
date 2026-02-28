# 🧪 **Quick Testing Guide** - Verify Everything Works

## ⚡ **5-Minute Full System Test**

### **Prerequisites**:
```bash
# Terminal 1: Backend
cd Backend
npm run dev
# Should see: "Server running on port 5000"

# Terminal 2: Dashboard  
cd dashboard
npm run dev
# Should see: "Local: http://localhost:5175"
```

---

## **Test Sequence**

### **1️⃣ Seed Database** (30 seconds)

```bash
# Terminal 3
cd Backend
node scripts/seed-portfolio-data.js
```

**Expected Output**:
```
✅ Connected to MongoDB
✅ Using user: Demo User (demo@example.com)
✅ Created 9 problems
✅ Created 15 revision logs
🎉 SEED COMPLETE!
```

---

### **2️⃣ Test Notes Feature** (60 seconds)

**Steps**:
1. Open browser: `http://localhost:5175`
2. Login with Google
3. Navigate to **"All Problems"** (sidebar)
4. **Hover** over first problem card
5. Click **purple sticky note icon** 📝 (appears on hover)
6. ✅ Drawer slides in from right
7. Type: `"Test auto-save feature"`
8. Wait 1 second
9. ✅ Toast: "Notes saved!" appears
10. Click outside or X to close
11. Refresh page (F5)
12. Click notes icon again
13. ✅ Notes still there

**Pass Criteria**: 
- [x] Drawer opens smoothly
- [x] Auto-save toast appears
- [x] Notes persist after refresh

---

### **3️⃣ Test Session Summary** (90 seconds)

**Steps**:
1. Navigate to **"Today's Focus"** (sidebar)
2. You should see 2-3 overdue problems (red badges)
3. Click **green checkmark** on first problem
4. ✅ Green banner appears: "Great Progress! 1 problem completed"
5. Click checkmark on 2 more problems
6. ✅ Banner updates: "3 problems completed"
7. Complete all remaining problems
8. ✅ Screen shows: "All Done for Today! 🎉"
9. Click **"🏆 View Session Summary"** button
10. ✅ Modal appears with:
    - "Session Complete! 🎉"
    - Problems Reviewed: 3
    - XP Earned: 45 (3 × 15)
    - Time Spent: 24 minutes
11. Click **"Back to Dashboard"**
12. ✅ Modal closes, returns to dashboard

**Pass Criteria**:
- [x] Progress banner tracks count
- [x] Completion screen appears
- [x] Modal shows correct stats
- [x] XP calculation = problems × 15

---

### **4️⃣ Test Archive/Restore** (45 seconds)

**Steps**:
1. Go to **"All Problems"**
2. Hover over any problem
3. Click **trash icon** (archive)
4. ✅ Toast: "Problem archived"
5. Click **"Archived" tab** (top of page)
6. ✅ See archived problem
7. Click **"Restore" button** (green)
8. ✅ Toast: "Problem restored"
9. Click **"Active" tab**
10. ✅ Problem is back

**Pass Criteria**:
- [x] Archive removes from active
- [x] Archived tab shows archived items
- [x] Restore moves back to active

---

### **5️⃣ Test Reschedule** (45 seconds)

**Steps**:
1. On "All Problems" page
2. Hover over a problem
3. Click **calendar icon**
4. ✅ Popover appears with date options
5. Click **"Next Week"**
6. ✅ Toast: "Rescheduled to [date]"
7. ✅ Next review date updates on card

**Pass Criteria**:
- [x] Popover opens
- [x] Date updates
- [x] Toast confirms

---

### **6️⃣ Test Head Start** (30 seconds)

**Steps**:
1. Go to "All Problems"
2. Archive ALL active problems (or mark as done)
3. ✅ "All Caught Up!" celebration appears
4. ✅ "Get a Head Start" section shows
5. ✅ 3 upcoming problems displayed

**Pass Criteria**:
- [x] Empty state triggers head start
- [x] Next 3 problems shown

---

### **7️⃣ Test Extension Notification** (60 seconds)

**Steps**:
1. Load extension in Chrome:
   - Go to `chrome://extensions`
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select `Frontend` folder
2. Open DevTools Console (F12)
3. Clear throttle:
   ```javascript
   chrome.storage.local.remove('lastNotificationTimestamp')
   ```
4. Close ALL Chrome windows
5. Reopen Chrome
6. Wait 2-3 seconds
7. ✅ Notification appears: "☀️ Ready to Code?"
8. Click notification
9. ✅ Dashboard opens

**Pass Criteria**:
- [x] Notification triggers on startup
- [x] Clicking opens dashboard

---

## ✅ **Quick Checklist**

Run through all tests:

- [ ] **Database Seeded** (demo data loaded)
- [ ] **Notes Auto-Save** (drawer + toast working)
- [ ] **Session Summary** (modal + XP calculation)
- [ ] **Archive/Restore** (state management)
- [ ] **Reschedule** (date picker + update)
- [ ] **Head Start** (empty state + suggestions)
- [ ] **Extension Notification** (startup trigger)

**All checked? → 🎉 100% FUNCTIONAL!**

---

## 🚨 **Common Issues & Fixes**

### **Issue 1: "Failed to load revisions"**
**Fix**:
```bash
# Backend not running
cd Backend && npm run dev
```

### **Issue 2: "Notes saved!" toast not appearing**
**Fix**:
- Check backend console for errors
- Verify MongoDB is running
- Check browser Network tab for 401 errors (re-login)

### **Issue 3: No problems in "Today's Focus"**
**Fix**:
```bash
# Re-run seed script
cd Backend
node scripts/seed-portfolio-data.js
```

### **Issue 4: Extension notification doesn't show**
**Fix**:
```javascript
// In Chrome DevTools Console:
chrome.storage.local.remove('lastNotificationTimestamp');
// Then close ALL Chrome windows and reopen
```

### **Issue 5: Modal doesn't appear in FocusMode**
**Fix**:
- Make sure you completed at least 1 problem
- Check browser console for React errors
- Verify import path for SessionSummary

---

## 🎯 **Performance Benchmarks**

Your app should meet these speeds:

| Action | Target | Status |
|--------|--------|--------|
| Page Load | < 2s | ⏱️ |
| Notes Auto-Save | ~1s | ⏱️ |
| Archive/Restore | < 500ms | ⏱️ |
| Session Modal | Instant | ⏱️ |
| Extension Notification | 2-3s | ⏱️ |

---

## 📊 **System Health Check**

After running all tests, verify:

```bash
# Check MongoDB has data
# In MongoDB Compass or Shell:
db.problems.countDocuments()
# Should be: 9

db.revisionlogs.countDocuments()  
# Should be: 15

# Check backend logs
# Should see API calls like:
# GET /api/problems/today
# PATCH /api/problems/:id/notes
# PATCH /api/problems/:id/archive
```

---

## 🎬 **Ready for Demo?**

If all tests pass:
- ✅ Backend is stable
- ✅ Frontend is integrated
- ✅ Extension is working
- ✅ Database has demo data
- ✅ All features functional

**You're ready to record your golden path demo!**

Follow: `.docs/golden-path-demo.md`

---

## 💡 **Pro Testing Tips**

1. **Test in Incognito** - Clean slate, no cache issues
2. **Use React DevTools** - See component state updates
3. **Check Network Tab** - Verify API calls
4. **Test Dark Mode** - Toggle and verify all components
5. **Mobile Responsive** - Resize browser to 375px width
6. **Clear Browser Cache** - Hard refresh (Ctrl+Shift+R)

---

**Happy Testing!** 🧪

All features working? → Time to ship it! 🚀
