# 📘 DSA Tracker API - Quick Reference

## 🔐 Authentication
All endpoints require JWT token in Authorization header:
```
Authorization: Bearer <token>
```

---

## 📚 Problem Endpoints

### **GET /api/problems**
Fetch all problems with pagination

**Query Parameters**:
- `page` (optional, default: 1) - Page number
- `limit` (optional, default: 20) - Items per page

**Response**:
```json
{
  "problems": [{ ... }],
  "total": 150,
  "page": 1,
  "totalPages": 8,
  "hasMore": true
}
```

**Example**:
```javascript
GET /api/problems?page=2&limit=10
```

---

### **GET /api/problems/today**
Fetch problems due for revision today

**Response**:
```json
[
  {
    "_id": "...",
    "title": "Two Sum",
    "difficulty": "Easy",
    "nextReviewDate": "2026-01-29T00:00:00.000Z",
    ...
  }
]
```

---

### **POST /api/problems**
Save a new problem

**Request Body**:
```json
{
  "platform": "leetcode",
  "title": "Two Sum",
  "url": "https://leetcode.com/problems/two-sum",
  "difficulty": "Easy",
  "attemptType": "solved"
}
```

**Response**:
```json
{
  "success": true,
  "nextRevisionInDays": 0,
  "problem": { ... }
}
```

---

### **POST /api/problems/:id/revise**
Mark problem as revised (Legacy)

**Request Body**:
```json
{
  "solvedComfortably": true
}
```

**Response**:
```json
{
  "success": true,
  "status": "active",
  "nextRevisionInDays": 3
}
```

---

### **PATCH /api/problems/:id/notes**
Update problem notes

**Request Body**:
```json
{
  "notes": "Used HashMap approach. Time: O(n), Space: O(n)"
}
```

**Response**:
```json
{
  "success": true,
  "notes": "Used HashMap approach. Time: O(n), Space: O(n)"
}
```

---

### **PATCH /api/problems/:id/archive** ✨ NEW
Archive a problem

**Request Body**: None

**Response**:
```json
{
  "success": true,
  "problem": {
    "_id": "...",
    "status": "archived",
    "archivedAt": "2026-01-29T12:51:17.000Z",
    ...
  }
}
```

---

### **PATCH /api/problems/:id/unarchive** ✨ NEW
Restore an archived problem

**Request Body**: None

**Response**:
```json
{
  "success": true,
  "problem": {
    "_id": "...",
    "status": "active",
    "archivedAt": null,
    ...
  }
}
```

---

### **PATCH /api/problems/:id/reschedule** ✨ NEW
Reschedule next review date (without affecting SRS algorithm)

**Request Body**:
```json
{
  "nextReviewDate": "2026-02-05T00:00:00.000Z"
}
```

**Response**:
```json
{
  "success": true,
  "problem": { ... },
  "nextRevisionInDays": 7
}
```

**Notes**:
- Does NOT modify `srsInterval` or `srsEaseFactor`
- Useful for manual scheduling (e.g., "review this next Monday")
- Date must be provided, returns 400 if missing

---

## 🔄 Revision Endpoints

### **POST /api/reviews**
Submit a review with SRS rating

**Request Body**:
```json
{
  "problemId": "...",
  "rating": "GOOD",
  "timeTaken": 1800,
  "device": "Web"
}
```

**Ratings**: `AGAIN`, `HARD`, `GOOD`, `EASY`

**Response**:
```json
{
  "success": true,
  "nextReviewDate": "2026-02-05T00:00:00.000Z",
  "interval": 7
}
```

---

### **GET /api/dashboard/stats**
Fetch dashboard statistics

**Response**:
```json
{
  "totalRevisions": 124,
  "problemsMastered": 12,
  "streak": 15
}
```

---

## 🚨 Error Responses

### **404 Not Found**
```json
{
  "message": "Problem not found"
}
```

### **400 Bad Request**
```json
{
  "message": "nextReviewDate is required"
}
```

### **401 Unauthorized**
```json
{
  "message": "No token, authorization denied"
}
```

### **500 Internal Server Error**
```json
{
  "message": "Failed to fetch problems"
}
```

---

## 🎯 Frontend Integration Examples

### **Archive a Problem**
```javascript
import { archiveProblem } from '@/api/problem.api';

const handleArchive = async (problemId) => {
  try {
    const result = await archiveProblem(problemId);
    toast.success('Problem archived!');
    // Remove from UI or refresh list
  } catch (error) {
    toast.error('Failed to archive');
  }
};
```

### **Reschedule a Problem**
```javascript
import { rescheduleProblem } from '@/api/problem.api';
import { addDays } from 'date-fns';

const handleReschedule = async (problemId) => {
  const newDate = addDays(new Date(), 7); // 7 days from now
  
  try {
    await rescheduleProblem(problemId, newDate);
    toast.success('Rescheduled to next week!');
  } catch (error) {
    toast.error('Failed to reschedule');
  }
};
```

### **Load More Problems (Pagination)**
```javascript
import { getAllProblems } from '@/api/problem.api';

const loadMoreProblems = async () => {
  const response = await getAllProblems({ 
    page: currentPage + 1, 
    limit: 20 
  });
  
  setProblems(prev => [...prev, ...response.problems]);
  setCurrentPage(response.page);
  setHasMore(response.hasMore);
};
```

---

## 📊 Database Schema Reference

### **Problem Document**
```javascript
{
  userId: ObjectId,
  platform: "leetcode" | "codeforces",
  title: String,
  url: String,
  difficulty: "easy" | "medium" | "hard",
  attemptType: "solved" | "partial" | "watched",
  status: "active" | "mastered" | "archived", // ← Updated
  notes: String,
  tags: [String],
  srsInterval: Number,
  srsEaseFactor: Number,
  nextReviewDate: Date,
  isDeleted: Boolean,
  archivedAt: Date, // ← New field
  createdAt: Date,
  updatedAt: Date
}
```

---

*Last Updated: 2026-01-29*  
*API Version: 1.0*
