export type UserRole = 'admin' | 'manager' | 'agent';

export type LeadStatus = 'fresh' | 'connected' | 'not_connected' | 'followup';
export type LeadTemperature = 'super_hot' | 'hot' | 'warm' | 'cold' | 'junk' | 'success' | 'lost';

export type LeadSource = 
  | 'query_form' | 'whatsapp' | 'ivr' | 'chat'
  | 'justdial' | 'indiamart' | 'google_business' | 'practo'
  | 'facebook' | 'instagram' | 'whatsapp_ads'
  | 'reference' | 'walkin' | 'manual';

export interface Lead {
  id: string;
  mobile: string;
  alternative_mobile?: string;
  name: string;
  city: string;
  source: LeadSource;
  source_type: string;
  website_name?: string;
  status: LeadStatus;
  temperature: LeadTemperature;
  first_owner_id: string;
  conversion_owner_id?: string;
  current_owner_id: string;
  followup_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface LeadActivity {
  id: string;
  lead_id: string;
  user_id: string;
  activity_type: string;
  remarks: string;
  followup_date?: string;
  created_at: string;
}

export interface CRMUser {
  id: string;
  name: string;
  email: string;
  mobile?: string;
  role: UserRole;
  status: 'active' | 'inactive';
  created_at: string;
}

export interface DashboardStats {
  total: number;
  fresh: number;
  super_hot: number;
  hot: number;
  warm: number;
  cold: number;
  success: number;
  lost: number;
  junk: number;
}
