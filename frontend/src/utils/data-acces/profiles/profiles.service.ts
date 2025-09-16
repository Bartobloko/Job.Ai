import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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

export interface TestResult {
  jobId: number;
  jobDescription: string;
  chatResponse: string;
  isApproved: boolean;
}

export interface ProfileTestResponse {
  profileId: number;
  profileName: string;
  results: TestResult[];
  summary: {
    total: number;
    approved: number;
    rejected: number;
  };
}

export interface FakeJob {
  id: number;
  description: string;
}

@Injectable({
  providedIn: 'root'
})
export class ProfilesService {
  private http = inject(HttpClient);
  private readonly baseUrl = 'http://localhost:3000/api/profiles';

  // Profile CRUD operations
  getAllProfiles(): Observable<BotProfile[]> {
    return this.http.get<BotProfile[]>(this.baseUrl);
  }

  getActiveProfile(): Observable<BotProfile> {
    return this.http.get<BotProfile>(`${this.baseUrl}/active`);
  }

  getProfile(profileId: number): Observable<BotProfile> {
    return this.http.get<BotProfile>(`${this.baseUrl}/${profileId}`);
  }

  createProfile(profile: CreateProfileRequest): Observable<{ message: string; profile_id: number }> {
    return this.http.post<{ message: string; profile_id: number }>(this.baseUrl, profile);
  }

  updateProfile(profileId: number, profile: UpdateProfileRequest): Observable<{ message: string }> {
    return this.http.put<{ message: string }>(`${this.baseUrl}/${profileId}`, profile);
  }

  activateProfile(profileId: number): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/${profileId}/activate`, {});
  }

  deleteProfile(profileId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/${profileId}`);
  }

  // Testing operations
  testProfile(profileId: number): Observable<ProfileTestResponse> {
    return this.http.post<ProfileTestResponse>(`${this.baseUrl}/test/${profileId}`, {});
  }

  // Fake jobs management
  getFakeJobs(): Observable<FakeJob[]> {
    return this.http.get<FakeJob[]>(`${this.baseUrl}/fake-jobs`);
  }

  createFakeJob(description: string): Observable<{ id: number; description: string; message: string }> {
    return this.http.post<{ id: number; description: string; message: string }>(`${this.baseUrl}/fake-jobs`, { description });
  }

  deleteFakeJob(jobId: number): Observable<{ message: string }> {
    return this.http.delete<{ message: string }>(`${this.baseUrl}/fake-jobs/${jobId}`);
  }
}