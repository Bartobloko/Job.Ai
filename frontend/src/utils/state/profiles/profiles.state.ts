import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
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
      patchState(store, { loading: true, error: null });
      
      try {
        const profiles = await profileService.getProfiles().toPromise();
        patchState(store, { 
          profiles: profiles || [], 
          loading: false 
        });
      } catch (error) {
        patchState(store, { 
          error: 'Failed to load profiles', 
          loading: false 
        });
        console.error('Error loading profiles:', error);
      }
    },

    async createProfile(profileData: CreateProfileRequest): Promise<string | null> {
      patchState(store, { loading: true, error: null });
      
      try {
        const newProfile = await profileService.createProfile(profileData).toPromise();
        if (newProfile) {
          patchState(store, { 
            profiles: [...store.profiles(), newProfile],
            loading: false 
          });
          return newProfile.id;
        }
        patchState(store, { loading: false });
        return null;
      } catch (error) {
        patchState(store, { 
          error: 'Failed to create profile', 
          loading: false 
        });
        console.error('Error creating profile:', error);
        return null;
      }
    },

    async updateProfile(id: string, profileData: CreateProfileRequest): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      
      try {
        const updatedProfile = await profileService.updateProfile({
          id,
          ...profileData
        }).toPromise();
        
        if (updatedProfile) {
          patchState(store, { 
            profiles: store.profiles().map(p => p.id === id ? updatedProfile : p),
            loading: false 
          });
          return true;
        }
        patchState(store, { loading: false });
        return false;
      } catch (error) {
        patchState(store, { 
          error: 'Failed to update profile', 
          loading: false 
        });
        console.error('Error updating profile:', error);
        return false;
      }
    },

    async deleteProfile(id: string): Promise<boolean> {
      patchState(store, { loading: true, error: null });
      
      try {
        const success = await profileService.deleteProfile(id).toPromise();
        if (success) {
          const currentSelectedId = store.selectedProfileId();
          patchState(store, { 
            profiles: store.profiles().filter(p => p.id !== id),
            // Clear selection if deleted profile was selected
            selectedProfileId: currentSelectedId === id ? null : currentSelectedId,
            loading: false 
          });
          return true;
        }
        patchState(store, { loading: false });
        return false;
      } catch (error) {
        patchState(store, { 
          error: 'Failed to delete profile', 
          loading: false 
        });
        console.error('Error deleting profile:', error);
        return false;
      }
    },

    selectProfile(profileId: string | null): void {
      patchState(store, { selectedProfileId: profileId });
    },

    clearError(): void {
      patchState(store, { error: null });
    },
  }))
);