"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Separator } from "@/components/ui/separator";
import { toast } from "@/hooks/use-toast";
import { Edit2, Save, X, Download, Camera, User, Mail, Phone, Building2, Calendar, Shield, Briefcase, MapPin } from "lucide-react";
import { PasswordChangeDialog } from "@/components/settings/PasswordChangeDialog";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

export default function ProfilePage() {
  const [profileData, setProfileData] = useState<any>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    skills: [] as string[],
    address: { street: "", city: "", state: "", zipCode: "", country: "" }
  });

  useEffect(() => {
    fetchCompleteProfile();
  }, []);

  const fetchCompleteProfile = async () => {
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`${API_URL}/api/users/profile/complete`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
        setFormData({
          name: data.user.name || "",
          phone: data.employee?.phone || "",
          skills: data.employee?.skills || [],
          address: data.employee?.address || { street: "", city: "", state: "", zipCode: "", country: "" }
        });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to load profile", variant: "destructive" });
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem("auth-token");
      const response = await fetch(`${API_URL}/api/users/profile`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify(formData)
      });
      if (response.ok) {
        toast({ title: "Success", description: "Profile updated successfully" });
        setIsEditing(false);
        fetchCompleteProfile();
      } else {
        toast({ title: "Error", description: "Failed to update profile", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error updating profile", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const token = localStorage.getItem("auth-token");
      const formData = new FormData();
      formData.append("avatar", file);
      const response = await fetch(`${API_URL}/api/users/profile/avatar`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      if (response.ok) {
        toast({ title: "Success", description: "Profile picture uploaded" });
        fetchCompleteProfile();
      } else {
        toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Error uploading image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const generateResume = () => {
    if (!profileData) return;
    const { user, employee, projects } = profileData;
    const resumeContent = `
${user.name}
${user.email} | ${employee?.phone || 'N/A'}

${'='.repeat(60)}
PROFESSIONAL SUMMARY
${'='.repeat(60)}
Position: ${employee?.position || 'Employee'}
Department: ${employee?.department || 'N/A'}
Joined: ${employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : 'N/A'}
Employee ID: ${employee?.employeeId || 'N/A'}

${'='.repeat(60)}
SKILLS
${'='.repeat(60)}
${employee?.skills?.join(', ') || 'No skills listed'}

${'='.repeat(60)}
PROJECTS (${projects?.length || 0})
${'='.repeat(60)}
${projects?.map((p: any) => `
• ${p.name}
  Status: ${p.status} | Progress: ${p.progress}%
  Duration: ${new Date(p.startDate).toLocaleDateString()} - ${new Date(p.endDate).toLocaleDateString()}
  Priority: ${p.priority}`).join('\n') || 'No projects assigned'}
    `.trim();

    const blob = new Blob([resumeContent], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${user.name.replace(/\s+/g, "_")}_Resume.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Success", description: "Resume downloaded successfully" });
  };

  const getRoleColor = (role: any) => {
    const roleName = typeof role === "string" ? role : role?.name || "";
    switch (roleName.toLowerCase()) {
      case "root": return "bg-red-500";
      case "super_admin":
      case "superadmin": return "bg-purple-500";
      case "admin": return "bg-orange-500";
      case "manager": return "bg-green-500";
      default: return "bg-blue-500";
    }
  };

  if (!profileData) return <div className="flex items-center justify-center h-screen">Loading...</div>;

  const { user, employee, projects } = profileData;

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">My Profile</h1>
          <p className="text-muted-foreground">Manage your personal information and view your work history</p>
        </div>
        <div className="flex gap-2">
          <PasswordChangeDialog />
          {employee && (
            <Button onClick={generateResume} variant="outline">
              <Download className="h-4 w-4 mr-2" />
              Download Resume
            </Button>
          )}
          {!isEditing ? (
            <Button onClick={() => setIsEditing(true)}>
              <Edit2 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          ) : (
            <>
              <Button onClick={handleSave} disabled={loading}>
                <Save className="h-4 w-4 mr-2" />
                Save
              </Button>
              <Button variant="outline" onClick={() => setIsEditing(false)}>
                <X className="h-4 w-4 mr-2" />
                Cancel
              </Button>
            </>
          )}
        </div>
      </div>

      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-6">
              <div className="relative">
                <Avatar className="h-28 w-28 border-4 border-background shadow-xl">
                  {employee?.avatarUrl ? (
                    <img src={`${API_URL}${employee.avatarUrl}`} alt="Profile" className="object-cover" />
                  ) : (
                    <AvatarFallback className={`${getRoleColor(user?.role)} text-white text-4xl font-bold`}>
                      {employee?.firstName?.charAt(0) || user?.name?.charAt(0) || "U"}
                    </AvatarFallback>
                  )}
                </Avatar>
                {isEditing && (
                  <>
                    <input type="file" id="avatar-upload" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
                    <Button
                      size="icon"
                      variant="secondary"
                      className="absolute bottom-0 right-0 h-8 w-8 rounded-full"
                      onClick={() => document.getElementById("avatar-upload")?.click()}
                      disabled={uploading}
                    >
                      <Camera className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
              <div className="space-y-2">
                <CardTitle className="text-3xl">{user?.name}</CardTitle>
                <p className="text-lg text-muted-foreground">{employee?.position || "Employee"}</p>
                <div className="flex gap-2">
                  <Badge variant="outline" className="text-sm">
                    <Shield className="h-3 w-3 mr-1" />
                    {typeof user?.role === "string" ? user.role : user?.role?.name || "user"}
                  </Badge>
                  {employee?.status && <Badge className="capitalize">{employee.status}</Badge>}
                </div>
              </div>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <User className="h-4 w-4" />
                Full Name
              </Label>
              {isEditing ? (
                <Input value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} />
              ) : (
                <p className="text-lg font-medium">{user?.name}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Mail className="h-4 w-4" />
                Email
              </Label>
              <p className="text-lg font-medium">{user?.email}</p>
            </div>

            <div className="space-y-2">
              <Label className="text-muted-foreground flex items-center gap-2">
                <Phone className="h-4 w-4" />
                Phone
              </Label>
              {isEditing ? (
                <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
              ) : (
                <p className="text-lg font-medium">{employee?.phone || "Not provided"}</p>
              )}
            </div>
          </div>

          {employee && (
            <>
              <Separator />
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Building2 className="h-4 w-4" />
                    Department
                  </Label>
                  <p className="text-lg font-medium">{employee?.department || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Briefcase className="h-4 w-4" />
                    Position
                  </Label>
                  <p className="text-lg font-medium">{employee?.position || "N/A"}</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    Hire Date
                  </Label>
                  <p className="text-lg font-medium">
                    {employee?.hireDate ? new Date(employee.hireDate).toLocaleDateString() : "N/A"}
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-muted-foreground">Employee ID</Label>
                  <p className="text-lg font-medium">{employee?.employeeId || "N/A"}</p>
                </div>
              </div>

              <Separator />
              <div className="space-y-2">
                <Label className="text-muted-foreground">Skills</Label>
                {isEditing ? (
                  <Input
                    placeholder="Enter skills separated by commas"
                    value={formData.skills.join(", ")}
                    onChange={(e) => setFormData({ ...formData, skills: e.target.value.split(",").map(s => s.trim()) })}
                  />
                ) : (
                  <div className="flex flex-wrap gap-2">
                    {employee?.skills?.length > 0 ? (
                      employee.skills.map((skill: string, idx: number) => (
                        <Badge key={idx} variant="secondary">{skill}</Badge>
                      ))
                    ) : (
                      <p className="text-muted-foreground">No skills listed</p>
                    )}
                  </div>
                )}
              </div>

              {employee?.address && (
                <>
                  <Separator />
                  <div className="space-y-4">
                    <Label className="text-muted-foreground flex items-center gap-2">
                      <MapPin className="h-4 w-4" />
                      Address
                    </Label>
                    {isEditing ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Input
                          placeholder="Street"
                          value={formData.address.street}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, street: e.target.value } })}
                        />
                        <Input
                          placeholder="City"
                          value={formData.address.city}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, city: e.target.value } })}
                        />
                        <Input
                          placeholder="State"
                          value={formData.address.state}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, state: e.target.value } })}
                        />
                        <Input
                          placeholder="Zip Code"
                          value={formData.address.zipCode}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, zipCode: e.target.value } })}
                        />
                        <Input
                          placeholder="Country"
                          value={formData.address.country}
                          onChange={(e) => setFormData({ ...formData, address: { ...formData.address, country: e.target.value } })}
                        />
                      </div>
                    ) : (
                      <p className="text-lg">
                        {[employee.address.street, employee.address.city, employee.address.state, employee.address.zipCode, employee.address.country]
                          .filter(Boolean)
                          .join(", ") || "Not provided"}
                      </p>
                    )}
                  </div>
                </>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {projects && projects.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>My Projects ({projects.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((project: any) => (
                <Card key={project._id}>
                  <CardHeader>
                    <CardTitle className="text-lg">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{project.description}</p>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Status:</span>
                      <Badge variant={project.status === "completed" ? "default" : "secondary"}>
                        {project.status}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Priority:</span>
                      <Badge variant={project.priority === "high" ? "destructive" : "outline"}>
                        {project.priority}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Progress:</span>
                      <span className="font-medium">{project.progress}%</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
