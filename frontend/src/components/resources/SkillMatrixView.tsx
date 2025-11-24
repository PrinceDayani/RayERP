'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkillMatrix } from '@/types/resource';
import { Check, X } from 'lucide-react';

interface SkillMatrixViewProps {
  matrix: SkillMatrix[];
  allSkills: string[];
}

export default function SkillMatrixView({ matrix, allSkills }: SkillMatrixViewProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Team Skill Matrix</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border p-2 text-left">Employee</th>
                {allSkills.map((skill) => (
                  <th key={skill} className="border p-2 text-center text-sm">{skill}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {matrix.map((row) => (
                <tr key={row.employee._id}>
                  <td className="border p-2">
                    <div>
                      <div className="font-medium">{row.employee.name}</div>
                      <div className="text-xs text-muted-foreground">{row.employee.position}</div>
                    </div>
                  </td>
                  {row.skills.map((skillData) => (
                    <td key={skillData.skill} className="border p-2 text-center">
                      {skillData.level ? (
                        <Check className="w-5 h-5 text-green-600 mx-auto" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 mx-auto" />
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}
