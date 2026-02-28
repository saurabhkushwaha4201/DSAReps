import React from 'react';
import { Button } from './Button';
import { Card } from './Card';
import { PlusCircle } from 'lucide-react';

const EmptyState = ({ title, description, actionLabel, onAction }) => {
    return (
        <Card className="flex flex-col items-center justify-center py-12 text-center border-dashed border-2 bg-slate-50/50">
            <div className="bg-slate-100 p-4 rounded-full mb-4">
                <div className="w-12 h-12 bg-indigo-100 rounded-full flex items-center justify-center">
                    <PlusCircle className="w-6 h-6 text-indigo-600" />
                </div>
            </div>
            <h3 className="text-lg font-semibold text-slate-900 mb-1">{title}</h3>
            <p className="text-slate-500 max-w-sm mb-6">{description}</p>
            {actionLabel && onAction && (
                <Button onClick={onAction}>
                    {actionLabel}
                </Button>
            )}
        </Card>
    );
};

export { EmptyState };
