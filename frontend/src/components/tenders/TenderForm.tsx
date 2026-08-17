"use client";

import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tender, TenderDirection, PORTAL_LABELS, TenderPortal } from "@/lib/api/tendersAPI";

export interface TenderFormValues {
  direction: TenderDirection;
  title: string;
  description: string;
  type: string;
  category: string;
  estimatedValue: string;
  currency: string;
  priority: string;
  location: string;
  referenceNumber: string;
  scopeOfWork: string;
  submissionDeadline: string;
  preBidMeetingDate: string;
  openingDate: string;
  // bidding only
  authorityName: string;
  authorityDepartment: string;
  authorityOfficer: string;
  authorityEmail: string;
  authorityPhone: string;
  portal: string;
  portalTenderId: string;
  portalUrl: string;
  tenderNoticeNumber: string;
}

const toDateInput = (value?: string) => (value ? value.slice(0, 16) : '');

export const buildInitialValues = (tender?: Tender | null, direction: TenderDirection = 'issued'): TenderFormValues => ({
  direction: tender?.direction || direction,
  title: tender?.title || '',
  description: tender?.description || '',
  type: tender?.type || 'open',
  category: tender?.category || 'works',
  estimatedValue: tender?.estimatedValue != null ? String(tender.estimatedValue) : '',
  currency: tender?.currency || 'INR',
  priority: tender?.priority || 'medium',
  location: tender?.location || '',
  referenceNumber: tender?.referenceNumber || '',
  scopeOfWork: tender?.scopeOfWork || '',
  submissionDeadline: toDateInput(tender?.submissionDeadline),
  preBidMeetingDate: toDateInput(tender?.preBidMeetingDate),
  openingDate: toDateInput(tender?.openingDate),
  authorityName: tender?.issuingAuthority?.name || '',
  authorityDepartment: tender?.issuingAuthority?.department || '',
  authorityOfficer: tender?.issuingAuthority?.officerName || '',
  authorityEmail: tender?.issuingAuthority?.email || '',
  authorityPhone: tender?.issuingAuthority?.phone || '',
  portal: tender?.portal || '',
  portalTenderId: tender?.portalTenderId || '',
  portalUrl: tender?.portalUrl || '',
  tenderNoticeNumber: tender?.tenderNoticeNumber || ''
});

/** Shape the flat form back into the API payload. */
export const toTenderPayload = (values: TenderFormValues): Partial<Tender> => {
  const payload: any = {
    direction: values.direction,
    title: values.title.trim(),
    description: values.description.trim() || undefined,
    type: values.type,
    category: values.category,
    estimatedValue: parseFloat(values.estimatedValue) || 0,
    currency: values.currency,
    priority: values.priority,
    location: values.location.trim() || undefined,
    referenceNumber: values.referenceNumber.trim() || undefined,
    scopeOfWork: values.scopeOfWork.trim() || undefined,
    submissionDeadline: values.submissionDeadline || undefined,
    preBidMeetingDate: values.preBidMeetingDate || undefined,
    openingDate: values.openingDate || undefined
  };

  if (values.direction === 'bidding') {
    payload.issuingAuthority = {
      name: values.authorityName.trim(),
      department: values.authorityDepartment.trim() || undefined,
      officerName: values.authorityOfficer.trim() || undefined,
      email: values.authorityEmail.trim() || undefined,
      phone: values.authorityPhone.trim() || undefined
    };
    payload.portal = values.portal || undefined;
    payload.portalTenderId = values.portalTenderId.trim() || undefined;
    payload.portalUrl = values.portalUrl.trim() || undefined;
    payload.tenderNoticeNumber = values.tenderNoticeNumber.trim() || undefined;
  }

  return payload;
};

interface TenderFormProps {
  values: TenderFormValues;
  onChange: (values: TenderFormValues) => void;
  /** Direction is fixed once a tender exists. */
  lockDirection?: boolean;
}

export const TenderForm: React.FC<TenderFormProps> = ({ values, onChange, lockDirection = false }) => {
  const set = (patch: Partial<TenderFormValues>) => onChange({ ...values, ...patch });
  const isBidding = values.direction === 'bidding';

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Which side are we on?</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              type="button"
              disabled={lockDirection}
              onClick={() => set({ direction: 'issued' })}
              className={`rounded-lg border p-4 text-left transition ${
                !isBidding ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/40'
              } ${lockDirection ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <p className="font-medium">We are issuing this tender</p>
              <p className="mt-1 text-sm text-muted-foreground">
                We publish it, vendors bid, we evaluate and award.
              </p>
            </button>
            <button
              type="button"
              disabled={lockDirection}
              onClick={() => set({ direction: 'bidding' })}
              className={`rounded-lg border p-4 text-left transition ${
                isBidding ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/40'
              } ${lockDirection ? 'opacity-60 cursor-not-allowed' : ''}`}
            >
              <p className="font-medium">We are bidding on this tender</p>
              <p className="mt-1 text-sm text-muted-foreground">
                An authority published it; we prepare and submit a bid.
              </p>
            </button>
          </div>
          {lockDirection && (
            <p className="mt-2 text-xs text-muted-foreground">
              Direction cannot be changed after a tender is created.
            </p>
          )}
        </CardContent>
      </Card>

      {isBidding && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Issuing Authority</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <Label>Authority name *</Label>
              <Input
                value={values.authorityName}
                onChange={(e) => set({ authorityName: e.target.value })}
                placeholder="e.g. Public Works Department, Government of Maharashtra"
              />
            </div>
            <div>
              <Label>Department / Division</Label>
              <Input value={values.authorityDepartment} onChange={(e) => set({ authorityDepartment: e.target.value })} />
            </div>
            <div>
              <Label>Contact officer</Label>
              <Input value={values.authorityOfficer} onChange={(e) => set({ authorityOfficer: e.target.value })} />
            </div>
            <div>
              <Label>Email</Label>
              <Input type="email" value={values.authorityEmail} onChange={(e) => set({ authorityEmail: e.target.value })} />
            </div>
            <div>
              <Label>Phone</Label>
              <Input value={values.authorityPhone} onChange={(e) => set({ authorityPhone: e.target.value })} />
            </div>
          </CardContent>
        </Card>
      )}

      {isBidding && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Portal & Notice</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>Portal</Label>
              <Select value={values.portal} onValueChange={(value) => set({ portal: value })}>
                <SelectTrigger><SelectValue placeholder="Select portal" /></SelectTrigger>
                <SelectContent>
                  {(Object.keys(PORTAL_LABELS) as TenderPortal[]).map(key => (
                    <SelectItem key={key} value={key}>{PORTAL_LABELS[key]}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Portal tender ID</Label>
              <Input value={values.portalTenderId} onChange={(e) => set({ portalTenderId: e.target.value })} />
            </div>
            <div>
              <Label>Tender notice number</Label>
              <Input value={values.tenderNoticeNumber} onChange={(e) => set({ tenderNoticeNumber: e.target.value })} />
            </div>
            <div>
              <Label>Portal URL</Label>
              <Input value={values.portalUrl} onChange={(e) => set({ portalUrl: e.target.value })} placeholder="https://" />
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Tender Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Title *</Label>
            <Input value={values.title} onChange={(e) => set({ title: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Description</Label>
            <Textarea value={values.description} onChange={(e) => set({ description: e.target.value })} rows={3} />
          </div>
          <div>
            <Label>Type *</Label>
            <Select value={values.type} onValueChange={(value) => set({ type: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="open">Open</SelectItem>
                <SelectItem value="limited">Limited</SelectItem>
                <SelectItem value="single-source">Single source</SelectItem>
                <SelectItem value="two-envelope">Two envelope</SelectItem>
                <SelectItem value="reverse-auction">Reverse auction</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Category *</Label>
            <Select value={values.category} onValueChange={(value) => set({ category: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="works">Works</SelectItem>
                <SelectItem value="goods">Goods</SelectItem>
                <SelectItem value="services">Services</SelectItem>
                <SelectItem value="consultancy">Consultancy</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Estimated value</Label>
            <Input
              type="number"
              min="0"
              value={values.estimatedValue}
              onChange={(e) => set({ estimatedValue: e.target.value })}
            />
          </div>
          <div>
            <Label>Currency</Label>
            <Input value={values.currency} onChange={(e) => set({ currency: e.target.value.toUpperCase() })} maxLength={3} />
          </div>
          <div>
            <Label>Priority</Label>
            <Select value={values.priority} onValueChange={(value) => set({ priority: value })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Location</Label>
            <Input value={values.location} onChange={(e) => set({ location: e.target.value })} />
          </div>
          <div className="md:col-span-2">
            <Label>Scope of work</Label>
            <Textarea value={values.scopeOfWork} onChange={(e) => set({ scopeOfWork: e.target.value })} rows={4} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Key Dates</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <Label>Submission deadline</Label>
            <Input
              type="datetime-local"
              value={values.submissionDeadline}
              onChange={(e) => set({ submissionDeadline: e.target.value })}
            />
          </div>
          <div>
            <Label>Pre-bid meeting</Label>
            <Input
              type="datetime-local"
              value={values.preBidMeetingDate}
              onChange={(e) => set({ preBidMeetingDate: e.target.value })}
            />
          </div>
          <div>
            <Label>Opening date</Label>
            <Input
              type="datetime-local"
              value={values.openingDate}
              onChange={(e) => set({ openingDate: e.target.value })}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default TenderForm;
