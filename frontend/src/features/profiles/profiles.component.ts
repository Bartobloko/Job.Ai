import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ProfilesStore } from '../../utils/state/profiles/profiles.state';
import { BotProfile, CreateProfileRequest } from '../../utils/data-acces/profiles/profiles.service';

@Component({
  selector: 'app-profiles',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule
  ],
  templateUrl: './profiles.component.html',
  styleUrls: ['./profiles.component.scss']
})
export class ProfilesComponent implements OnInit {
  private fb = inject(FormBuilder);
  readonly profilesStore = inject(ProfilesStore);

  profileForm: FormGroup;
  editingProfile: BotProfile | null = null;
  showCreateForm = false;

  constructor() {
    this.profileForm = this.fb.group({
      name: ['', Validators.required],
      custom_prompt: ['', Validators.required],
      experience_level: ['', Validators.required],
      blocked_keywords: [''],
      ai_model: ['phi4']
    });
  }

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    await this.profilesStore.loadProfiles();
    await this.profilesStore.loadActiveProfile();
  }

  onCreateProfile() {
    this.showCreateForm = true;
    this.editingProfile = null;
    this.profileForm.reset({
      name: '',
      custom_prompt: '',
      experience_level: '',
      blocked_keywords: '',
      ai_model: 'phi4'
    });
  }

  onEditProfile(profile: BotProfile) {
    this.showCreateForm = true;
    this.editingProfile = profile;
    this.profileForm.patchValue({
      name: profile.name,
      custom_prompt: profile.custom_prompt,
      experience_level: profile.experience_level,
      blocked_keywords: profile.blocked_keywords,
      ai_model: profile.ai_model
    });
  }

  onCancelEdit() {
    this.showCreateForm = false;
    this.editingProfile = null;
    this.profileForm.reset();
  }

  async onSaveProfile() {
    if (this.profileForm.valid) {
      const formValue = this.profileForm.value;
      const profileData: CreateProfileRequest = {
        name: formValue.name,
        custom_prompt: formValue.custom_prompt,
        experience_level: formValue.experience_level,
        blocked_keywords: formValue.blocked_keywords || '',
        ai_model: formValue.ai_model || 'phi4'
      };

      if (this.editingProfile) {
        // Update existing profile
        await this.profilesStore.updateProfile(this.editingProfile.id, profileData);
      } else {
        // Create new profile
        await this.profilesStore.createProfile(profileData);
      }

      this.onCancelEdit();
    }
  }

  async onActivateProfile(profile: BotProfile) {
    if (!profile.is_active) {
      await this.profilesStore.activateProfile(profile.id);
    }
  }

  async onDeleteProfile(profile: BotProfile) {
    if (confirm(`Are you sure you want to delete the profile "${profile.name}"?`)) {
      await this.profilesStore.deleteProfile(profile.id);
    }
  }

  onClearError() {
    this.profilesStore.clearError();
  }
}