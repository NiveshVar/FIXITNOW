
import type { Timestamp } from 'firebase/firestore';

export type UserRole = 'user' | 'admin' | 'super-admin';

export type UserProfile = {
  uid: string;
  name: string;
  email: string;
  role: UserRole;
  district?: string;
  phone?: string;
};

export type ComplaintCategory = 'pothole' | 'tree fall' | 'garbage' | 'stray dog' | 'other';

export type ComplaintStatus = 'Pending' | 'In Progress' | 'Resolved';

export type Complaint = {
  id: string;
  userId: string;
  userName: string;
  userPhone?: string;
  title: string;
  description: string;
  location: {
    lat: number;
    long: number;
    address: string;
  };
  district?: string;
  category: ComplaintCategory;
  photoURL: string;
  status: ComplaintStatus;
  timestamp: Timestamp;
  duplicateOf?: string;
};
