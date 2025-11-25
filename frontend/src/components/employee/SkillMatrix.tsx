"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Star, TrendingUp, Award, Target, Edit, Trash2 } from "lucide-react";

interface Skill {
  _id?: string;
  name: string;
  category: string;
  level: number; // 1-5 scale
  yearsExperience: number;
  certifications?: string[];
  lastAssessed?: string;
  assessedBy?: string;
}

interface SkillMatrixProps {
  employeeId: string;
  skills: Skill[];
  onSkillsUpdate: (skills: Skill[]) => void;
  editable?: boolean;
}

const skillCategories = [
  'Technical',
  'Programming',
  'Management',
  'Communication',
  'Design',
  'Analytics',
  'Marketing',
  'Sales',
  'Operations',
  'Other'
];

const skillLevels = [
  { value: 1, label: 'Beginner', color: 'bg-red-500' },
  { value: 2, label: 'Basic', color: 'bg-orange-500' },
  { value: 3, label: 'Intermediate', color: 'bg-yellow-500' },
  { value: 4, label: 'Advanced', color: 'bg-blue-500' },
  { value: 5, label: 'Expert', color: 'bg-green-500' }
];

export default function SkillMatrix({ employeeId, skills, onSkillsUpdate, editable = false }: SkillMatrixProps) {
  const [isAddSkillOpen, setIsAddSkillOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<Skill | null>(null);
  const [skillForm, setSkillForm] = useState<Skill>({
    name: '',
    category: '',
    level: 1,
    yearsExperience: 0,
    certifications: []
  });

  const groupedSkills = skills.reduce((acc, skill) => {
    if (!acc[skill.category]) {
      acc[skill.category] = [];
    }
    acc[skill.category].push(skill);
    return acc;
  }, {} as Record<string, Skill[]>);

  const getSkillLevelInfo = (level: number) => {
    return skillLevels.find(sl => sl.value === level) || skillLevels[0];
  };

  const handleAddSkill = () => {
    const newSkill = {
      ...skillForm,
      lastAssessed: new Date().toISOString(),
      assessedBy: 'Self-Assessment'
    };
    onSkillsUpdate([...skills, newSkill]);
    setSkillForm({
      name: '',
      category: '',
      level: 1,
      yearsExperience: 0,
      certifications: []
    });
    setIsAddSkillOpen(false);
  };

  const handleEditSkill = (skill: Skill) => {
    setEditingSkill(skill);
    setSkillForm(skill);
    setIsAddSkillOpen(true);
  };

  const handleUpdateSkill = () => {
    const updatedSkills = skills.map(skill => 
      skill._id === editingSkill?._id ? { ...skillForm, lastAssessed: new Date().toISOString() } : skill
    );
    onSkillsUpdate(updatedSkills);
    setEditingSkill(null);
    setSkillForm({
      name: '',
      category: '',
      level: 1,
      yearsExperience: 0,
      certifications: []
    });
    setIsAddSkillOpen(false);
  };

  const handleDeleteSkill = (skillToDelete: Skill) => {
    const updatedSkills = skills.filter(skill => skill._id !== skillToDelete._id);
    onSkillsUpdate(updatedSkills);
  };

  const getOverallSkillLevel = () => {
    if (skills.length === 0) return 0;
    const average = skills.reduce((sum, skill) => sum + skill.level, 0) / skills.length;
    return Math.round(average * 20); // Convert to percentage
  };

  const getSkillDistribution = () => {
    const distribution = skillLevels.map(level => ({
      ...level,
      count: skills.filter(skill => skill.level === level.value).length
    }));
    return distribution;
  };

  return (
    <div className="space-y-6">
      {/* Skills Overview */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Award className="w-5 h-5 text-primary" />
              Skills Matrix
            </CardTitle>
            {editable && (
              <Button onClick={() => setIsAddSkillOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Skill
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                {skills.length}
              </div>
              <p className="text-sm text-muted-foreground">Total Skills</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white text-2xl font-bold">
                {getOverallSkillLevel()}%
              </div>
              <p className="text-sm text-muted-foreground">Overall Level</p>
            </div>
            <div className="text-center">
              <div className="w-20 h-20 mx-auto mb-3 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center text-white text-2xl font-bold">
                {Object.keys(groupedSkills).length}
              </div>
              <p className="text-sm text-muted-foreground">Categories</p>
            </div>
          </div>

          {/* Skill Level Distribution */}
          <div className="mb-6">
            <h4 className="font-semibold mb-3">Skill Level Distribution</h4>
            <div className="space-y-2">
              {getSkillDistribution().map(level => (
                <div key={level.value} className="flex items-center gap-3">
                  <div className="w-20 text-sm">{level.label}</div>
                  <div className="flex-1">
                    <Progress 
                      value={skills.length > 0 ? (level.count / skills.length) * 100 : 0} 
                      className="h-2"
                    />
                  </div>
                  <div className="w-8 text-sm text-muted-foreground">{level.count}</div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Skills by Category */}
      <div className="grid gap-6">
        {Object.entries(groupedSkills).map(([category, categorySkills]) => (
          <Card key={category}>
            <CardHeader>
              <CardTitle className="text-lg">{category} Skills</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                {categorySkills.map((skill, index) => {
                  const levelInfo = getSkillLevelInfo(skill.level);
                  return (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{skill.name}</h4>
                          <Badge className={`${levelInfo.color} text-white`}>
                            {levelInfo.label}
                          </Badge>
                          <div className="flex items-center gap-1">
                            {Array.from({ length: skill.level }, (_, i) => (
                              <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                            ))}
                            {Array.from({ length: 5 - skill.level }, (_, i) => (
                              <Star key={i} className="w-4 h-4 text-gray-300" />
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <TrendingUp className="w-3 h-3" />
                            {skill.yearsExperience} years
                          </span>
                          {skill.lastAssessed && (
                            <span>
                              Last assessed: {new Date(skill.lastAssessed).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        {skill.certifications && skill.certifications.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {skill.certifications.map((cert, certIndex) => (
                              <Badge key={certIndex} variant="outline" className="text-xs">
                                <Award className="w-3 h-3 mr-1" />
                                {cert}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      {editable && (
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSkill(skill)}
                          >
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteSkill(skill)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add/Edit Skill Dialog */}
      <Dialog open={isAddSkillOpen} onOpenChange={setIsAddSkillOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingSkill ? 'Edit Skill' : 'Add New Skill'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Skill Name</Label>
              <Input
                value={skillForm.name}
                onChange={(e) => setSkillForm({ ...skillForm, name: e.target.value })}
                placeholder="e.g., React, Project Management"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select 
                value={skillForm.category} 
                onValueChange={(value) => setSkillForm({ ...skillForm, category: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {skillCategories.map(category => (
                    <SelectItem key={category} value={category}>{category}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Skill Level</Label>
              <Select 
                value={skillForm.level.toString()} 
                onValueChange={(value) => setSkillForm({ ...skillForm, level: parseInt(value) })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select level" />
                </SelectTrigger>
                <SelectContent>
                  {skillLevels.map(level => (
                    <SelectItem key={level.value} value={level.value.toString()}>
                      {level.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Years of Experience</Label>
              <Input
                type="number"
                min="0"
                max="50"
                value={skillForm.yearsExperience}
                onChange={(e) => setSkillForm({ ...skillForm, yearsExperience: parseInt(e.target.value) || 0 })}
              />
            </div>
            <div>
              <Label>Certifications (comma-separated)</Label>
              <Input
                value={skillForm.certifications?.join(', ') || ''}
                onChange={(e) => setSkillForm({ 
                  ...skillForm, 
                  certifications: e.target.value.split(',').map(cert => cert.trim()).filter(cert => cert)
                })}
                placeholder="e.g., AWS Certified, PMP"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddSkillOpen(false)}>
              Cancel
            </Button>
            <Button onClick={editingSkill ? handleUpdateSkill : handleAddSkill}>
              {editingSkill ? 'Update' : 'Add'} Skill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}