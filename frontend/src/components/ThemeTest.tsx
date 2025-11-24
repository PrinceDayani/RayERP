"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Sun, Moon, Monitor, Palette, Check } from "lucide-react";

export function ThemeTest() {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 animate-pulse" />
            Loading Theme Test...
          </CardTitle>
        </CardHeader>
      </Card>
    );
  }

  const themes = [
    { key: 'light', label: 'Light', icon: Sun, color: 'text-yellow-500' },
    { key: 'dark', label: 'Dark', icon: Moon, color: 'text-blue-400' },
    { key: 'system', label: 'System', icon: Monitor, color: 'text-gray-500' }
  ];

  return (
    <Card className="w-full max-w-md glass-morphism">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Theme Test
        </CardTitle>
        <CardDescription>
          Test theme switching functionality
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div>
            <span className="font-medium">Current Theme:</span>
            <Badge variant="outline" className="ml-2">
              {theme}
            </Badge>
          </div>
          <div>
            <span className="font-medium">Resolved:</span>
            <Badge variant="outline" className="ml-2">
              {resolvedTheme}
            </Badge>
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Quick Switch:</p>
          <div className="flex gap-2">
            {themes.map(({ key, label, icon: Icon, color }) => (
              <Button
                key={key}
                variant={theme === key ? "default" : "outline"}
                size="sm"
                onClick={() => setTheme(key)}
                className="flex items-center gap-2 transition-all duration-300"
              >
                <Icon className={`h-4 w-4 ${color}`} />
                {label}
                {theme === key && <Check className="h-3 w-3" />}
              </Button>
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <p className="text-sm font-medium">Theme Colors Preview:</p>
          <div className="grid grid-cols-4 gap-2">
            <div className="h-8 bg-background border border-border rounded flex items-center justify-center text-xs">
              BG
            </div>
            <div className="h-8 bg-card border border-border rounded flex items-center justify-center text-xs">
              Card
            </div>
            <div className="h-8 bg-primary text-primary-foreground rounded flex items-center justify-center text-xs">
              Primary
            </div>
            <div className="h-8 bg-secondary text-secondary-foreground rounded flex items-center justify-center text-xs">
              Secondary
            </div>
          </div>
        </div>

        <div className="text-xs text-muted-foreground space-y-1">
          <p>• Theme should switch immediately</p>
          <p>• Colors should update smoothly</p>
          <p>• System theme follows OS preference</p>
        </div>
      </CardContent>
    </Card>
  );
}
