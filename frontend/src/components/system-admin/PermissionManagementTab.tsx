"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Info } from "lucide-react";

export default function PermissionManagementTab() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Permission Management</CardTitle>
      </CardHeader>
      <CardContent>
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Permission management is handled through the Admin panel under Roles & Permissions.
            Navigate to Dashboard → Admin → Roles to manage permissions.
          </AlertDescription>
        </Alert>
      </CardContent>
    </Card>
  );
}
