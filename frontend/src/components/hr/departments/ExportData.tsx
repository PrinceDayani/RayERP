"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileText, FileSpreadsheet } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface ExportDataProps {
  filters?: any;
  module: string;
}

export function ExportData({ filters, module }: ExportDataProps) {
  const { toast } = useToast();
  const [format, setFormat] = useState<string>("csv");
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    try {
      setLoading(true);
      const queryParams = new URLSearchParams({
        format,
        ...(filters && { filters: JSON.stringify(filters) })
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/departments/export?${queryParams}`,
        { credentials: 'include' }
      );

      if (format === 'csv') {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${module}-${Date.now()}.csv`;
        a.click();
        toast({ title: "Success", description: "Data exported successfully" });
      } else {
        const data = await response.json();
        if (data.success) {
          toast({ title: "Success", description: "Export completed" });
        }
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to export data", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <Select value={format} onValueChange={setFormat}>
        <SelectTrigger className="w-[120px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="csv">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4" /> CSV
            </div>
          </SelectItem>
          <SelectItem value="excel">
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4" /> Excel
            </div>
          </SelectItem>
        </SelectContent>
      </Select>
      <Button onClick={handleExport} disabled={loading} variant="outline">
        <Download className="w-4 h-4 mr-2" />
        {loading ? "Exporting..." : "Export"}
      </Button>
    </div>
  );
}
