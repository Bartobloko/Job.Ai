import {Settings} from '../../interfaces/settings';
import {patchState, signalStore, withComputed, withHooks, withMethods, withState} from '@ngrx/signals';
import {firstValueFrom} from 'rxjs';
import {SettingsService} from '../../data-acces/settings/settings.service';
import {computed, inject} from '@angular/core';

const initialState: Settings = {
  experience_level: '',
  custom_prompt: '',
  blocked_keywords: '',
  first_name: null,
  last_name: null,
  about_me: null,
  cv_path: null,
  linkedIn_li_at_cookie: '',
  ai_model: '',
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
          experience_level: settings.experience_level,
          custom_prompt: settings.custom_prompt,
          blocked_keywords: settings.blocked_keywords,
          first_name: settings.first_name,
          last_name: settings.last_name,
          about_me: settings.about_me,
          cv_path: settings.cv_path,
          linkedIn_li_at_cookie: settings.linkedIn_li_at_cookie,
          ai_model: settings.ai_model,
          updated_at: settings.updated_at
        });
        console.log('loaded settings', settings);
      },
      async updateSettings(settings: Partial<Settings>) {
        // Get current full settings to merge with the updates
        const currentSettings = {
          experience_level: store.experience_level(),
          custom_prompt: store.custom_prompt(),
          blocked_keywords: store.blocked_keywords(),
          first_name: store.first_name(),
          last_name: store.last_name(),
          about_me: store.about_me(),
          cv_path: store.cv_path(),
          linkedIn_li_at_cookie: store.linkedIn_li_at_cookie(),
          ai_model: store.ai_model(),
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
    shortSettings: computed(() => {
      return {
        experience_level: state.experience_level,
        custom_prompt: state.custom_prompt,
        blocked_keywords: state.blocked_keywords
      }
    })
  }))
);
