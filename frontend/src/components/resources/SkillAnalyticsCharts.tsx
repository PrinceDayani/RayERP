'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SkillDistribution } from '@/types/resource';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';

interface SkillAnalyticsChartsProps {
  distribution: SkillDistribution[];
}

const COLORS = {
  Beginner: '#ef4444',
  Intermediate: '#f59e0b', 
  Advanced: '#3b82f6',
  Expert: '#10b981'
};

const RADIAN = Math.PI / 180;
const renderCustomizedLabel = ({ cx, cy, midAngle, innerRadius, outerRadius, percent }: any) => {
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);

  return (
    <text x={x} y={y} fill="white" textAnchor={x > cx ? 'start' : 'end'} dominantBaseline="central" fontSize={12}>
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

export default function SkillAnalyticsCharts({ distribution }: SkillAnalyticsChartsProps) {
  // Filter and sanitize data to prevent null/undefined values
  const validDistribution = distribution.filter(skill => 
    skill && skill.skill && skill.levels && skill.totalEmployees > 0
  );

  // Prepare data for different chart types with guaranteed unique keys
  const skillLevelData = validDistribution.map((skill, index) => {
    const skillName = skill.skill || `Unknown-${index}`;
    const sanitizedSkillName = skillName.replace(/[^a-zA-Z0-9]/g, '-').toLowerCase();
    return {
      skill: skillName,
      Beginner: Math.max(0, skill.levels.Beginner || 0),
      Intermediate: Math.max(0, skill.levels.Intermediate || 0),
      Advanced: Math.max(0, skill.levels.Advanced || 0),
      Expert: Math.max(0, skill.levels.Expert || 0),
      total: Math.max(1, skill.totalEmployees || 1),
      uniqueId: `skill-level-${index}-${sanitizedSkillName}`
    };
  });

  const overallDistribution = validDistribution.reduce((acc, skill) => {
    acc.Beginner += Math.max(0, skill.levels.Beginner || 0);
    acc.Intermediate += Math.max(0, skill.levels.Intermediate || 0);
    acc.Advanced += Math.max(0, skill.levels.Advanced || 0);
    acc.Expert += Math.max(0, skill.levels.Expert || 0);
    return acc;
  }, { Beginner: 0, Intermediate: 0, Advanced: 0, Expert: 0 });

  const pieData = Object.entries(overallDistribution)
    .filter(([, count]) => count > 0)
    .map(([level, count], index) => ({
      name: level,
      value: count,
      color: COLORS[level as keyof typeof COLORS],
      uniqueId: `pie-${level}-${index}`
    }));

  const topSkills = validDistribution
    .sort((a, b) => (b.totalEmployees || 0) - (a.totalEmployees || 0))
    .slice(0, 10)
    .map((skill, index) => ({
      skill: skill.skill || `Unknown-${index}`,
      employees: Math.max(1, skill.totalEmployees || 1),
      expertLevel: (skill.levels.Expert || 0) + (skill.levels.Advanced || 0),
      uniqueId: `top-skill-${index}-${skill.skill?.replace(/\s+/g, '-') || 'unknown'}`
    }));

  const skillStrengthData = validDistribution
    .map((skill, index) => {
      const total = Math.max(1, skill.totalEmployees || 1);
      const advanced = skill.levels.Advanced || 0;
      const expert = skill.levels.Expert || 0;
      return {
        skill: skill.skill || `Unknown-${index}`,
        strength: Math.min(100, Math.max(0, ((advanced * 2 + expert * 3) / (total * 3)) * 100)),
        uniqueId: `strength-${index}-${skill.skill?.replace(/\s+/g, '-') || 'unknown'}`
      };
    })
    .filter(item => item.strength > 0)
    .sort((a, b) => b.strength - a.strength)
    .slice(0, 8);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Overall Skill Level Distribution */}
      <Card>
        <CardHeader>
          <CardTitle>Overall Skill Level Distribution</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={pieData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={renderCustomizedLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {pieData.map((entry, index) => (
                  <Cell key={`cell-${entry.uniqueId}-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex justify-center gap-4 mt-4">
            {Object.entries(COLORS).map(([level, color]) => (
              <div key={level} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }} />
                <span className="text-sm">{level}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Skills by Employee Count */}
      <Card>
        <CardHeader>
          <CardTitle>Top Skills by Team Coverage</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={topSkills} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" />
              <YAxis dataKey="skill" type="category" width={80} />
              <Tooltip />
              <Bar 
                dataKey="employees" 
                fill="#3b82f6"
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Skill Level Distribution by Skill */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Skill Level Distribution by Skill</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={skillLevelData.slice(0, 10)}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="skill" angle={-45} textAnchor="end" height={100} />
              <YAxis />
              <Tooltip />
              <Bar 
                dataKey="Beginner" 
                stackId="a" 
                fill={COLORS.Beginner}
              />
              <Bar 
                dataKey="Intermediate" 
                stackId="a" 
                fill={COLORS.Intermediate}
              />
              <Bar 
                dataKey="Advanced" 
                stackId="a" 
                fill={COLORS.Advanced}
              />
              <Bar 
                dataKey="Expert" 
                stackId="a" 
                fill={COLORS.Expert}
              />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Team Skill Strength Radar */}
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Team Skill Strength Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={400}>
            <RadarChart data={skillStrengthData}>
              <PolarGrid />
              <PolarAngleAxis dataKey="skill" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar
                name="Skill Strength %"
                dataKey="strength"
                stroke="#3b82f6"
                fill="#3b82f6"
                fillOpacity={0.3}
              />
              <Tooltip formatter={(value: number) => [`${value.toFixed(1)}%`, 'Skill Strength']} />
            </RadarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}