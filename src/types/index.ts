export type ReportCategory = 'Ilmo' | 'Qof weyn' | 'Waayeel' | 'Baahi gaar ah qaba';
export type ReportStatus = 'active' | 'found' | 'under_review';

export interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  bio?: string;
  avatarUrl?: string;
  role: 'user' | 'moderator' | 'admin';
  createdAt: string;
}

export interface Comment {
  id: string;
  reportId: string;
  userId?: string;
  authorName: string;
  text: string;
  createdAt: string;
}

export interface PersonReport {
  id: string;
  name: string;
  age: number | string;
  category: ReportCategory;
  location: string;
  district?: string;
  city?: string;
  lastSeen: string;
  description: string;
  phone: string;
  relationship?: string;
  reportType: string;
  status: ReportStatus;
  photoDataUrl?: string;
  ownerId?: string;
  ownerName?: string;
  createdAt: string;
  relativeTime?: string;
  likesCount: number;
  commentsCount: number;
  isPromoted?: boolean;
}

export interface Campaign {
  id: string;
  reportId: string;
  reportName: string;
  ownerId: string;
  objective: 'broad_awareness' | 'urgent_priority' | 'hyper_local';
  locations: string[];
  budget: number;
  durationDays: number;
  estimatedReachMin: number;
  estimatedReachMax: number;
  estimatedImpressionsMin: number;
  estimatedImpressionsMax: number;
  paymentMethod: 'evc_plus' | 'zaad' | 'sahal' | 'premier_wallet' | 'card';
  paymentPhone?: string;
  status: 'active' | 'under_review' | 'completed';
  actualImpressions: number;
  actualClicks: number;
  createdAt: string;
}

export interface NotificationItem {
  id: string;
  userId?: string;
  title: string;
  message: string;
  type: 'comment' | 'status_change' | 'campaign' | 'security';
  read: boolean;
  createdAt: string;
  linkId?: string;
}

export interface AbuseReport {
  id: string;
  reportId: string;
  reason: 'inaccurate_info' | 'person_found_unresolved' | 'inappropriate_image' | 'fraud_scam' | 'other';
  notes: string;
  reporterContact?: string;
  createdAt: string;
}

export interface SupportTicket {
  id: string;
  userId?: string;
  name: string;
  contact: string;
  subject: string;
  message: string;
  status: 'open' | 'in_progress' | 'resolved';
  createdAt: string;
}
