"use client";

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Banknote, Briefcase, Building2, Calendar, GraduationCap, IdCard, Landmark, Lock,
  Mail, MapPin, Phone, TrendingUp, UserCheck, Users
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import type { Compensation, BankDetails, StatutoryDetails, SalaryRevision } from '@/lib/api/employeesAPI';

interface PayrollDetailsProps {
  employeeId?: string;
  email?: string;
  phone?: string;
  status?: string;
  department?: string;
  departments?: string[];
  position?: string;
  workLocation?: string;
  projectAssignment?: string;
  reportingAuthority?: string;
  manager?: { firstName?: string; lastName?: string } | string;
  qualification?: string;
  employmentCategory?: string;
  dateOfBirth?: string;
  hireDate?: string;
  dateOfRelieving?: string;
  totalExperienceYears?: number;
  alternatePhone?: string;
  experienceInCompany?: string;
  registerSerialNo?: number;
  compensation?: Compensation;
  bankDetails?: BankDetails;
  statutory?: StatutoryDetails;
  salaryHistory?: SalaryRevision[];
}

const formatDate = (value?: string) =>
  value ? new Date(value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—';

/** "8 yrs 4 mo" between a start date and today. */
const tenure = (from?: string): string => {
  if (!from) return '—';
  const start = new Date(from);
  if (isNaN(start.getTime())) return '—';
  const now = new Date();
  const months = Math.max(0, (now.getFullYear() - start.getFullYear()) * 12 + (now.getMonth() - start.getMonth()));
  return `${Math.floor(months / 12)} yrs ${months % 12} mo`;
};

const Field = ({ icon, label, value }: { icon: React.ReactNode; label: string; value?: React.ReactNode }) => (
  <div className="flex items-start justify-between gap-4 p-3 rounded-lg bg-muted/50">
    <div className="flex items-center gap-2 shrink-0">
      {icon}
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
    <span className="font-medium text-sm text-right break-words">{value || '—'}</span>
  </div>
);

const Restricted = ({ title, permission }: { title: string; permission: string }) => (
  <Card className="border-l-4 border-l-red-500">
    <CardContent className="p-6">
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-xl bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
          <Lock className="w-6 h-6 text-red-600 dark:text-red-400" />
        </div>
        <div>
          <p className="font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">Access Restricted</p>
          <Badge variant="destructive" className="mt-2">Requires: {permission}</Badge>
        </div>
      </div>
    </CardContent>
  </Card>
);

export default function PayrollDetails({
  employeeId,
  email,
  phone,
  status,
  department,
  departments,
  position,
  workLocation,
  projectAssignment,
  reportingAuthority,
  manager,
  qualification,
  employmentCategory,
  dateOfBirth,
  hireDate,
  dateOfRelieving,
  totalExperienceYears,
  alternatePhone,
  experienceInCompany,
  registerSerialNo,
  compensation,
  bankDetails,
  statutory,
  salaryHistory
}: PayrollDetailsProps) {
  const { hasPermission } = useAuth();
  const { formatCurrency } = useCurrency();

  const canViewSalary = hasPermission('employees.view_salary');
  const canViewBank = hasPermission('employees.view_bank_details');

  const amount = (value?: number) => (value == null ? '—' : formatCurrency(value, 'INR'));

  const managerName =
    typeof manager === 'object' && manager
      ? `${manager.firstName ?? ''} ${manager.lastName ?? ''}`.trim()
      : undefined;

  // Always listed, including the ones recorded as zero or left blank — a
  // missing PF line reads as "not shown", not as "nothing was deducted".
  const deductions = [
    { label: 'TDS', value: compensation?.tds },
    { label: 'Provident Fund (PF)', value: compensation?.providentFund },
    { label: 'Professional Tax', value: compensation?.professionalTax },
    { label: 'ESIC', value: compensation?.esic }
  ];

  const totalDeductions = deductions.reduce((sum, d) => sum + (d.value ?? 0), 0);
  // Oldest first so each row can be compared with the month before it, then
  // reversed for display with the most recent period at the top.
  const chronological = [...(salaryHistory ?? [])].sort(
    (a, b) => new Date(a.effectiveFrom).getTime() - new Date(b.effectiveFrom).getTime()
  );
  const history = chronological
    .map((rev, index) => ({
      ...rev,
      change: index === 0 ? null : rev.monthlyGross - chronological[index - 1].monthlyGross
    }))
    .reverse();

  return (
    <div className="space-y-6">
      {/* Identity — repeated here so this tab is a complete record on its own */}
      <Card className="card-modern">
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center gap-2">
            <IdCard className="w-5 h-5 text-primary" /> Identity &amp; Employment
          </CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field icon={<IdCard className="w-4 h-4 text-muted-foreground" />} label="Employee ID" value={employeeId} />
          <Field
            icon={<UserCheck className="w-4 h-4 text-green-600" />}
            label="Status"
            value={status ? <Badge variant={status === 'active' ? 'default' : 'secondary'}>{status}</Badge> : undefined}
          />
          <Field icon={<Mail className="w-4 h-4 text-blue-600" />} label="Email" value={email} />
          <Field icon={<Phone className="w-4 h-4 text-green-600" />} label="Phone" value={phone} />
          <Field
            icon={<Users className="w-4 h-4 text-indigo-600" />}
            label="Department"
            value={departments?.length ? departments.join(', ') : department}
          />
          <Field icon={<Briefcase className="w-4 h-4 text-amber-600" />} label="Designation" value={position} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Posting */}
        <Card className="card-modern">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-primary" /> Posting &amp; Reporting
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field icon={<MapPin className="w-4 h-4 text-purple-600" />} label="Work Location" value={workLocation} />
            <Field icon={<Building2 className="w-4 h-4 text-blue-600" />} label="Project / Posting" value={projectAssignment} />
            <Field
              icon={<UserCheck className="w-4 h-4 text-green-600" />}
              label="Reports To"
              value={
                reportingAuthority ? (
                  <span>
                    {reportingAuthority}
                    {managerName && managerName !== reportingAuthority && (
                      <span className="block text-xs text-muted-foreground">linked to {managerName}</span>
                    )}
                  </span>
                ) : undefined
              }
            />
            <Field icon={<IdCard className="w-4 h-4 text-amber-600" />} label="Employment Type" value={employmentCategory} />
            <Field icon={<GraduationCap className="w-4 h-4 text-indigo-600" />} label="Qualification" value={qualification} />
          </CardContent>
        </Card>

        {/* Service record */}
        <Card className="card-modern">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Service Record
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Field icon={<Calendar className="w-4 h-4 text-blue-600" />} label="Date of Birth" value={formatDate(dateOfBirth)} />
            <Field icon={<Calendar className="w-4 h-4 text-green-600" />} label="Date of Joining" value={formatDate(hireDate)} />
            <Field
              icon={<TrendingUp className="w-4 h-4 text-emerald-600" />}
              label="Service"
              value={experienceInCompany || tenure(hireDate)}
            />
            {totalExperienceYears != null && (
              <Field
                icon={<TrendingUp className="w-4 h-4 text-indigo-600" />}
                label="Total Experience"
                value={`${totalExperienceYears} yrs`}
              />
            )}
            {alternatePhone && (
              <Field icon={<Phone className="w-4 h-4 text-green-600" />} label="Alternate Phone" value={alternatePhone} />
            )}
            {dateOfRelieving && (
              <Field icon={<Calendar className="w-4 h-4 text-red-600" />} label="Date of Relieving" value={formatDate(dateOfRelieving)} />
            )}
            {registerSerialNo != null && (
              <Field icon={<IdCard className="w-4 h-4 text-muted-foreground" />} label="Register Sr. No." value={`#${registerSerialNo}`} />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Monthly pay breakdown */}
      {!canViewSalary ? (
        <Restricted title="Monthly Pay Breakdown" permission="employees.view_salary" />
      ) : (
        <Card className="card-modern border-l-4 border-l-green-500">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Banknote className="w-5 h-5 text-green-600" /> Monthly Pay Breakdown
              {compensation?.effectiveFrom && (
                <Badge variant="outline" className="ml-2 font-normal">
                  as of {formatDate(compensation.effectiveFrom)}
                </Badge>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!compensation?.monthlyGross ? (
              <p className="text-sm text-muted-foreground">No monthly pay breakdown recorded.</p>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/10 dark:to-emerald-900/10 border border-green-200 dark:border-green-800">
                    <p className="text-xs text-muted-foreground mb-1">Gross (monthly)</p>
                    <p className="text-2xl font-bold text-green-700 dark:text-green-400">{amount(compensation.monthlyGross)}</p>
                  </div>
                  <div className="p-4 rounded-xl bg-muted/50 border">
                    <p className="text-xs text-muted-foreground mb-1">Total Deductions</p>
                    <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                      {totalDeductions > 0 ? `- ${amount(totalDeductions)}` : '—'}
                    </p>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 border border-blue-200 dark:border-blue-800">
                    <p className="text-xs text-muted-foreground mb-1">On Hand (net)</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-400">{amount(compensation.monthlyNet)}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {deductions.map(d => (
                    <div key={d.label} className="p-3 rounded-lg bg-muted/50">
                      <p className="text-xs text-muted-foreground mb-1">{d.label}</p>
                      <p className="font-semibold text-sm">
                        {d.value == null ? (
                          <span className="text-muted-foreground font-normal">Not recorded</span>
                        ) : (
                          amount(d.value)
                        )}
                      </p>
                    </div>
                  ))}
                </div>

                {(compensation.incrementAmount != null || compensation.incrementPercent != null) && (
                  <div className="flex flex-wrap items-center gap-3 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-800">
                    <TrendingUp className="w-4 h-4 text-amber-600" />
                    <span className="text-sm text-amber-800 dark:text-amber-300">
                      Last increment {amount(compensation.incrementAmount)}
                      {compensation.incrementPercent != null && ` (${compensation.incrementPercent}%)`}
                    </span>
                  </div>
                )}
              </>
            )}

            {history.length > 0 && (
              <div className="pt-4 border-t">
                <h4 className="font-semibold mb-3 text-sm">Monthly Salary Register</h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b">
                      <tr>
                        <th className="text-left py-2 font-medium text-muted-foreground">Period</th>
                        <th className="text-left py-2 font-medium text-muted-foreground">Effective</th>
                        <th className="text-right py-2 font-medium text-muted-foreground">Monthly Gross</th>
                        <th className="text-right py-2 pl-4 font-medium text-muted-foreground">Change</th>
                        <th className="text-left py-2 pl-4 font-medium text-muted-foreground">Reason</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {history.map((rev, index) => (
                        <tr key={`${rev.effectiveFrom}-${index}`}>
                          <td className="py-2">{rev.label || '—'}</td>
                          <td className="py-2 text-muted-foreground">{formatDate(rev.effectiveFrom)}</td>
                          <td className="py-2 text-right font-medium">{amount(rev.monthlyGross)}</td>
                          <td className="py-2 pl-4 text-right">
                            {rev.change == null || rev.change === 0 ? (
                              <span className="text-muted-foreground">—</span>
                            ) : (
                              <span className={rev.change > 0 ? 'text-green-600' : 'text-red-600'}>
                                {rev.change > 0 ? '+' : ''}{amount(rev.change)}
                              </span>
                            )}
                          </td>
                          <td className="py-2 pl-4 text-muted-foreground">{rev.reason || '—'}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Bank and statutory */}
      {!canViewBank ? (
        <Restricted title="Bank &amp; Statutory Details" permission="employees.view_bank_details" />
      ) : (
        <Card className="card-modern">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-primary" /> Bank &amp; Statutory Details
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <Field icon={<Landmark className="w-4 h-4 text-blue-600" />} label="Bank Name" value={bankDetails?.bankName} />
            <Field icon={<IdCard className="w-4 h-4 text-purple-600" />} label="Account Number" value={bankDetails?.accountNumber} />
            <Field icon={<IdCard className="w-4 h-4 text-indigo-600" />} label="IFSC Code" value={bankDetails?.ifscCode} />
            <Field icon={<IdCard className="w-4 h-4 text-green-600" />} label="UAN Number" value={statutory?.uanNumber} />
            <Field
              icon={<Banknote className="w-4 h-4 text-amber-600" />}
              label="PF Applicable"
              value={<Badge variant={statutory?.pfApplicable ? 'default' : 'secondary'}>{statutory?.pfApplicable ? 'Yes' : 'No'}</Badge>}
            />
            <Field
              icon={<Banknote className="w-4 h-4 text-amber-600" />}
              label="ESIC Applicable"
              value={<Badge variant={statutory?.esicApplicable ? 'default' : 'secondary'}>{statutory?.esicApplicable ? 'Yes' : 'No'}</Badge>}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
