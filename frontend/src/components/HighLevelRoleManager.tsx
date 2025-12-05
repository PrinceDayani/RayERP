"use client";

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/components/ui/use-toast";
import { Shield, Minus, Users } from "lucide-react";

export default function HighLevelRoleManager({ userLevel }: { userLevel: number }) {
  const [roles, setRoles] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [selectedRole, setSelectedRole] = useState<any>(null);
  const [permissionsToRemove, setPermissionsToRemove] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [reduceDialog, setReduceDialog] = useState(false);

  useEffect(() => {
    if (userLevel > 80) {
      fetchHighLevelRoles();
      fetchHighLevelUsers();
    }
  }, [userLevel]);

  const fetchHighLevelRoles = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rbac/roles`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      setRoles(data.filter((r: any) => r.level > 80));
    } catch (err) {
      console.error('Failed to fetch roles:', err);
    }
  };

  const fetchHighLevelUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rbac/users/by-level?minLevel=80`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth-token')}` }
      });
      const data = await res.json();
      if (data.success) setUsers(data.users);
    } catch (err) {
      console.error('Failed to fetch users:', err);
    }
  };

  const handleReducePermissions = async () => {
    if (!selectedRole || permissionsToRemove.length === 0) return;
    setLoading(true);

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/rbac/roles/${selectedRole._id}/reduce-permissions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth-token')}`
        },
        body: JSON.stringify({ permissionsToRemove })
      });

      const data = await res.json();

      if (res.ok) {
        toast({ title: "Success", description: `Removed ${data.removedCount} permissions` });
        setReduceDialog(false);
        setPermissionsToRemove([]);
        fetchHighLevelRoles();
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  if (userLevel <= 80) {
    return (
      <div className="text-center py-8 bg-muted/20 rounded-lg border">
        <Shield className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
        <p className="text-muted-foreground">Requires level &gt; 80</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-bold">High-Level Role Management</h3>
          <p className="text-sm text-muted-foreground">Manage roles with level &gt; 80</p>
        </div>
        <Badge variant="outline" className="bg-purple-100 text-purple-800">
          Your Level: {userLevel}
        </Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Shield className="h-4 w-4" />
              High-Level Roles ({roles.length})
            </h4>
          </div>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Level</TableHead>
                <TableHead>Permissions</TableHead>
                <TableHead>Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role._id}>
                  <TableCell className="font-medium">{role.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{role.level}</Badge>
                  </TableCell>
                  <TableCell>{role.permissions?.length || 0}</TableCell>
                  <TableCell>
                    {role.name !== 'Root' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => {
                          setSelectedRole(role);
                          setPermissionsToRemove([]);
                          setReduceDialog(true);
                        }}
                      >
                        <Minus className="h-3 w-3 mr-1" />
                        Reduce
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        <div className="bg-white rounded-lg border p-4">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold flex items-center gap-2">
              <Users className="h-4 w-4" />
              High-Level Users ({users.length})
            </h4>
          </div>
          <div className="space-y-2">
            {users.map((user) => (
              <div key={user._id} className="flex items-center justify-between p-2 border rounded">
                <div>
                  <p className="font-medium text-sm">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{user.email}</p>
                </div>
                <Badge variant="outline">{(user.role as any)?.name}</Badge>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={reduceDialog} onOpenChange={setReduceDialog}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Reduce Permissions - {selectedRole?.name}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            <p className="text-sm text-muted-foreground">
              Select permissions to remove from this role
            </p>
            {selectedRole?.permissions?.map((perm: string) => (
              <div key={perm} className="flex items-center space-x-2">
                <Checkbox
                  id={perm}
                  checked={permissionsToRemove.includes(perm)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setPermissionsToRemove([...permissionsToRemove, perm]);
                    } else {
                      setPermissionsToRemove(permissionsToRemove.filter(p => p !== perm));
                    }
                  }}
                />
                <label htmlFor={perm} className="text-sm cursor-pointer">
                  {perm}
                </label>
              </div>
            ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setReduceDialog(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleReducePermissions}
              disabled={loading || permissionsToRemove.length === 0}
              variant="destructive"
            >
              {loading ? 'Removing...' : `Remove ${permissionsToRemove.length} Permissions`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
