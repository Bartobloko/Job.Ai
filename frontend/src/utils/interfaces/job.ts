export interface Job {
  id: number;
  is_approved: boolean;
  created_at: string;
  title: string;
  description: string;
  company: string;
  link: string;
  isApplicable: boolean;
}
