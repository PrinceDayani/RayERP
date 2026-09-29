"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Briefcase,
    Award,
    GraduationCap,
    TrendingUp,
    Calendar,
    MapPin,
    ArrowRight
} from "lucide-react";

interface CareerEvent {
    date: string;
    type: 'hire' | 'promotion' | 'role_change' | 'department_change' | 'project_start' | 'project_end' | 'certification' | 'achievement';
    title: string;
    description: string;
    metadata?: {
        from?: string;
        to?: string;
        project?: string;
        role?: string;
    };
}

interface CareerTimelineProps {
    employeeId: string;
    hireDate: string;
    currentPosition: string;
    currentDepartment: string;
    events?: CareerEvent[];
}

const eventConfig = {
    hire: { icon: Briefcase, color: 'bg-blue-500', label: 'Joined Company' },
    promotion: { icon: TrendingUp, color: 'bg-green-500', label: 'Promotion' },
    role_change: { icon: Briefcase, color: 'bg-purple-500', label: 'Role Change' },
    department_change: { icon: MapPin, color: 'bg-orange-500', label: 'Department Transfer' },
    project_start: { icon: Briefcase, color: 'bg-indigo-500', label: 'Project Started' },
    project_end: { icon: Briefcase, color: 'bg-gray-500', label: 'Project Completed' },
    certification: { icon: GraduationCap, color: 'bg-cyan-500', label: 'Certification' },
    achievement: { icon: Award, color: 'bg-amber-500', label: 'Achievement' }
};

export default function CareerTimeline({
    employeeId,
    hireDate,
    currentPosition,
    currentDepartment,
    events = []
}: CareerTimelineProps) {

    // Generate default hire event if no events provided
    const allEvents: CareerEvent[] = events.length > 0 ? events : [
        {
            date: hireDate,
            type: 'hire',
            title: `Joined as ${currentPosition}`,
            description: `Started career at ${currentDepartment}`,
            metadata: { role: currentPosition }
        }
    ];

    // Sort events by date (newest first)
    const sortedEvents = [...allEvents].sort((a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    };

    const getTimeSince = (dateStr: string) => {
        const date = new Date(dateStr);
        const now = new Date();
        const diffTime = Math.abs(now.getTime() - date.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 30) return `${diffDays} days ago`;
        if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
        const years = Math.floor(diffDays / 365);
        const months = Math.floor((diffDays % 365) / 30);
        return `${years}y ${months}m ago`;
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-primary" />
                    Career Timeline
                </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="relative">
                    {/* Timeline line */}
                    <div className="absolute left-[21px] top-0 bottom-0 w-0.5 bg-gradient-to-b from-primary/60 via-primary/40 to-transparent" />

                    {/* Timeline events */}
                    <div className="space-y-6">
                        {sortedEvents.map((event, index) => {
                            const config = eventConfig[event.type];
                            const Icon = config.icon;

                            return (
                                <div key={index} className="relative pl-12 pb-6 group">
                                    {/* Icon circle */}
                                    <div className={`absolute left-0 w-11 h-11 rounded-full ${config.color} flex items-center justify-center shadow-lg ring-4 ring-background transition-transform group-hover:scale-110`}>
                                        <Icon className="w-5 h-5 text-white" />
                                    </div>

                                    {/* Content */}
                                    <div className="bg-muted/50 rounded-xl p-4 hover:bg-muted transition-colors border border-border hover:border-primary/50">
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex-1">
                                                <Badge variant="secondary" className="mb-2 text-xs">
                                                    {config.label}
                                                </Badge>
                                                <h4 className="font-semibold text-lg mb-1">{event.title}</h4>
                                                <p className="text-sm text-muted-foreground mb-2">
                                                    {event.description}
                                                </p>

                                                {/* Metadata */}
                                                {event.metadata && (
                                                    <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                                                        {event.metadata.from && event.metadata.to && (
                                                            <div className="flex items-center gap-1 bg-background px-2 py-1 rounded">
                                                                <span>{event.metadata.from}</span>
                                                                <ArrowRight className="w-3 h-3" />
                                                                <span className="font-medium">{event.metadata.to}</span>
                                                            </div>
                                                        )}
                                                        {event.metadata.project && (
                                                            <div className="bg-background px-2 py-1 rounded">
                                                                Project: {event.metadata.project}
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            <div className="text-right ml-4">
                                                <div className="text-sm font-medium">{formatDate(event.date)}</div>
                                                <div className="text-xs text-muted-foreground">{getTimeSince(event.date)}</div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Current position marker */}
                    <div className="relative pl-12">
                        <div className="absolute left-0 w-11 h-11 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center shadow-lg ring-4 ring-background animate-pulse">
                            <Briefcase className="w-5 h-5 text-white" />
                        </div>
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20 rounded-xl p-4 border-2 border-green-200 dark:border-green-800">
                            <Badge className="mb-2 bg-green-600 text-white">Current</Badge>
                            <h4 className="font-semibold text-lg">{currentPosition}</h4>
                            <p className="text-sm text-muted-foreground">{currentDepartment}</p>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
