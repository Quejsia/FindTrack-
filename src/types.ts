export type Category = 'electronics' | 'keys' | 'wallet' | 'documents' | 'clothing' | 'jewelry' | 'bags' | 'others';
export type ItemType = 'lost' | 'found';
export type ItemStatus = 'active' | 'resolved';
export type MatchStatus = 'pending' | 'accepted' | 'rejected';

export interface Item {
  id: string;
  userId: string;
  type: ItemType;
  title: string;
  description: string;
  category: Category;
  location: string;
  status: ItemStatus;
  imageUrl?: string;
  contactName: string;
  contactInfo: string;
  date: string; // ISO DateTime string
  createdAt: string; // Date or Firestore sub-timestamp
  updatedAt: string;
  securityQuestion?: string; // Prove it question
  securityAnswer?: string;
}

export interface Claim {
  id: string;
  itemId: string;
  itemTitle: string;
  imageUrl?: string;
  claimerId: string;
  claimerName: string;
  claimerEmail?: string;
  claimerContact?: string;
  finderId: string;
  securityQuestion: string;
  providedAnswer: string;
  status: 'pending' | 'approved' | 'rejected';
  autoVerified?: boolean;
  manualOverride?: boolean;
  createdAt: any;
  updatedAt: any;
}

export interface Match {
  id: string;
  lostItemId: string;
  foundItemId: string;
  confidenceScore: number;
  matchReason: string;
  status: MatchStatus;
  createdAt: string;
  updatedAt: string;
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: 'create' | 'update' | 'delete' | 'list' | 'get' | 'write';
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
  };
}
