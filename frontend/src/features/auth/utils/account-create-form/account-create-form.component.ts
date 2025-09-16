import { Component } from '@angular/core';
import {FormsModule, ReactiveFormsModule} from "@angular/forms";
import {Router} from '@angular/router';
import {UserService} from '../../../../utils/data-acces/user/user.service';

@Component({
    selector: 'app-account-create-form',
    imports: [
        ReactiveFormsModule,
        FormsModule
    ],
    templateUrl: './account-create-form.component.html',
    styleUrl: './account-create-form.component.scss'
})
export class AccountCreateFormComponent {
  currentStep = 1;

  formData: SetupForm = {
    username: '',
    first_name: '',
    last_name: '',
    about_me: '',
    experience_level:'',
    custom_prompt: '',
    blocked_keywords: '',
    cv_path: '',
    linkedIn_li_at_cookie: '',
    ai_model: 'phi4'
  };

  constructor(
    private router: Router,
    private userService: UserService) {}


  nextStep() {
    if (this.currentStep < 3) {
      this.currentStep++;
    }
  }

  previousStep() {
    if (this.currentStep > 1) {
      this.currentStep--;
    }
  }

  createAccount() {
    this.userService.createUser(this.formData.username);
  }
}


interface SetupForm {
  username: string;
  first_name: string;
  last_name: string;
  about_me: string;
  experience_level:string,
  custom_prompt: string;
  blocked_keywords: string;
  cv_path: string;
  linkedIn_li_at_cookie: string;
  ai_model: string;
}


