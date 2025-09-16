import { computed, inject } from '@angular/core';
import { patchState, signalStore, withComputed, withMethods, withState } from '@ngrx/signals';
import { firstValueFrom } from 'rxjs';
import { ProfilesService, BotProfile, CreateProfileRequest, UpdateProfileRequest } from '../../data-acces/profiles/profiles.service';

interface ProfilesState {
  profiles: BotProfile[];
  activeProfile: BotProfile | null;
  selectedProfileId: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: ProfilesState = {
  profiles: [],
  activeProfile: null,
  selectedProfileId: null,
  loading: false,
  error: null
};

export const ProfilesStore = signalStore(
  { providedIn: 'root' },
  withState(initialState),
  withMethods(
    (store, profilesService = inject(ProfilesService)) => ({
      async loadProfiles() {
        patchState(store, { loading: true, error: null });
        try {
          const profiles = await firstValueFrom(profilesService.getAllProfiles());
          patchState(store, { 
            profiles, 
            loading: false 
          });
        } catch (error: any) {
          patchState(store, { 
            loading: false, 
            error: error.message || 'Failed to load profiles' 
          });
        }
      },

      async loadActiveProfile() {
        patchState(store, { loading: true, error: null });
        try {
          const activeProfile = await firstValueFrom(profilesService.getActiveProfile());
          patchState(store, { 
            activeProfile, 
            loading: false 
          });
        } catch (error: any) {
          patchState(store, { 
            loading: false, 
            error: error.message || 'No active profile found',
            activeProfile: null 
          });
        }
      },

      async createProfile(profile: CreateProfileRequest) {
        patchState(store, { loading: true, error: null });
        try {
          await firstValueFrom(profilesService.createProfile(profile));
          // Reload profiles to get the updated list
          await this.loadProfiles();
        } catch (error: any) {
          patchState(store, { 
            loading: false, 
            error: error.message || 'Failed to create profile' 
          });
        }
      },

      async updateProfile(profileId: number, profile: UpdateProfileRequest) {
        patchState(store, { loading: true, error: null });
        try {
          await firstValueFrom(profilesService.updateProfile(profileId, profile));
          // Reload profiles to get the updated list
          await this.loadProfiles();
          // If this profile was active, reload active profile
          if (store.activeProfile()?.id === profileId) {
            await this.loadActiveProfile();
          }
        } catch (error: any) {
          patchState(store, { 
            loading: false, 
            error: error.message || 'Failed to update profile' 
          });
        }
      },

      async activateProfile(profileId: number) {
        patchState(store, { loading: true, error: null });
        try {
          await firstValueFrom(profilesService.activateProfile(profileId));
          // Reload profiles and active profile
          await this.loadProfiles();
          await this.loadActiveProfile();
        } catch (error: any) {
          patchState(store, { 
            loading: false, 
            error: error.message || 'Failed to activate profile' 
          });
        }
      },

      async deleteProfile(profileId: number) {
        patchState(store, { loading: true, error: null });
        try {
          await firstValueFrom(profilesService.deleteProfile(profileId));
          // Reload profiles
          await this.loadProfiles();
          // If this was the active profile, clear it and try to load new active
          if (store.activeProfile()?.id === profileId) {
            patchState(store, { activeProfile: null });
            await this.loadActiveProfile();
          }
        } catch (error: any) {
          patchState(store, { 
            loading: false, 
            error: error.message || 'Failed to delete profile' 
          });
        }
      },

      selectProfile(profileId: number | null) {
        patchState(store, { selectedProfileId: profileId });
      },

      clearError() {
        patchState(store, { error: null });
      }
    })
  ),
  withComputed((state) => ({
    hasProfiles: computed(() => state.profiles().length > 0),
    hasActiveProfile: computed(() => state.activeProfile() !== null),
    profilesCount: computed(() => state.profiles().length),
    selectedProfile: computed(() => {
      const profileId = state.selectedProfileId();
      return profileId ? state.profiles().find(p => p.id === profileId) || null : null;
    })
  }))
);