import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { BotProfile, CreateProfileRequest, UpdateProfileRequest } from '../profiles/profiles.service';

@Injectable({
  providedIn: 'root'
})
export class ProfileService {
  private http = inject(HttpClient);
  private readonly API_URL = 'http://localhost:3000/api';

  // For now, we'll use local storage until backend integration
  private readonly STORAGE_KEY = 'bot_profiles';

  getProfiles(): Observable<BotProfile[]> {
    // For now, return fake data pointing to fake routes as requested
    const profiles = this.getProfilesFromStorage();
    return of(profiles);
  }

  getProfile(id: number): Observable<BotProfile | null> {
    const profiles = this.getProfilesFromStorage();
    const profile = profiles.find(p => p.id === id) || null;
    return of(profile);
  }

  createProfile(profileData: CreateProfileRequest): Observable<BotProfile> {
    // For now, use fake route - will be implemented later
    const newProfile: BotProfile = {
      id: this.generateId(),
      account_id: 1, // Mock account ID
      name: profileData.name,
      custom_prompt: profileData.custom_prompt,
      experience_level: profileData.experience_level,
      blocked_keywords: profileData.blocked_keywords,
      ai_model: profileData.ai_model || 'phi4',
      is_active: false,
      created_at: new Date(),
      updated_at: new Date()
    };

    const profiles = this.getProfilesFromStorage();
    profiles.push(newProfile);
    this.saveProfilesToStorage(profiles);

    return of(newProfile);
  }

  updateProfile(id: number, profileData: UpdateProfileRequest): Observable<BotProfile> {
    // For now, use fake route - will be implemented later
    const profiles = this.getProfilesFromStorage();
    const index = profiles.findIndex(p => p.id === id);
    
    if (index !== -1) {
      const updatedProfile: BotProfile = {
        ...profiles[index],
        name: profileData.name,
        custom_prompt: profileData.custom_prompt,
        experience_level: profileData.experience_level,
        blocked_keywords: profileData.blocked_keywords,
        ai_model: profileData.ai_model || profiles[index].ai_model,
        is_active: profileData.is_active !== undefined ? profileData.is_active : profiles[index].is_active,
        updated_at: new Date()
      };
      profiles[index] = updatedProfile;
      this.saveProfilesToStorage(profiles);
      return of(updatedProfile);
    }

    throw new Error('Profile not found');
  }

  deleteProfile(id: number): Observable<boolean> {
    // For now, use fake route - will be implemented later
    const profiles = this.getProfilesFromStorage();
    const filteredProfiles = profiles.filter(p => p.id !== id);
    this.saveProfilesToStorage(filteredProfiles);
    return of(true);
  }

  private getProfilesFromStorage(): BotProfile[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  private saveProfilesToStorage(profiles: BotProfile[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(profiles));
    } catch (error) {
      console.error('Failed to save profiles to storage:', error);
    }
  }

  private generateId(): number {
    return Date.now() + Math.floor(Math.random() * 1000);
  }
}