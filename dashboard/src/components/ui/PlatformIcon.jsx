import React from 'react';
import leetcodeImg from '../../assets/leetcode-color.svg';
import codeforcesImg from '../../assets/codeforces-color.svg';
import gfgImg from '../../assets/geeksforgeeks-color.svg';

const PlatformIcon = ({ url = '' }) => {
    // 1. LEETCODE
    if (url?.includes('leetcode.com')) {
        return <img src={leetcodeImg} alt="LeetCode" className="w-4 h-4 shrink-0 mt-0.5" />;
    }

    // 2. GEEKSFORGEEKS
    if (url?.includes('geeksforgeeks.org')) {
        return <img src={gfgImg} alt="GeeksForGeeks" className="w-4 h-4 shrink-0 mt-0.5" />;
    }

    // 3. CODEFORCES
    if (url?.includes('codeforces.com')) {
        return <img src={codeforcesImg} alt="Codeforces" className="w-4 h-4 shrink-0 mt-0.5" />;
    }

    // 4. CSES / Default — Terminal Chevron
    return (
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-gray-400">
            <polyline points="4 17 10 11 4 5" />
            <line x1="12" y1="19" x2="20" y2="19" />
        </svg>
    );
};

export default PlatformIcon;