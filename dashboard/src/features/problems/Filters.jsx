import React from 'react';
import { cn } from '../../utils/cn';
import { Button } from '../../components/ui/Button';

const FILTER_OPTIONS = [
    { label: 'All', value: 'all' },
    { label: 'Easy', value: 'Easy' },
    { label: 'Medium', value: 'Medium' },
    { label: 'Hard', value: 'Hard' },
    { label: 'LeetCode', value: 'LeetCode' },
    { label: 'Codeforces', value: 'Codeforces' },
];

const Filters = ({ activeFilter, onFilterChange }) => {
    return (
        <div className="flex flex-wrap gap-2 pb-4">
            {FILTER_OPTIONS.map((option) => (
                <Button
                    key={option.value}
                    variant={activeFilter === option.value ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => onFilterChange(option.value)}
                    className={cn(
                        "rounded-full px-4",
                        activeFilter === option.value ? 'bg-indigo-600 text-white border-indigo-600' : 'text-slate-600 border-slate-300'
                    )}
                >
                    {option.label}
                </Button>
            ))}
        </div>
    );
};

export default Filters;
