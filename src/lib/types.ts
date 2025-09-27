import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
};

export type ComplaintCategory = 'pothole' | 'tree fall' | 'garbage' | 'stray dog' | 'other';

export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';

export type Complaint = {
  id: string;
  userId: string;
  userName: string;
  title: string;
  description: string;
  location: {
    lat: number;
    long: number;
    address: string;
  };
  category: ComplaintCategory;
  photoURL: string;
  status: ComplaintStatus;
  timestamp: Timestamp;
  duplicateOf?: string;
};

export type ReportPrefill = {
  title: string;
  description: string;
  locationDescription: string;
  category: ComplaintCategory;
};
