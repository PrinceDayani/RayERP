'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { SkillGapAnalysis, SkillLevel } from '@/types/resource';
import { AlertTriangle, TrendingUp, CheckCircle, Target } from 'lucide-react';

interface SkillGapAnalysisViewProps {
  gapAnalysis: SkillGapAnalysis[];
}

const getSkillLevelColor = (level: SkillLevel) => {
  switch (level) {
    case 'Beginner': return 'bg-red-100 text-red-800 border-red-200';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Advanced': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Expert': return 'bg-green-100 text-green-800 border-green-200';
  }
};

const getSkillLevelValue = (level: SkillLevel) => {
  switch (level) {
    case 'Beginner': return 1;
    case 'Intermediate': return 2;
    case 'Advanced': return 3;
    case 'Expert': return 4;
  }
};

export default function SkillGapAnalysisView({ gapAnalysis }: SkillGapAnalysisViewProps) {
  // Calculate team-wide statistics
  const teamStats = gapAnalysis.reduce((acc, emp) => {
    acc.totalMissingSkills += emp.missingSkills.length;
    acc.totalWeakSkills += emp.weakSkills.length;
    acc.totalStrongSkills += emp.strongSkills.length;
    return acc;
  }, { totalMissingSkills: 0, totalWeakSkills: 0, totalStrongSkills: 0 });

  const totalEmployees = gapAnalysis.length;
  const avgMissingSkills = totalEmployees > 0 ? teamStats.totalMissingSkills / totalEmployees : 0;
  const avgWeakSkills = totalEmployees > 0 ? teamStats.totalWeakSkills / totalEmployees : 0;
  const avgStrongSkills = totalEmployees > 0 ? teamStats.totalStrongSkills / totalEmployees : 0;

  // Find most common missing skills
  const missingSkillsCount = gapAnalysis.reduce((acc, emp) => {
    emp.missingSkills.forEach(skill => {
      acc[skill] = (acc[skill] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topMissingSkills = Object.entries(missingSkillsCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count, percentage: (count / totalEmployees) * 100 }));

  return (
    <div className="space-y-6">
      {/* Team Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <Target className="h-8 w-8 text-blue-600" />
              <div>
                <p className="text-2xl font-bold">{totalEmployees}</p>
                <p className="text-xs text-muted-foreground">Employees Analyzed</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-8 w-8 text-red-600" />
              <div>
                <p className="text-2xl font-bold">{avgMissingSkills.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Missing Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <TrendingUp className="h-8 w-8 text-yellow-600" />
              <div>
                <p className="text-2xl font-bold">{avgWeakSkills.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Weak Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2">
              <CheckCircle className="h-8 w-8 text-green-600" />
              <div>
                <p className="text-2xl font-bold">{avgStrongSkills.toFixed(1)}</p>
                <p className="text-xs text-muted-foreground">Avg Strong Skills</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Missing Skills */}
      <Card>
        <CardHeader>
          <CardTitle>Most Common Missing Skills</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topMissingSkills.map(({ skill, count, percentage }) => (
              <div key={skill} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-medium">{skill}</span>
                  <span className="text-sm text-muted-foreground">
                    {count} employees ({percentage.toFixed(1)}%)
                  </span>
                </div>
                <Progress value={percentage} className="h-2" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Individual Employee Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Individual Skill Gap Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {gapAnalysis.map((emp) => (
              <div key={emp.employee._id} className="border rounded-lg p-4 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{emp.employee.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {emp.employee.position}
                      {emp.employee.department && ` • ${emp.employee.department}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Badge variant="destructive" className="text-xs">
                      {emp.missingSkills.length} Missing
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {emp.weakSkills.length} Weak
                    </Badge>
                    <Badge variant="default" className="text-xs">
                      {emp.strongSkills.length} Strong
                    </Badge>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Missing Skills */}
                  <div>
                    <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4" />
                      Missing Skills
                    </h4>
                    <div className="space-y-1">
                      {emp.missingSkills.length > 0 ? (
                        emp.missingSkills.map((skill) => (
                          <Badge key={skill} variant="destructive" className="text-xs mr-1 mb-1">
                            {skill}
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No missing skills</p>
                      )}
                    </div>
                  </div>

                  {/* Weak Skills */}
                  <div>
                    <h4 className="font-medium text-yellow-700 mb-2 flex items-center gap-2">
                      <TrendingUp className="w-4 h-4" />
                      Skills to Improve
                    </h4>
                    <div className="space-y-2">
                      {emp.weakSkills.length > 0 ? (
                        emp.weakSkills.map((skill) => (
                          <div key={skill.skill} className="flex items-center justify-between">
                            <span className="text-sm">{skill.skill}</span>
                            <div className="flex gap-1">
                              <Badge variant="outline" className={getSkillLevelColor(skill.currentLevel)}>
                                {skill.currentLevel}
                              </Badge>
                              <span className="text-xs text-muted-foreground">→</span>
                              <Badge variant="outline" className={getSkillLevelColor(skill.requiredLevel)}>
                                {skill.requiredLevel}
                              </Badge>
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No weak skills</p>
                      )}
                    </div>
                  </div>

                  {/* Strong Skills */}
                  <div>
                    <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
                      <CheckCircle className="w-4 h-4" />
                      Strong Skills
                    </h4>
                    <div className="space-y-1">
                      {emp.strongSkills.length > 0 ? (
                        emp.strongSkills.map((skill) => (
                          <Badge 
                            key={skill.skill} 
                            variant="outline" 
                            className={`${getSkillLevelColor(skill.level)} text-xs mr-1 mb-1`}
                          >
                            {skill.skill} ({skill.level})
                          </Badge>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground">No strong skills identified</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Skill Development Priority */}
                <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                  <h5 className="font-medium mb-2">Development Priority</h5>
                  <div className="flex flex-wrap gap-2">
                    {emp.weakSkills
                      .sort((a, b) => getSkillLevelValue(b.requiredLevel) - getSkillLevelValue(a.requiredLevel))
                      .slice(0, 3)
                      .map((skill) => (
                        <Badge key={skill.skill} variant="secondary" className="text-xs">
                          {skill.skill} (Priority: {skill.requiredLevel})
                        </Badge>
                      ))}
                    {emp.missingSkills.slice(0, 2).map((skill) => (
                      <Badge key={skill} variant="destructive" className="text-xs">
                        {skill} (Critical)
                      </Badge>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}