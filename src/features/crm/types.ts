import type { LeadActivityType, LeadAssignmentReason, LeadSource, LeadStage } from "@/config/crm";

export interface LeadSummary {
  id: string;
  fullName: string;
  phone: string;
  projectName: string | null;
  source: LeadSource;
  stage: LeadStage;
  ownerId: string | null;
  ownerName: string | null;
  slaDueAt: string | null;
  firstResponseAt: string | null;
  createdAt: string;
  lastActivityAt: string;
}

export interface LeadTimelineItem {
  id: string;
  at: string;
  actorName: string | null;
  kind: "aktivitas" | "pembagian";
  activityType?: LeadActivityType;
  reason?: LeadAssignmentReason;
  toName?: string | null;
  body: string | null;
}

export interface LeadDetail extends LeadSummary {
  email: string | null;
  sourceDetail: string | null;
  note: string | null;
  lostReason: string | null;
  timeline: LeadTimelineItem[];
}

export interface MarketingChoice {
  id: string;
  name: string;
}
