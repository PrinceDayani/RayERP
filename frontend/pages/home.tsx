import { useEffect, useState } from "react";
import { fetchData } from "../utils/api";
import dynamic from 'next/dynamic';

// Import components with dynamic import to prevent server-side rendering
const Navbar = dynamic(() => import("@/components/Navbar"), { ssr: false });

// Changed to a named export
export function Home() {
  const [data, setData] = useState<string>("Loading...");

  useEffect(() => {
    fetchData("/")
      .then((res) => setData(res || "Error fetching data"))
      .catch(() => setData("Server Error"));
  }, []);

  return <h1>{data}</h1>;
}

// Keep this as the default export
export default function Dashboard() {
  return (
    <div className="flex">
      {/* Sidebar - Now dynamically imported */}

      {/* Main Content */}
      <div className="flex-1 min-h-screen bg-theme-primary">
        <Navbar toggleSidebar={function (): void {
          throw new Error("Function not implemented.");
        }} isMobile={false} />
        <div className="p-6">
          <h1 className="text-3xl font-bold text-theme-heading">Welcome to ERP Dashboard</h1>
          <p className="mt-2 text-theme-secondary">
            Manage users, reports, and settings easily.
          </p>
        </div>
      </div>
    </div>
  );
}