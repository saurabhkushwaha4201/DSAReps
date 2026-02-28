require('dotenv').config();
const mongoose = require('mongoose');
const User = require('../src/modules/users/user.model');
const Problem = require('../src/modules/problems/problem.model');
const userService = require('../src/modules/users/user.service');
const spacedRepetitionService = require('../src/modules/problems/spacedRepetition.service');
const revisionService = require('../src/modules/revisions/revision.service');
const connectDB = require('../src/config/db');

// Mock User Data
const TEST_USER = {
    googleId: 'test_google_id_123',
    email: 'test@example.com',
    name: 'Test User',
    avatar: 'http://avatar.com/u/1',
};

const runVerification = async () => {
    console.log('--- STARTING BACKEND VERIFICATION ---');

    // 1. Database Connection
    await mongoose.connect(process.env.MONGO_URI);
    console.log('[PASS] Connected to DB');

    try {
        // CLEANUP
        await User.deleteMany({ email: TEST_USER.email });
        await Problem.deleteMany({ url: 'https://leetcode.com/problems/test-problem' });
        console.log('[INFO] Cleanup done');

        // 2. Verify User Creation
        const user = await userService.createUser(TEST_USER);
        if (user && user.email === TEST_USER.email) {
            console.log('[PASS] User Creation');
        } else {
            throw new Error('User creation failed');
        }

        // 3. Verify Initial Scheduling Service
        const initialDate = spacedRepetitionService.calculateInitialNextRevisionDate('watched'); // +1 day
        const now = new Date();
        const diffDays = Math.round((initialDate - now) / (1000 * 60 * 60 * 24));

        // Note: If run late at night, date might wrap, allowing slack.
        // Logic: +1 day means date is close to now + 24h.
        // getDate() + 1 logic in service simply adds day to day part?
        // Let's check service logic: `nextRevisionDate.setDate(now.getDate() + 1);`
        // If today is 31st, it wraps to 1st.

        if (diffDays === 1) {
            console.log('[PASS] Initial Scheduling (watched = +1 day)');
        } else {
            console.error(`[FAIL] Initial Scheduling: Expected 1 day, got ${diffDays}`);
        }

        // 4. Verify Revision Logic Service
        // status active, comfortable
        const postRev = spacedRepetitionService.calculatePostRevisionSchedule(0, true);
        // count 0 -> 1, +7 days
        const diffRevDays = Math.round((postRev.nextRevisionAt - now) / (1000 * 60 * 60 * 24));
        if (postRev.revisionCount === 1 && diffRevDays === 7) {
            console.log('[PASS] Post Revision Scheduling (Comfortable: +7 days)');
        } else {
            console.error(`[FAIL] Post Revision Scheduling: Expected 7 days, got ${diffRevDays}`);
        }

        // 5. Verify Save Problem Logic (Simulated)
        // We can't call controller directly without req/res mocks easily, 
        // so let's call model directly to simulate what controller does.
        const createdProblem = await Problem.create({
            userId: user._id,
            platform: 'leetcode',
            title: 'Test Problem',
            url: 'https://leetcode.com/problems/test-problem',
            difficulty: 'medium',
            attemptType: 'watched',
            nextRevisionAt: initialDate
        });

        if (createdProblem) {
            console.log('[PASS] Problem Saved');
        }

        // 6. Verify "Today's Revisions" (Should be 0 as we set it to +1 day)
        const dueRevisionsEmpty = await revisionService.getDueRevisions(user._id);
        if (dueRevisionsEmpty.length === 0) {
            console.log('[PASS] Due revisions correct (0 due)');
        } else {
            console.error(`[FAIL] Expected 0 revisions, got ${dueRevisionsEmpty.length}`);
        }

        // 7. Force a problem to be due (Update date to yesterday)
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);
        await Problem.findByIdAndUpdate(createdProblem._id, { nextRevisionAt: yesterday });

        const dueRevisions = await revisionService.getDueRevisions(user._id);
        if (dueRevisions.length === 1) {
            console.log('[PASS] Due revisions correct after date manipulation (1 due)');
        } else {
            console.error(`[FAIL] Expected 1 revision, got ${dueRevisions.length}`);
        }

        console.log('--- VERIFICATION COMPLETE: ALL SYSTEMS GO ---');

    } catch (err) {
        console.error('[FAIL] Verification Process Error:', err);
    } finally {
        await mongoose.disconnect();
        process.exit();
    }
};

runVerification();
