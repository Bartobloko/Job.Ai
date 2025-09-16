import { computed, Injectable, signal } from '@angular/core';
import { BotProfile, CreateProfileRequest } from '../../interfaces/profile';
import { ProfileService } from '../../data-acces/profile/profile.service';
import { inject } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class ProfilesStore {
  private profileService = inject(ProfileService);
  
  // Private signals for state management
  private _profiles = signal<BotProfile[]>([]);
  private _selectedProfileId = signal<string | null>(null);
  private _loading = signal<boolean>(false);
  private _error = signal<string | null>(null);

  // Public computed signals
  public readonly profiles = this._profiles.asReadonly();
  public readonly selectedProfileId = this._selectedProfileId.asReadonly();
  public readonly selectedProfile = computed(() => {
    const profileId = this._selectedProfileId();
    return profileId ? this._profiles().find(p => p.id === profileId) || null : null;
  });
  public readonly loading = this._loading.asReadonly();
  public readonly error = this._error.asReadonly();

  // Actions
  async loadProfiles(): Promise<void> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const profiles = await this.profileService.getProfiles().toPromise();
      this._profiles.set(profiles || []);
    } catch (error) {
      this._error.set('Failed to load profiles');
      console.error('Error loading profiles:', error);
    } finally {
      this._loading.set(false);
    }
  }

  async createProfile(profileData: CreateProfileRequest): Promise<string | null> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const newProfile = await this.profileService.createProfile(profileData).toPromise();
      if (newProfile) {
        this._profiles.update(profiles => [...profiles, newProfile]);
        return newProfile.id;
      }
      return null;
    } catch (error) {
      this._error.set('Failed to create profile');
      console.error('Error creating profile:', error);
      return null;
    } finally {
      this._loading.set(false);
    }
  }

  async updateProfile(id: string, profileData: CreateProfileRequest): Promise<boolean> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const updatedProfile = await this.profileService.updateProfile({
        id,
        ...profileData
      }).toPromise();
      
      if (updatedProfile) {
        this._profiles.update(profiles => 
          profiles.map(p => p.id === id ? updatedProfile : p)
        );
        return true;
      }
      return false;
    } catch (error) {
      this._error.set('Failed to update profile');
      console.error('Error updating profile:', error);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  async deleteProfile(id: string): Promise<boolean> {
    this._loading.set(true);
    this._error.set(null);
    
    try {
      const success = await this.profileService.deleteProfile(id).toPromise();
      if (success) {
        this._profiles.update(profiles => profiles.filter(p => p.id !== id));
        
        // Clear selection if deleted profile was selected
        if (this._selectedProfileId() === id) {
          this._selectedProfileId.set(null);
        }
        return true;
      }
      return false;
    } catch (error) {
      this._error.set('Failed to delete profile');
      console.error('Error deleting profile:', error);
      return false;
    } finally {
      this._loading.set(false);
    }
  }

  selectProfile(profileId: string | null): void {
    this._selectedProfileId.set(profileId);
  }

  clearError(): void {
    this._error.set(null);
  }
}