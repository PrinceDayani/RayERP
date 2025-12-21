'use client';

import React, { useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Calendar as CalendarIcon, X, Filter, ChevronDown } from 'lucide-react';
import { format } from 'date-fns';

interface FilterState {
    dateRange: { from?: Date; to?: Date };
    amountRange: { min: number; max: number };
    customers: string[];
    statuses: string[];
    types: string[];
}

interface AdvancedFiltersProps {
    onFilterChange: (filters: FilterState) => void;
    customers?: Array<{ id: string; name: string }>;
}

const STATUS_OPTIONS = [
    'DRAFT', 'PENDING_APPROVAL', 'APPROVED', 'SENT', 'VIEWED',
    'PARTIALLY_PAID', 'PAID', 'OVERDUE', 'CANCELLED', 'COMPLETED'
];

const TYPE_OPTIONS = ['payment', 'invoice'];

export default function AdvancedFilters({ onFilterChange, customers = [] }: AdvancedFiltersProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [filters, setFilters] = useState<FilterState>({
        dateRange: {},
        amountRange: { min: 0, max: 1000000 },
        customers: [],
        statuses: [],
        types: [],
    });

    const [activeFiltersCount, setActiveFiltersCount] = useState(0);

    const updateFilter = (key: keyof FilterState, value: any) => {
        const newFilters = { ...filters, [key]: value };
        setFilters(newFilters);
        onFilterChange(newFilters);
        calculateActiveFilters(newFilters);
    };

    const calculateActiveFilters = (f: FilterState) => {
        let count = 0;
        if (f.dateRange?.from || f.dateRange?.to) count++;
        if (f.amountRange.min > 0 || f.amountRange.max < 1000000) count++;
        count += f.customers.length;
        count += f.statuses.length;
        count += f.types.length;
        setActiveFiltersCount(count);
    };

    const clearAllFilters = () => {
        const clearedFilters: FilterState = {
            dateRange: {},
            amountRange: { min: 0, max: 1000000 },
            customers: [],
            statuses: [],
            types: [],
        };
        setFilters(clearedFilters);
        onFilterChange(clearedFilters);
        setActiveFiltersCount(0);
    };

    const toggleStatus = (status: string) => {
        const newStatuses = filters.statuses.includes(status)
            ? filters.statuses.filter(s => s !== status)
            : [...filters.statuses, status];
        updateFilter('statuses', newStatuses);
    };

    const toggleType = (type: string) => {
        const newTypes = filters.types.includes(type)
            ? filters.types.filter(t => t !== type)
            : [...filters.types, type];
        updateFilter('types', newTypes);
    };

    return (
        <Card className="mb-6">
            <CardContent className="p-4">
                {/* Header */}
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-2">
                        <Filter className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold">Advanced Filters</h3>
                        {activeFiltersCount > 0 && (
                            <Badge variant="secondary">{activeFiltersCount} active</Badge>
                        )}
                    </div>
                    <div className="flex items-center gap-2">
                        {activeFiltersCount > 0 && (
                            <Button variant="ghost" size="sm" onClick={clearAllFilters}>
                                <X className="h-4 w-4 mr-1" />
                                Clear All
                            </Button>
                        )}
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setIsExpanded(!isExpanded)}
                        >
                            {isExpanded ? 'Collapse' : 'Expand'}
                            <ChevronDown className={`ml-1 h-4 w-4 transition-transform ${isExpanded ? 'rotate-180' : ''}`} />
                        </Button>
                    </div>
                </div>

                {/* Filters */}
                {isExpanded && (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Date Range */}
                        <div className="space-y-2">
                            <Label>Date Range</Label>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <Button variant="outline" className="w-full justify-start text-left font-normal">
                                        <CalendarIcon className="mr-2 h-4 w-4" />
                                        {filters.dateRange?.from ? (
                                            filters.dateRange.to ? (
                                                <>
                                                    {format(filters.dateRange.from, 'LLL dd, y')} - {format(filters.dateRange.to, 'LLL dd, y')}
                                                </>
                                            ) : (
                                                format(filters.dateRange.from, 'LLL dd, y')
                                            )
                                        ) : (
                                            <span>Pick a date range</span>
                                        )}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start">
                                    <Calendar
                                        initialFocus
                                        mode="range"
                                        defaultMonth={filters.dateRange?.from}
                                        selected={{ from: filters.dateRange.from, to: filters.dateRange.to }}
                                        onSelect={(range) => updateFilter('dateRange', range || {})}
                                        numberOfMonths={2}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>

                        {/* Amount Range */}
                        <div className="space-y-2">
                            <Label>Amount Range (₹)</Label>
                            <div className="pt-4">
                                <Slider
                                    min={0}
                                    max={1000000}
                                    step={1000}
                                    value={[filters.amountRange.min, filters.amountRange.max]}
                                    onValueChange={([min, max]) => updateFilter('amountRange', { min, max })}
                                    className="mb-2"
                                />
                                <div className="flex items-center justify-between text-sm text-muted-foreground">
                                    <span>₹{filters.amountRange.min.toLocaleString()}</span>
                                    <span>₹{filters.amountRange.max.toLocaleString()}</span>
                                </div>
                            </div>
                        </div>

                        {/* Customer Select */}
                        <div className="space-y-2">
                            <Label>Customer</Label>
                            <Select
                                value={filters.customers[0] || 'all'}
                                onValueChange={(value) => updateFilter('customers', value === 'all' ? [] : [value])}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="All customers" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All customers</SelectItem>
                                    {customers.map((customer) => (
                                        <SelectItem key={customer.id} value={customer.id}>
                                            {customer.name}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Type Multi-Select */}
                        <div className="space-y-2">
                            <Label>Type</Label>
                            <div className="flex gap-2">
                                {TYPE_OPTIONS.map((type) => (
                                    <Badge
                                        key={type}
                                        variant={filters.types.includes(type) ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => toggleType(type)}
                                    >
                                        {type}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Status Multi-Select */}
                        <div className="space-y-2 col-span-full">
                            <Label>Status</Label>
                            <div className="flex flex-wrap gap-2">
                                {STATUS_OPTIONS.map((status) => (
                                    <Badge
                                        key={status}
                                        variant={filters.statuses.includes(status) ? 'default' : 'outline'}
                                        className="cursor-pointer"
                                        onClick={() => toggleStatus(status)}
                                    >
                                        {status.replace('_', ' ')}
                                    </Badge>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
