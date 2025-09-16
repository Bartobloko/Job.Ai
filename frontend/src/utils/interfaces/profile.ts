export interface BotProfile {
  id: string;
  name: string;
  prompt: string;
  experience: string;
  blockedKeywords: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateProfileRequest {
  name: string;
  prompt: string;
  experience: string;
  blockedKeywords: string;
}

export interface UpdateProfileRequest extends CreateProfileRequest {
  id: string;
}