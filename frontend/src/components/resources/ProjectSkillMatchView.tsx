'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ProjectSkillMatch, SkillLevel } from '@/types/resource';
import { User, Target, CheckCircle, AlertCircle, TrendingUp } from 'lucide-react';

interface ProjectSkillMatchViewProps {
  matches: ProjectSkillMatch[];
}

const getSkillLevelColor = (level: SkillLevel) => {
  switch (level) {
    case 'Beginner': return 'bg-red-100 text-red-800 border-red-200';
    case 'Intermediate': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'Advanced': return 'bg-blue-100 text-blue-800 border-blue-200';
    case 'Expert': return 'bg-green-100 text-green-800 border-green-200';
  }
};

const getMatchColor = (percentage: number) => {
  if (percentage >= 80) return 'text-green-600';
  if (percentage >= 60) return 'text-blue-600';
  if (percentage >= 40) return 'text-yellow-600';
  return 'text-red-600';
};

const getMatchBadgeVariant = (percentage: number) => {
  if (percentage >= 80) return 'default';
  if (percentage >= 60) return 'secondary';
  if (percentage >= 40) return 'outline';
  return 'destructive';
};

const EmployeeMatchCard = ({ match }: { match: ProjectSkillMatch }) => (
  <div className="border rounded-lg p-4 space-y-4">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-3">
        <User className="w-8 h-8 text-muted-foreground" />
        <div>
          <h3 className="font-semibold">{match.employee.name}</h3>
          <p className="text-sm text-muted-foreground">{match.employee.position}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="text-right">
          <div className={`text-2xl font-bold ${getMatchColor(match.matchPercentage)}`}>
            {match.matchPercentage.toFixed(0)}%
          </div>
          <div className="text-xs text-muted-foreground">Match Score</div>
        </div>
        <Badge variant={getMatchBadgeVariant(match.matchPercentage)}>
          {match.matchPercentage >= 80 ? 'Excellent' :
           match.matchPercentage >= 60 ? 'Good' :
           match.matchPercentage >= 40 ? 'Fair' : 'Poor'}
        </Badge>
      </div>
    </div>

    <div className="space-y-2">
      <div className="flex justify-between text-sm">
        <span>Project Skill Match</span>
        <span>{match.matchPercentage.toFixed(1)}%</span>
      </div>
      <Progress value={match.matchPercentage} className="h-3" />
    </div>

    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div>
        <h4 className="font-medium text-green-700 mb-2 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          Matched Skills ({match.matchedSkills.length})
        </h4>
        <div className="space-y-2 max-h-32 overflow-y-auto">
          {match.matchedSkills.length > 0 ? (
            match.matchedSkills.map((skill) => (
              <div key={skill.skill} className="flex items-center justify-between text-sm">
                <span>{skill.skill}</span>
                <div className="flex gap-1 items-center">
                  <Badge variant="outline" className={getSkillLevelColor(skill.level)}>
                    {skill.level}
                  </Badge>
                  {skill.level !== skill.required && (
                    <>
                      <span className="text-xs text-muted-foreground">vs</span>
                      <Badge variant="outline" className={getSkillLevelColor(skill.required)}>
                        {skill.required}
                      </Badge>
                    </>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No matched skills</p>
          )}
        </div>
      </div>

      <div>
        <h4 className="font-medium text-red-700 mb-2 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          Missing Skills ({match.missingSkills.length})
        </h4>
        <div className="space-y-1 max-h-32 overflow-y-auto">
          {match.missingSkills.length > 0 ? (
            match.missingSkills.map((skill) => (
              <Badge key={skill} variant="destructive" className="text-xs mr-1 mb-1">
                {skill}
              </Badge>
            ))
          ) : (
            <p className="text-sm text-muted-foreground">No missing skills</p>
          )}
        </div>
      </div>
    </div>

    <div className="mt-4 p-3 bg-muted/50 rounded-lg">
      <h5 className="font-medium mb-1">Recommendation</h5>
      <p className="text-sm text-muted-foreground">
        {match.matchPercentage >= 80 
          ? "Excellent fit for this project. Can be assigned immediately."
          : match.matchPercentage >= 60
          ? "Good fit with minor skill gaps. Consider for assignment with some training."
          : match.matchPercentage >= 40
          ? "Fair match. Requires training in missing skills before assignment."
          : "Poor match. Significant training required or consider alternative resources."
        }
      </p>
    </div>
  </div>
);

export default function ProjectSkillMatchView({ matches }: ProjectSkillMatchViewProps) {
  // Filter employees based on skill matching
  const exactMatches = matches.filter(match => match.matchPercentage >= 80);
  const similarMatches = matches.filter(match => match.matchPercentage >= 40 && match.matchPercentage < 80);
  
  // Sort each group by match percentage
  const sortedExactMatches = [...exactMatches].sort((a, b) => b.matchPercentage - a.matchPercentage);
  const sortedSimilarMatches = [...similarMatches].sort((a, b) => b.matchPercentage - a.matchPercentage);

  // Calculate team statistics for visible employees only
  const visibleMatches = [...exactMatches, ...similarMatches];
  const teamStats = {
    averageMatch: visibleMatches.length > 0 ? visibleMatches.reduce((sum, match) => sum + match.matchPercentage, 0) / visibleMatches.length : 0,
    perfectMatches: visibleMatches.filter(match => match.matchPercentage === 100).length,
    goodMatches: visibleMatches.filter(match => match.matchPercentage >= 80).length,
    poorMatches: visibleMatches.filter(match => match.matchPercentage < 40).length
  };

  // Find most common missing skills from visible employees
  const missingSkillsCount = visibleMatches.reduce((acc, match) => {
    match.missingSkills.forEach(skill => {
      acc[skill] = (acc[skill] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topMissingSkills = Object.entries(missingSkillsCount)
    .sort(([,a], [,b]) => b - a)
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count, percentage: visibleMatches.length > 0 ? (count / visibleMatches.length) * 100 : 0 }));

  return (
    <div className="space-y-6">
      {/* Team Match Overview - Only show if there are visible matches */}
      {visibleMatches.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <Target className="h-8 w-8 text-blue-600" />
                <div>
                  <p className="text-2xl font-bold">{teamStats.averageMatch.toFixed(1)}%</p>
                  <p className="text-xs text-muted-foreground">Average Match</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <CheckCircle className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold">{teamStats.goodMatches}</p>
                  <p className="text-xs text-muted-foreground">Good Matches (80%+)</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <TrendingUp className="h-8 w-8 text-yellow-600" />
                <div>
                  <p className="text-2xl font-bold">{teamStats.perfectMatches}</p>
                  <p className="text-xs text-muted-foreground">Perfect Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center space-x-2">
                <AlertCircle className="h-8 w-8 text-red-600" />
                <div>
                  <p className="text-2xl font-bold">{sortedSimilarMatches.length}</p>
                  <p className="text-xs text-muted-foreground">Similar Matches</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Most Common Missing Skills - Only show if there are visible matches */}
      {topMissingSkills.length > 0 && visibleMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Skills Gap for This Project</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {topMissingSkills.map(({ skill, count, percentage }) => (
                <div key={skill} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{skill}</span>
                    <span className="text-sm text-muted-foreground">
                      {count} employees missing ({percentage.toFixed(1)}%)
                    </span>
                  </div>
                  <Progress value={percentage} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exact Skill Match Section */}
      {sortedExactMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              Exact Skill Match ({sortedExactMatches.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedExactMatches.map((match) => (
                <EmployeeMatchCard key={match.employee._id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Similar Skill Match Section */}
      {sortedSimilarMatches.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-blue-600" />
              Similar Skill Suggestions ({sortedSimilarMatches.length})
            </CardTitle>
            <p className="text-sm text-muted-foreground mt-1">
              Exact skills not matched, but these employees have similar skills and can work on this project.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {sortedSimilarMatches.map((match) => (
                <EmployeeMatchCard key={match.employee._id} match={match} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Match Messages */}
      {sortedExactMatches.length === 0 && sortedSimilarMatches.length === 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No employees with exact skill match.</h3>
              <p className="text-muted-foreground">
                No employees found with skills matching this project's requirements.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {sortedExactMatches.length === 0 && sortedSimilarMatches.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-yellow-800">
              <AlertCircle className="w-5 h-5" />
              <span className="font-medium">No employees with exact skill match.</span>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}