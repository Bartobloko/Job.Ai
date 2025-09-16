import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { SettingsStore } from '../../utils/state/settings/settings.state';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [
    ReactiveFormsModule
  ],
  templateUrl: './settings.component.html',
  styleUrls: ['./settings.component.scss']
})
export class SettingsComponent implements OnInit {
  private fb = inject(FormBuilder);

  settingsForm: FormGroup;
  readonly settingsStore = inject(SettingsStore);

  constructor() {
    this.settingsForm = this.fb.group({
      // Profile settings
      firstName: [''],
      lastName: [''],
      aboutMe: [''],

      // Integration settings
      linkedInCookie: [''],
      justJoinLinks: [''],
      theProtocolLinks: [''],
      noFluffJobsLinks: [''],
      linkedInLinks: [''],
      talentLinks: ['']
    });
  }

  ngOnInit() {
    // Load settings from the store
    this.settingsStore.loadSettings().then(() => {
      this.settingsForm.patchValue({
        firstName: this.settingsStore.first_name(),
        lastName: this.settingsStore.last_name(),
        aboutMe: this.settingsStore.about_me(),
        linkedInCookie: this.settingsStore.linkedIn_li_at_cookie(),
        justJoinLinks: this.settingsStore.justJoin_links(),
        theProtocolLinks: this.settingsStore.theProtocol_links(),
        noFluffJobsLinks: this.settingsStore.noFluffJobs_links(),
        linkedInLinks: this.settingsStore.linkedIn_links(),
        talentLinks: this.settingsStore.talent_links()
      });
    });
  }

  onSaveSettings() {
    if (this.settingsForm.valid) {
      const updatedSettings = {
        first_name: this.settingsForm.get('firstName')?.value,
        last_name: this.settingsForm.get('lastName')?.value,
        about_me: this.settingsForm.get('aboutMe')?.value,
        linkedIn_li_at_cookie: this.settingsForm.get('linkedInCookie')?.value || '',
        justJoin_links: this.settingsForm.get('justJoinLinks')?.value,
        theProtocol_links: this.settingsForm.get('theProtocolLinks')?.value,
        noFluffJobs_links: this.settingsForm.get('noFluffJobsLinks')?.value,
        linkedIn_links: this.settingsForm.get('linkedInLinks')?.value,
        talent_links: this.settingsForm.get('talentLinks')?.value
      };

      this.settingsStore.updateSettings(updatedSettings);
    }
  }
}
