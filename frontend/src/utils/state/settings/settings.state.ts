import {Settings} from '../../interfaces/settings';
import {patchState, signalStore, withComputed, withHooks, withMethods, withState} from '@ngrx/signals';
import {firstValueFrom} from 'rxjs';
import {SettingsService} from '../../data-acces/settings/settings.service';
import {computed, inject} from '@angular/core';

const initialState: Settings = {
  first_name: null,
  last_name: null,
  about_me: null,
  cv_path: null,
  linkedIn_li_at_cookie: '',
  justJoin_links: null,
  theProtocol_links: null,
  noFluffJobs_links: null,
  linkedIn_links: null,
  talent_links: null,
  custom_prompt: null,
  experience_level: null,
  blocked_keywords: null,
  updated_at: ''
}

export const SettingsStore = signalStore(
  {providedIn: 'root'},
  withState(initialState),
  withMethods(
    (store, settingsService = inject(SettingsService)) => ({
      async loadSettings() {
        console.log('loading settings');
        const settings = await firstValueFrom(settingsService.getAccountSettings());
        console.log('patching settings');
        patchState(store,{
          first_name: settings.first_name,
          last_name: settings.last_name,
          about_me: settings.about_me,
          cv_path: settings.cv_path,
          linkedIn_li_at_cookie: settings.linkedIn_li_at_cookie,
          justJoin_links: settings.justJoin_links,
          theProtocol_links: settings.theProtocol_links,
          noFluffJobs_links: settings.noFluffJobs_links,
          linkedIn_links: settings.linkedIn_links,
          talent_links: settings.talent_links,
          custom_prompt: settings.custom_prompt,
          experience_level: settings.experience_level,
          blocked_keywords: settings.blocked_keywords,
          updated_at: settings.updated_at
        });
        console.log('loaded settings', settings);
      },
      async updateSettings(settings: Partial<Settings>) {
        // Get current full settings to merge with the updates
        const currentSettings = {
          first_name: store.first_name(),
          last_name: store.last_name(),
          about_me: store.about_me(),
          cv_path: store.cv_path(),
          linkedIn_li_at_cookie: store.linkedIn_li_at_cookie(),
          justJoin_links: store.justJoin_links(),
          theProtocol_links: store.theProtocol_links(),
          noFluffJobs_links: store.noFluffJobs_links(),
          linkedIn_links: store.linkedIn_links(),
          talent_links: store.talent_links(),
          custom_prompt: store.custom_prompt(),
          experience_level: store.experience_level(),
          blocked_keywords: store.blocked_keywords(),
          updated_at: store.updated_at()
        };

        // Merge current settings with updates
        const updatedSettings = { ...currentSettings, ...settings };

        await firstValueFrom(settingsService.updateAccountSettings(updatedSettings));
        await this.loadSettings();
      }
    })
  ),
  withComputed(( state ) => ({
    hasPersonalInfo: computed(() => {
      return !!(state.first_name() || state.last_name() || state.about_me());
    }),
    hasIntegrationSettings: computed(() => {
      return !!(state.linkedIn_li_at_cookie() || state.justJoin_links() || state.theProtocol_links() || state.noFluffJobs_links() || state.linkedIn_links() || state.talent_links());
    }),
    shortSettings: computed(() => ({
      custom_prompt: () => state.custom_prompt(),
      experience_level: () => state.experience_level(),
      blocked_keywords: () => state.blocked_keywords()
    }))
  }))
);
