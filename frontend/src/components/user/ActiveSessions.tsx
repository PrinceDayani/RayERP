"use client";

import React, { useState, eff ect } from 'react';
import sessionAPI, { SessionInfo } from '@/lib/api/sessionAPI';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/components/ui/use-toast';
import {
    Monitor,
    Smartphone,
    Tablet,
    Globe,
    MapPin,
    Clock,
    LogOut,
    AlertTriangle,
    CheckCircle2
} from 'lucide-react';

const ActiveSessions: React.FC = () => {
    const [sessions, setSessions] = useState<SessionInfo[]>([]);
    const [loading, setLoading] = useState(true);
    const [revoking, setRevoking] = useState<string | null>(null);

    const fetchSessions = async () => {
        try {
            setLoading(true);
            const data = await sessionAPI.getActiveSessions();
            setSessions(data);
        } catch (error: any) {
            toast({
                title: 'Error',
                description: 'Failed to load active sessions',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchSessions();
    }, []);

    const handleRevokeSession = async (sessionId: string) => {
        try {
            setRevoking(sessionId);
            await sessionAPI.revokeSession(sessionId);
            toast({
                title: 'Success',
                description: 'Session revoked successfully'
            });
            fetchSessions(); // Refresh the list
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to revoke session',
                variant: 'destructive'
            });
        } finally {
            setRevoking(null);
        }
    };

    const handleRevokeAllOtherSessions = async () => {
        try {
            setLoading(true);
            const count = await sessionAPI.revokeAllOtherSessions();
            toast({
                title: 'Success',
                description: `Revoked ${count} session(s) successfully`
            });
            fetchSessions();
        } catch (error: any) {
            toast({
                title: 'Error',
                description: error.message || 'Failed to revoke sessions',
                variant: 'destructive'
            });
        } finally {
            setLoading(false);
        }
    };

    const getDeviceIcon = (deviceType: string) => {
        switch (deviceType) {
            case 'mobile':
                return <Smartphone className="h-5 w-5" />;
            case 'tablet':
                return <Tablet className="h-5 w-5" />;
            case 'desktop':
            default:
                return <Monitor className="h-5 w-5" />;
        }
    };

    const formatDate = (dateString: string) => {
        const date = new Date(dateString);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        const diffDays = Math.floor(diffMs / 86400000);

        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
        if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
        if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
        return date.toLocaleDateString();
    };

    return (
        <Card className="bg-card/95 backdrop-blur-sm border border-border/50 shadow-lg">
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="text-2xl font-bold flex items-center gap-2">
                            <Globe className="h-6 w-6 text-primary" />
                            Active Sessions
                        </CardTitle>
                        <CardDescription className="mt-2">
                            Manage your active login sessions across devices. Maximum 2 concurrent sessions allowed.
                        </CardDescription>
                    </div>
                    {sessions.length > 1 && (
                        <Button
                            variant="destructive"
                            onClick={handleRevokeAllOtherSessions}
                            disabled={loading}
                            className="hover:scale-105 transition-transform"
                        >
                            <LogOut className="h-4 w-4 mr-2" />
                            Revoke All Others
                        </Button>
                    )}
                </div>
            </CardHeader>

            <CardContent>
                {loading ? (
                    <div className="flex justify-center py-12">
                        <div className="animate-spin rounded-full h-12 w-12 border-4 border-muted border-t-primary"></div>
                    </div>
                ) : sessions.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                        <Globe className="h-12 w-12 mx-auto mb-4 opacity-50" />
                        <p>No active sessions found</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {sessions.map((session) => (
                            <div
                                key={session._id}
                                className={`p-4 rounded-xl border transition-all $  {
                  session.isCurrent
                    ? 'bg-primary/5 border-primary/30 ring-2 ring-primary/20'
                    : 'bg-card/50 border-border/50 hover:border-border'
                }`}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-start gap-4 flex-1">
                                        <div className={`p-3 rounded-lg ${session.isCurrent ? 'bg-primary/10' : 'bg-muted/50'
                                            }`}>
                                            {getDeviceIcon(session.deviceInfo.deviceType)}
                                        </div>

                                        <div className="flex-1 space-y-2">
                                            <div className="flex items-center gap-2">
                                                <h3 className="font-semibold text-foreground">
                                                    {session.deviceInfo.browser || 'Unknown Browser'} on {session.deviceInfo.os || 'Unknown OS'}
                                                </h3>
                                                {session.isCurrent && (
                                                    <Badge className="bg-primary/20 text-primary border-primary/30">
                                                        <CheckCircle2 className="h-3 w-3 mr-1" />
                                                        Current Session
                                                    </Badge>
                                                )}
                                            </div>

                                            <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    <span>{session.ipAddress}</span>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <Clock className="h-4 w-4" />
                                                    <span>Last active: {formatDate(session.lastActive)}</span>
                                                </div>
                                            </div>

                                            {session.location && (
                                                <div className="text-sm text-muted-foreground">
                                                    <Globe className="h-4 w-4 inline mr-1" />
                                                    {[session.location.city, session.location.country].filter(Boolean).join(', ')}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {!session.isCurrent && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleRevokeSession(session._id)}
                                            disabled={revoking === session._id}
                                            className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                        >
                                            {revoking === session._id ? (
                                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-destructive border-t-transparent" />
                                            ) : (
                                                <>
                                                    <LogOut className="h-4 w-4 mr-2" />
                                                    Revoke
                                                </>
                                            )}
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}

                {sessions.length >= 2 && (
                    <div className="mt-6 p-4 rounded-xl bg-amber-500/10 border border-amber-500/30">
                        <div className="flex items-start gap-3">
                            <AlertTriangle className="h-5 w-5 text-amber-500 flex-shrink-0 mt-0.5" />
                            <div className="text-sm">
                                <p className="font-medium text-amber-700 dark:text-amber-400">
                                    Maximum sessions reached
                                </p>
                                <p className="text-amber-600/80 dark:text-amber-500/80 mt-1">
                                    You have reached the maximum of 2 concurrent sessions. Logging in from another device will automatically revoke the oldest session.
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
};

export default ActiveSessions;
