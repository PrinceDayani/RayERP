// Loading Skeleton Components for Finance Pages

import React from 'react';

export const TableSkeleton = ({ rows = 5, columns = 6 }: { rows?: number; columns?: number }) => {
    return (
        <div className="w-full animate-pulse">
            <div className="bg-gray-50 rounded-t-lg p-4">
                <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                    {Array.from({ length: columns }).map((_, i) => (
                        <div key={i} className="h-4 bg-gray-200 rounded"></div>
                    ))}
                </div>
            </div>
            <div className="bg-white divide-y divide-gray-200">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div key={rowIndex} className="p-4">
                        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
                            {Array.from({ length: columns }).map((_, colIndex) => (
                                <div key={colIndex} className="h-4 bg-gray-100 rounded"></div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};

export const CardSkeleton = () => {
    return (
        <div className="bg-white rounded-lg shadow p-6 animate-pulse">
            <div className="h-4 bg-gray-200 rounded w-1/3 mb-4"></div>
            <div className="h-8 bg-gray-300 rounded w-1/2 mb-2"></div>
            <div className="h-3 bg-gray-100 rounded w-2/3"></div>
        </div>
    );
};

export const FormSkeleton = () => {
    return (
        <div className="space-y-4 animate-pulse">
            <div className="grid grid-cols-2 gap-4">
                <div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                </div>
                <div>
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-10 bg-gray-100 rounded"></div>
                </div>
            </div>
            <div>
                <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                <div className="h-10 bg-gray-100 rounded"></div>
            </div>
            <div className="flex gap-2">
                <div className="h-10 bg-gray-300 rounded w-24"></div>
                <div className="h-10 bg-gray-200 rounded w-24"></div>
            </div>
        </div>
    );
};

export const StatCardsSkeleton = ({ count = 4 }: { count?: number }) => {
    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {Array.from({ length: count }).map((_, i) => (
                <CardSkeleton key={i} />
            ))}
        </div>
    );
};
