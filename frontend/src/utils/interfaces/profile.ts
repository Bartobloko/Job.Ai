export interface BotProfile {
  id: number;
  account_id: number;
  name: string;
  custom_prompt: string;
  experience_level: string;
  blocked_keywords: string;
  ai_model: string;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface CreateProfileRequest {
  name: string;
  custom_prompt: string;
  experience_level: string;
  blocked_keywords: string;
  ai_model?: string;
}

export interface UpdateProfileRequest extends CreateProfileRequest {
  is_active?: boolean;
}