"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { CreateRoleDialog } from "./CreateRoleDialog";

export function RoleCreationDemo() {
  const [isOpen, setIsOpen] = useState(false);

  const handleRoleCreated = (role: any) => {
    console.log("Role created:", role);
    // Handle the created role here
  };

  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Role Management Demo</h1>
        <Button onClick={() => setIsOpen(true)}>
          Create New Role
        </Button>
        
        <CreateRoleDialog
          open={isOpen}
          onOpenChange={setIsOpen}
          onRoleCreated={handleRoleCreated}
        />
      </div>
    </div>
  );
}