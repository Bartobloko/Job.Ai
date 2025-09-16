import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AccountCreateFormComponent } from './account-create-form.component';

describe('AccountCreateFormComponent', () => {
  let component: AccountCreateFormComponent;
  let fixture: ComponentFixture<AccountCreateFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AccountCreateFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AccountCreateFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
