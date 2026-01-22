"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
    Award,
    GraduationCap,
    Trophy,
    Star,
    Calendar,
    ExternalLink,
    Plus
} from "lucide-react";

export interface Achievement {
    _id?: string;
    title: string;
    description: string;
    date: string;
    category: 'award' | 'certification' | 'milestone' | 'training' | 'recognition';
    issuer?: string;
    credentialId?: string;
    expiryDate?: string;
    url?: string;
}

interface AchievementsSectionProps {
    employeeId: string;
    achievements: Achievement[];
    onAdd?: () => void;
    editable?: boolean;
}

const categoryConfig = {
    award: {
        icon: Trophy,
        color: 'bg-gradient-to-r from-yellow-500 to-amber-500',
        label: 'Award',
        badge: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400'
    },
    certification: {
        icon: GraduationCap,
        color: 'bg-gradient-to-r from-blue-500 to-cyan-500',
        label: 'Certification',
        badge: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400'
    },
    milestone: {
        icon: Star,
        color: 'bg-gradient-to-r from-purple-500 to-pink-500',
        label: 'Milestone',
        badge: 'bg-purple-100 text-purple-800 dark:bg-purple-900/20 dark:text-purple-400'
    },
    training: {
        icon: GraduationCap,
        color: 'bg-gradient-to-r from-green-500 to-emerald-500',
        label: 'Training',
        badge: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    },
    recognition: {
        icon: Award,
        color: 'bg-gradient-to-r from-orange-500 to-red-500',
        label: 'Recognition',
        badge: 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400'
    }
};

export default function AchievementsSection({
    employeeId,
    achievements,
    onAdd,
    editable = false
}: AchievementsSectionProps) {

    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short'
        });
    };

    const isExpired = (expiryDate?: string) => {
        if (!expiryDate) return false;
        return new Date(expiryDate) < new Date();
    };

    const isExpiringSoon = (expiryDate?: string) => {
        if (!expiryDate) return false;
        const expiry = new Date(expiryDate);
        const now = new Date();
        const threeMonths = 90 * 24 * 60 * 60 * 1000;
        return expiry > now && (expiry.getTime() - now.getTime()) < threeMonths;
    };

    // Group achievements by category
    const groupedAchievements = achievements.reduce((acc, achievement) => {
        if (!acc[achievement.category]) {
            acc[achievement.category] = [];
        }
        acc[achievement.category].push(achievement);
        return acc;
    }, {} as Record<string, Achievement[]>);

    // Sort by date within each category
    Object.keys(groupedAchievements).forEach(category => {
        groupedAchievements[category].sort((a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime()
        );
    });

    const totalAchievements = achievements.length;
    const certifications = achievements.filter(a => a.category === 'certification').length;
    const awards = achievements.filter(a => a.category === 'award').length;

    return (
        <div className="space-y-6">
            {/* Header Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-amber-50 via-background to-background dark:from-amber-950/10">
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2 text-2xl">
                                <Award className="w-6 h-6 text-amber-500" />
                                Achievements & Certifications
                            </CardTitle>
                            <p className="text-sm text-muted-foreground mt-1">
                                Professional growth, certifications, and recognitions
                            </p>
                        </div>
                        {editable && onAdd && (
                            <Button onClick={onAdd} size="sm">
                                <Plus className="w-4 h-4 mr-2" />
                                Add Achievement
                            </Button>
                        )}
                    </div>

                    {/* Stats */}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                        <div className="text-center p-3 bg-background rounded-lg border">
                            <div className="text-2xl font-bold text-primary">{totalAchievements}</div>
                            <div className="text-xs text-muted-foreground">Total</div>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg border">
                            <div className="text-2xl font-bold text-blue-600">{certifications}</div>
                            <div className="text-xs text-muted-foreground">Certifications</div>
                        </div>
                        <div className="text-center p-3 bg-background rounded-lg border">
                            <div className="text-2xl font-bold text-amber-600">{awards}</div>
                            <div className="text-xs text-muted-foreground">Awards</div>
                        </div>
                    </div>
                </CardHeader>
            </Card>

            {/* Achievements by Category */}
            {totalAchievements > 0 ? (
                <div className="space-y-6">
                    {Object.entries(groupedAchievements).map(([category, items]) => {
                        const config = categoryConfig[category as keyof typeof categoryConfig];
                        const Icon = config.icon;

                        return (
                            <Card key={category}>
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Icon className="w-5 h-5" />
                                        {config.label}s ({items.length})
                                    </CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        {items.map((achievement, index) => (
                                            <div
                                                key={achievement._id || index}
                                                className="relative group p-4 rounded-xl border-2 border-border hover:border-primary/50 transition-all hover:shadow-md bg-card"
                                            >
                                                {/* Icon Badge */}
                                                <div className={`absolute -top-3 -right-3 w-10 h-10 rounded-full ${config.color} flex items-center justify-center shadow-lg`}>
                                                    <Icon className="w-5 h-5 text-white" />
                                                </div>

                                                {/* Content */}
                                                <div className="space-y-2">
                                                    <Badge className={config.badge}>
                                                        {config.label}
                                                    </Badge>

                                                    <h4 className="font-semibold text-lg pr-8">
                                                        {achievement.title}
                                                    </h4>

                                                    <p className="text-sm text-muted-foreground">
                                                        {achievement.description}
                                                    </p>

                                                    {/* Meta Information */}
                                                    <div className="space-y-1 text-xs text-muted-foreground pt-2 border-t">
                                                        <div className="flex items-center gap-2">
                                                            <Calendar className="w-3 h-3" />
                                                            <span>Achieved: {formatDate(achievement.date)}</span>
                                                        </div>

                                                        {achievement.issuer && (
                                                            <div className="flex items-center gap-2">
                                                                <Award className="w-3 h-3" />
                                                                <span>Issued by: {achievement.issuer}</span>
                                                            </div>
                                                        )}

                                                        {achievement.credentialId && (
                                                            <div className="flex items-center gap-2">
                                                                <span className="font-mono text-xs">ID: {achievement.credentialId}</span>
                                                            </div>
                                                        )}

                                                        {achievement.expiryDate && (
                                                            <div className="flex items-center gap-2">
                                                                <Calendar className="w-3 h-3" />
                                                                <span className={
                                                                    isExpired(achievement.expiryDate)
                                                                        ? 'text-red-600 font-medium'
                                                                        : isExpiringSoon(achievement.expiryDate)
                                                                            ? 'text-orange-600 font-medium'
                                                                            : ''
                                                                }>
                                                                    {isExpired(achievement.expiryDate)
                                                                        ? 'Expired: '
                                                                        : isExpiringSoon(achievement.expiryDate)
                                                                            ? 'Expires Soon: '
                                                                            : 'Valid until: '}
                                                                    {formatDate(achievement.expiryDate)}
                                                                </span>
                                                            </div>
                                                        )}

                                                        {achievement.url && (
                                                            <Button
                                                                variant="link"
                                                                size="sm"
                                                                className="h-auto p-0 text-xs"
                                                                onClick={() => window.open(achievement.url, '_blank')}
                                                            >
                                                                <ExternalLink className="w-3 h-3 mr-1" />
                                                                View Credential
                                                            </Button>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </CardContent>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="py-12 text-center">
                        <Award className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                        <h3 className="text-lg font-semibold mb-2">No Achievements Yet</h3>
                        <p className="text-muted-foreground mb-4">
                            Start building your professional profile by adding achievements and certifications
                        </p>
                        {editable && onAdd && (
                            <Button onClick={onAdd} variant="outline">
                                <Plus className="w-4 h-4 mr-2" />
                                Add First Achievement
                            </Button>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
