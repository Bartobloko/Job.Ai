import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsStore } from '../../utils/state/settings/settings.state';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    DatePipe
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  settingsForm: FormGroup;
  settingsStore = inject(SettingsStore);

  constructor(private fb: FormBuilder) {
    this.settingsForm = this.fb.group({
      // Bot settings (from dashboard)
      prompt: ['', Validators.required],
      experience: ['', Validators.required],
      blockedKeywords: ['', Validators.pattern('^([a-zA-Z0-9]+,\\s?)*[a-zA-Z0-9]+$')],

      // Profile settings
      firstName: [''],
      lastName: [''],
      aboutMe: [''],

      // Integration settings
      linkedInCookie: [''],
      aiModel: ['']
    });
  }

  ngOnInit() {
    // Load settings from the store
    this.settingsStore.loadSettings().then(() => {
      this.settingsForm.patchValue({
        prompt: this.settingsStore.custom_prompt(),
        experience: this.settingsStore.experience_level(),
        blockedKeywords: this.settingsStore.blocked_keywords(),
        firstName: this.settingsStore.first_name(),
        lastName: this.settingsStore.last_name(),
        aboutMe: this.settingsStore.about_me(),
        linkedInCookie: this.settingsStore.linkedIn_li_at_cookie(),
        aiModel: this.settingsStore.ai_model()
      });
    });
  }

  onSaveSettings() {
    if (this.settingsForm.valid) {
      const updatedSettings = {
        custom_prompt: this.settingsForm.get('prompt')?.value || '',
        experience_level: this.settingsForm.get('experience')?.value || '',
        blocked_keywords: this.settingsForm.get('blockedKeywords')?.value || '',
        first_name: this.settingsForm.get('firstName')?.value,
        last_name: this.settingsForm.get('lastName')?.value,
        about_me: this.settingsForm.get('aboutMe')?.value,
        linkedIn_li_at_cookie: this.settingsForm.get('linkedInCookie')?.value || '',
        ai_model: this.settingsForm.get('aiModel')?.value || ''
      };

      this.settingsStore.updateSettings(updatedSettings);
    }
  }
}
