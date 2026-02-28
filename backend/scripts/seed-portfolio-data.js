/**
 * 🌱 DSA Tracker - Portfolio Seed Data
 * 
 * This script populates your database with "demo-ready" data
 * Perfect for screenshots, videos, and portfolio presentations
 * 
 * Run with: node seed-portfolio-data.js
 */

const mongoose = require('mongoose');
require('dotenv').config();

// Import your models
const Problem = require('./src/modules/problems/problem.model');
const RevisionLog = require('./src/modules/revisions/revision.model');
const User = require('./src/modules/users/user.model');

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/dsa-tracker';

// Replace with your actual user ID (or create a test user)
const TEST_USER_EMAIL = 'demo@example.com';
let userId;

const seedData = async () => {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected to MongoDB');

        // 1. Find or create demo user
        let user = await User.findOne({ email: TEST_USER_EMAIL });
        if (!user) {
            console.log('Creating demo user...');
            user = await User.create({
                email: TEST_USER_EMAIL,
                name: 'Demo User',
                googleId: 'demo-google-id-123'
            });
        }
        userId = user._id;
        console.log(`✅ Using user: ${user.name} (${user.email})`);

        // 2. Clear existing demo data (optional - comment out if you want to keep existing)
        // await Problem.deleteMany({ userId });
        // await RevisionLog.deleteMany({ userId });
        // console.log('🗑️  Cleared existing data');

        // 3. Create problems with strategic states
        const now = new Date();
        const problems = [];

        // --- 2 OVERDUE PROBLEMS (RED URGENCY) ---
        problems.push({
            userId,
            platform: 'leetcode',
            title: 'Two Sum',
            url: 'https://leetcode.com/problems/two-sum',
            difficulty: 'easy',
            attemptType: 'solved',
            status: 'active',
            notes: '# Approach\nUsed HashMap for O(1) lookup\n\n## Time: O(n)\n## Space: O(n)',
            tags: ['Arrays', 'Hash Table'],
            srsInterval: 3,
            srsEaseFactor: 2.5,
            nextReviewDate: new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
            createdAt: new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000) // 10 days old
        });

        problems.push({
            userId,
            platform: 'leetcode',
            title: 'Binary Tree Level Order Traversal',
            url: 'https://leetcode.com/problems/binary-tree-level-order-traversal',
            difficulty: 'medium',
            attemptType: 'partial',
            status: 'active',
            notes: 'Need to review BFS traversal pattern',
            tags: ['Tree', 'BFS'],
            srsInterval: 1,
            srsEaseFactor: 2.0,
            nextReviewDate: new Date(now.getTime() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
            createdAt: new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000)
        });

        // --- 1 MASTERED PROBLEM (5/5 GREEN) ---
        problems.push({
            userId,
            platform: 'leetcode',
            title: 'Valid Parentheses',
            url: 'https://leetcode.com/problems/valid-parentheses',
            difficulty: 'easy',
            attemptType: 'solved',
            status: 'active',
            notes: '# Stack Pattern Mastered\nCan solve in sleep now 😴',
            tags: ['Stack', 'String'],
            srsInterval: 21, // Long interval = mastered
            srsEaseFactor: 3.0,
            nextReviewDate: new Date(now.getTime() + 15 * 24 * 60 * 60 * 1000), // 15 days future
            createdAt: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)
        });

        // --- 1 ARCHIVED PROBLEM ---
        problems.push({
            userId,
            platform: 'codeforces',
            title: 'Too Easy Problem',
            url: 'https://codeforces.com/problemset/problem/4/A',
            difficulty: 'easy',
            attemptType: 'watched',
            status: 'archived',
            archivedAt: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000),
            notes: 'Archived - too basic',
            tags: ['Math'],
            srsInterval: 1,
            srsEaseFactor: 2.5,
            nextReviewDate: now,
            createdAt: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        });

        // --- 5 ACTIVE PROBLEMS (FOR PAGINATION/SCROLL) ---
        const activeProblems = [
            {
                title: 'Longest Substring Without Repeating Characters',
                url: 'https://leetcode.com/problems/longest-substring-without-repeating-characters',
                difficulty: 'medium',
                tags: ['Sliding Window', 'Hash Table'],
                daysUntilReview: 2
            },
            {
                title: 'Merge K Sorted Lists',
                url: 'https://leetcode.com/problems/merge-k-sorted-lists',
                difficulty: 'hard',
                tags: ['Linked List', 'Heap'],
                daysUntilReview: 3
            },
            {
                title: 'Coin Change',
                url: 'https://leetcode.com/problems/coin-change',
                difficulty: 'medium',
                tags: ['DP', 'Array'],
                daysUntilReview: 0 // Due today
            },
            {
                title: 'LRU Cache',
                url: 'https://leetcode.com/problems/lru-cache',
                difficulty: 'medium',
                tags: ['Design', 'Hash Table'],
                daysUntilReview: 1
            },
            {
                title: 'Word Break',
                url: 'https://leetcode.com/problems/word-break',
                difficulty: 'medium',
                tags: ['DP', 'Trie'],
                daysUntilReview: 4
            }
        ];

        activeProblems.forEach((p, index) => {
            problems.push({
                userId,
                platform: 'leetcode',
                title: p.title,
                url: p.url,
                difficulty: p.difficulty,
                attemptType: 'solved',
                status: 'active',
                notes: `Iteration ${index + 1}`,
                tags: p.tags,
                srsInterval: p.daysUntilReview || 1,
                srsEaseFactor: 2.5,
                nextReviewDate: new Date(now.getTime() + p.daysUntilReview * 24 * 60 * 60 * 1000),
                createdAt: new Date(now.getTime() - (index + 1) * 2 * 24 * 60 * 60 * 1000)
            });
        });

        // Insert problems
        const insertedProblems = await Problem.insertMany(problems);
        console.log(`✅ Created ${insertedProblems.length} problems`);

        // 4. Create revision logs for realistic streak/history
        const revisionLogs = [];
        const problemIds = insertedProblems.slice(0, 5).map(p => p._id);

        for (let i = 0; i < 15; i++) {
            revisionLogs.push({
                userId,
                problemId: problemIds[i % problemIds.length],
                reviewedAt: new Date(now.getTime() - i * 24 * 60 * 60 * 1000),
                rating: ['GOOD', 'EASY', 'HARD'][i % 3],
                timeTaken: Math.floor(Math.random() * 1800) + 300, // 5-35 minutes
                device: i % 2 === 0 ? 'Web' : 'Extension'
            });
        }

        await RevisionLog.insertMany(revisionLogs);
        console.log(`✅ Created ${revisionLogs.length} revision logs`);

        console.log('\n🎉 SEED COMPLETE! Your database now has:');
        console.log('   📌 2 Overdue Problems (triggers urgency UI)');
        console.log('   ✅ 1 Mastered Problem (5/5 mastery bar)');
        console.log('   📦 1 Archived Problem (for archive tab)');
        console.log('   🎯 5 Active Problems (pagination/scroll)');
        console.log('   📊 15 Revision Logs (for streak/stats)');
        console.log('\n✨ Ready for portfolio screenshots!\n');

    } catch (error) {
        console.error('❌ Seed failed:', error);
    } finally {
        await mongoose.disconnect();
        console.log('👋 Disconnected from MongoDB');
    }
};

// Run the seed
seedData();
