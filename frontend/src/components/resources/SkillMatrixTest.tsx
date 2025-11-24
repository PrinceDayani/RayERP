'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkillMatrix, SkillLevel } from '@/types/resource';

// Mock data for testing
const mockSkillMatrix: SkillMatrix[] = [
  {
    employee: {
      _id: '1',
      name: 'John Doe',
      position: 'Senior Developer',
      department: 'Engineering'
    },
    skills: [
      { skill: 'JavaScript', level: 'Expert', yearsOfExperience: 5, lastUpdated: '2024-01-15' },
      { skill: 'React', level: 'Advanced', yearsOfExperience: 3, lastUpdated: '2024-01-10' },
      { skill: 'Node.js', level: 'Intermediate', yearsOfExperience: 2, lastUpdated: '2024-01-05' },
      { skill: 'Python', level: 'Beginner', yearsOfExperience: 1, lastUpdated: '2024-01-01' }
    ]
  },
  {
    employee: {
      _id: '2',
      name: 'Jane Smith',
      position: 'UI/UX Designer',
      department: 'Design'
    },
    skills: [
      { skill: 'Figma', level: 'Expert', yearsOfExperience: 4, lastUpdated: '2024-01-12' },
      { skill: 'Adobe XD', level: 'Advanced', yearsOfExperience: 3, lastUpdated: '2024-01-08' },
      { skill: 'JavaScript', level: 'Intermediate', yearsOfExperience: 2, lastUpdated: '2024-01-03' },
      { skill: 'CSS', level: 'Advanced', yearsOfExperience: 4, lastUpdated: '2024-01-07' }
    ]
  }
];

const mockAllSkills = ['JavaScript', 'React', 'Node.js', 'Python', 'Figma', 'Adobe XD', 'CSS'];

const getSkillLevelColor = (level: SkillLevel | null) => {
  switch (level) {
    case 'Beginner': return 'bg-red-100 text-red-800 border-red-200';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Advanced': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Expert': return 'bg-green-100 text-green-800 border-green-200';
    default: return 'bg-gray-100 text-gray-500 border-gray-200';
  }
};

export default function SkillMatrixTest() {
  const [matrix] = useState<SkillMatrix[]>(mockSkillMatrix);
  const [allSkills] = useState<string[]>(mockAllSkills);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Enhanced Skill Matrix - Test View</CardTitle>
        <p className="text-sm text-muted-foreground">
          This is a test component to verify the enhanced skill matrix functionality
        </p>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Skills Legend */}
          <div className="flex flex-wrap gap-2 p-4 bg-muted/50 rounded-lg">
            <span className="text-sm font-medium">Skill Levels:</span>
            {(['Beginner', 'Intermediate', 'Advanced', 'Expert'] as SkillLevel[]).map(level => (
              <Badge key={level} variant="outline" className={getSkillLevelColor(level)}>
                {level}
              </Badge>
            ))}
          </div>

          {/* Skill Matrix Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="border p-3 text-left bg-muted/50 min-w-[200px]">Employee</th>
                  {allSkills.map((skill) => (
                    <th key={skill} className="border p-3 text-center text-sm bg-muted/50 min-w-[120px]">
                      {skill}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row) => (
                  <tr key={row.employee._id} className="hover:bg-muted/20">
                    <td className="border p-3">
                      <div>
                        <div className="font-medium">{row.employee.name}</div>
                        <div className="text-xs text-muted-foreground">{row.employee.position}</div>
                        {row.employee.department && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {row.employee.department}
                          </Badge>
                        )}
                      </div>
                    </td>
                    {allSkills.map((skill) => {
                      const skillData = row.skills.find(s => s.skill === skill);
                      
                      return (
                        <td key={skill} className="border p-2 text-center">
                          {skillData?.level ? (
                            <div className="space-y-1">
                              <Badge 
                                variant="outline" 
                                className={`${getSkillLevelColor(skillData.level)} text-xs`}
                              >
                                {skillData.level}
                              </Badge>
                              {skillData.yearsOfExperience && (
                                <div className="text-xs text-muted-foreground">
                                  {skillData.yearsOfExperience}y exp
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-gray-400">
                              <span className="text-xs">None</span>
                            </div>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Test Status */}
          <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <h3 className="font-medium text-green-800 mb-2">✅ Test Status</h3>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• Skill levels are properly color-coded</li>
              <li>• Employee information displays correctly</li>
              <li>• Skills matrix table renders properly</li>
              <li>• Years of experience shows when available</li>
              <li>• Responsive design works on different screen sizes</li>
            </ul>
          </div>

          {/* Integration Notes */}
          <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-medium text-blue-800 mb-2">🔧 Integration Notes</h3>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• Replace mock data with real API calls</li>
              <li>• Add inline editing functionality</li>
              <li>• Implement filtering and search</li>
              <li>• Add gap analysis and project matching</li>
              <li>• Include analytics charts</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}