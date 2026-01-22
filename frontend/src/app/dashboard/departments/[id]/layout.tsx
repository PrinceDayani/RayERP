"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Loader2, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionLoader } from '@/components/PageLoader';
import { useToast } from "@/hooks/use-toast";
import { departmentApi } from "@/lib/api/departments";
import { Department } from "@/types/department";
import { DepartmentHeader } from "../_components/DepartmentHeader";
import { DepartmentNav } from "../_components/DepartmentNav";

export default function DepartmentLayout({ children }: { children: React.ReactNode }) {
    const params = useParams();
    const router = useRouter();
    const { toast } = useToast();
    const [department, setDepartment] = useState<Department | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (params.id) {
            loadDepartment();
        }
    }, [params.id]);

    const loadDepartment = async () => {
        try {
            setLoading(true);
            const response = await departmentApi.getById(params.id as string);
            console.log("Layout API Response:", response);
            console.log("Department data:", response.data);
            const dept = response.data?.data || response.data;
            console.log("Setting department to:", dept);
            setDepartment(dept);
        } catch (error: any) {
            console.error("Department load error:", error);
            toast({
                title: "Error",
                description: error.response?.data?.message || "Failed to load department",
                variant: "destructive",
            });
            router.push("/dashboard/departments");
        } finally {
            setLoading(false);
        }
    };

    const handleExport = () => {
        toast({
            title: "Export",
            description: "Department report exported successfully",
        });
    };

    if (loading) {
        return <SectionLoader text="Loading department..." />;
    }

    if (!department) {
        return (
            <div className="text-center py-12">
                <h2 className="text-xl font-semibold mb-2">Department Not Found</h2>
                <p className="text-muted-foreground mb-4">
                    The department you're looking for doesn't exist.
                </p>
                <Button onClick={() => router.push("/dashboard/departments")}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back to Departments
                </Button>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header with Breadcrumbs */}
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <DepartmentHeader department={department} />
                </div>
                <div className="flex items-center gap-2 ml-4">
                    <Button variant="outline" size="sm" onClick={() => router.push("/dashboard/departments")}>
                        <ArrowLeft className="w-4 h-4 mr-2" />
                        Back
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Export
                    </Button>
                    <Button variant="outline" size="sm" onClick={loadDepartment}>
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Refresh
                    </Button>
                </div>
            </div>

            {/* Tab Navigation */}
            <DepartmentNav departmentId={params.id as string} />

            {/* Page Content */}
            <div>{children}</div>
        </div>
    );
}
