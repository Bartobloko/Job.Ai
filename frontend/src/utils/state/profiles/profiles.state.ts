import { computed, inject } from '@angular/core';
import { signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { BotProfile, CreateProfileRequest } from '../../interfaces/profile';
import { ProfileService } from '../../data-acces/profile/profile.service';

interface ProfilesState {
  profiles: BotProfile[];
  selectedProfileId: string | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfilesState = {
  profiles: [],
  selectedProfileId: null,
  loading: false,
  error: null,
};

export const ProfilesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withComputed((store) => ({
    selectedProfile: computed(() => {
      const profileId = store.selectedProfileId();
      return profileId ? store.profiles().find(p => p.id === profileId) || null : null;
    }),
  })),
  withMethods((store, profileService = inject(ProfileService)) => ({
    async loadProfiles(): Promise<void> {
      store.loading.set(true);
      store.error.set(null);
      
      try {
        const profiles = await profileService.getProfiles().toPromise();
        store.profiles.set(profiles || []);
      } catch (error) {
        store.error.set('Failed to load profiles');
        console.error('Error loading profiles:', error);
      } finally {
        store.loading.set(false);
      }
    },

    async createProfile(profileData: CreateProfileRequest): Promise<string | null> {
      store.loading.set(true);
      store.error.set(null);
      
      try {
        const newProfile = await profileService.createProfile(profileData).toPromise();
        if (newProfile) {
          store.profiles.update(profiles => [...profiles, newProfile]);
          return newProfile.id;
        }
        return null;
      } catch (error) {
        store.error.set('Failed to create profile');
        console.error('Error creating profile:', error);
        return null;
      } finally {
        store.loading.set(false);
      }
    },

    async updateProfile(id: string, profileData: CreateProfileRequest): Promise<boolean> {
      store.loading.set(true);
      store.error.set(null);
      
      try {
        const updatedProfile = await profileService.updateProfile({
          id,
          ...profileData
        }).toPromise();
        
        if (updatedProfile) {
          store.profiles.update(profiles => 
            profiles.map(p => p.id === id ? updatedProfile : p)
          );
          return true;
        }
        return false;
      } catch (error) {
        store.error.set('Failed to update profile');
        console.error('Error updating profile:', error);
        return false;
      } finally {
        store.loading.set(false);
      }
    },

    async deleteProfile(id: string): Promise<boolean> {
      store.loading.set(true);
      store.error.set(null);
      
      try {
        const success = await profileService.deleteProfile(id).toPromise();
        if (success) {
          store.profiles.update(profiles => profiles.filter(p => p.id !== id));
          
          // Clear selection if deleted profile was selected
          if (store.selectedProfileId() === id) {
            store.selectedProfileId.set(null);
          }
          return true;
        }
        return false;
      } catch (error) {
        store.error.set('Failed to delete profile');
        console.error('Error deleting profile:', error);
        return false;
      } finally {
        store.loading.set(false);
      }
    },

    selectProfile(profileId: string | null): void {
      store.selectedProfileId.set(profileId);
    },

    clearError(): void {
      store.error.set(null);
    },
  }))
);