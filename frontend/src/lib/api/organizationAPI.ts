import api from './api';
import { withCsrf } from './csrf';

export interface OrganizationAddress {
  line1: string;
  line2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrganizationProfile {
  companyName: string;
  legalName: string;
  address: OrganizationAddress;
  phone: string;
  email: string;
  website: string;
  gstin: string;
  pan: string;
  cin: string;
  logo: string;
  fiscalYearStart: string;
  currency: string;
  timezone: string;
}

export interface WeeklyOff {
  /** 0 = Sunday … 6 = Saturday */
  day: number;
  /** Weeks of the month the day is off; empty = every week. */
  weeks: number[];
}

export interface ScheduleFields {
  name: string;
  description?: string;
  startTime: string;
  endTime: string;
  lateGraceMinutes: number;
  halfDayHours: number;
  fullDayHours: number;
  breakMinutes: number;
  weeklyOffs: WeeklyOff[];
  active?: boolean;
}

export interface WorkSchedule extends ScheduleFields {
  _id: string;
  isDefault: boolean;
  active: boolean;
  departmentCount: number;
  employeeCount: number;
  updatedAt: string;
}

export interface ScheduleRules extends ScheduleFields {
  id?: string;
  source: 'employee' | 'department' | 'organization' | 'built-in';
}

export interface ScheduleList {
  schedules: WorkSchedule[];
  general: ScheduleRules;
  builtIn: ScheduleRules;
}

export interface ScheduleAssignments {
  departments: { _id: string; name: string }[];
  employees: { _id: string; employeeId: string; firstName: string; lastName?: string }[];
}

export interface Holiday {
  _id: string;
  name: string;
  date: string;
  year: number;
  type: 'public' | 'optional';
  description?: string;
}

export type LeaveTypeName = 'sick' | 'vacation' | 'personal' | 'maternity' | 'paternity' | 'emergency';

export interface LeaveTypePolicy {
  type: LeaveTypeName;
  annualQuota: number;
  carryForward: boolean;
  maxCarryForward: number;
}

export interface LeavePolicy {
  types: LeaveTypePolicy[];
  excludeNonWorkingDays: boolean;
  updatedAt?: string;
}

export type LocationType = 'head-office' | 'branch' | 'site' | 'warehouse';

export interface OrganizationLocation {
  _id: string;
  name: string;
  code?: string;
  type: LocationType;
  address: Partial<OrganizationAddress>;
  phone?: string;
  email?: string;
  active: boolean;
  employeeCount: number;
}

export type LocationInput = Omit<OrganizationLocation, '_id' | 'employeeCount'>;

const put = <T>(url: string, body: unknown) => withCsrf(headers => api.put(url, body, { headers })).then(r => r.data.data as T);
const post = <T>(url: string, body: unknown) => withCsrf(headers => api.post(url, body, { headers })).then(r => r.data as T);
const del = (url: string) => withCsrf(headers => api.delete(url, { headers }));

export const organizationAPI = {
  getProfile: () => api.get('/organization/profile').then(r => r.data.data as OrganizationProfile),
  updateProfile: (profile: Partial<OrganizationProfile>) => put<OrganizationProfile>('/organization/profile', profile),

  listSchedules: () =>
    api.get('/organization/work-schedules').then(r => ({
      schedules: r.data.data,
      general: r.data.general,
      builtIn: r.data.builtIn,
    }) as ScheduleList),
  getEmployeeRules: (employeeId: string) =>
    api.get(`/organization/work-schedules/employee/${employeeId}`).then(r => r.data.data as ScheduleRules),
  saveGeneralTimings: (fields: Partial<ScheduleFields>) => put<WorkSchedule>('/organization/work-schedules/general', fields),
  createSchedule: (fields: ScheduleFields) =>
    post<{ data: WorkSchedule }>('/organization/work-schedules', fields).then(r => r.data),
  updateSchedule: (id: string, fields: Partial<ScheduleFields>) => put<WorkSchedule>(`/organization/work-schedules/${id}`, fields),
  deleteSchedule: (id: string) => del(`/organization/work-schedules/${id}`),
  getAssignments: (id: string) =>
    api.get(`/organization/work-schedules/${id}/assignments`).then(r => r.data.data as ScheduleAssignments),
  setAssignments: (id: string, departmentIds: string[], employeeIds: string[]) =>
    put(`/organization/work-schedules/${id}/assignments`, { departmentIds, employeeIds }),

  listHolidays: (year: number) =>
    api.get('/organization/holidays', { params: { year } }).then(r => r.data.data as Holiday[]),
  createHoliday: (holiday: Omit<Holiday, '_id' | 'year'>) =>
    post<{ data: Holiday }>('/organization/holidays', holiday).then(r => r.data),
  updateHoliday: (id: string, holiday: Partial<Omit<Holiday, '_id' | 'year'>>) => put<Holiday>(`/organization/holidays/${id}`, holiday),
  deleteHoliday: (id: string) => del(`/organization/holidays/${id}`),
  copyHolidays: (fromYear: number, toYear: number) =>
    post<{ message: string }>('/organization/holidays/copy', { fromYear, toYear }),

  getLeavePolicy: () => api.get('/organization/leave-policy').then(r => r.data.data as LeavePolicy),
  updateLeavePolicy: (policy: Partial<LeavePolicy>) => put<LeavePolicy>('/organization/leave-policy', policy),

  listLocations: (activeOnly = false) =>
    api.get('/organization/locations', { params: activeOnly ? { active: 'true' } : {} }).then(r => r.data.data as OrganizationLocation[]),
  createLocation: (location: LocationInput) =>
    post<{ data: OrganizationLocation }>('/organization/locations', location).then(r => r.data),
  updateLocation: (id: string, location: Partial<LocationInput>) => put<OrganizationLocation>(`/organization/locations/${id}`, location),
  deleteLocation: (id: string) => del(`/organization/locations/${id}`),
};

export const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

export const describeWeeklyOffs = (offs: WeeklyOff[]): string => {
  if (!offs.length) return 'No weekly off';
  const ordinal = (n: number) => ['1st', '2nd', '3rd', '4th', '5th'][n - 1];
  return offs
    .slice()
    .sort((a, b) => a.day - b.day)
    .map(o => (o.weeks.length ? `${o.weeks.map(ordinal).join(' & ')} ${WEEKDAYS[o.day]}` : `Every ${WEEKDAYS[o.day]}`))
    .join(', ');
};

export const errorMessage = (error: unknown, fallback: string): string =>
  (error as { response?: { data?: { message?: string } } })?.response?.data?.message || fallback;
