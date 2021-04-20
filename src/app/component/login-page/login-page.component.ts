import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/services/auth.service';
import { SessionService } from 'src/app/services/session.service';
import { PushNotificationsService } from 'src/app/services/push-notification.service';
import { MatDialog } from '@angular/material/dialog';
import { ChangePasswordComponent } from '../change-password/change-password.component';
// declare var saveToStorage: any;
declare var getFromStorage: any, saveToStorage: any, deleteFromStorage: any;
@Component({
  selector: "app-login-page",
  templateUrl: "./login-page.component.html",
  styleUrls: ["./login-page.component.css"],
})
export class LoginPageComponent implements OnInit {
  submitted = false;
  loginForm = new FormGroup({
    username: new FormControl("", [
      Validators.required,
      Validators.maxLength(12),
    ]),
    password: new FormControl("", [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(12),
    ]),
  });

  fieldTextType: boolean;
  constructor(
    private sessionService: SessionService,
    private router: Router,
    private snackbar: MatSnackBar,
    private authService: AuthService,
    private pushNotificationsService: PushNotificationsService,
    private dialog: MatDialog
  ) {}

  ngOnInit() {
    const isLoggedIn: boolean = this.authService.isLoggedIn();
    if (isLoggedIn) {
      this.router.navigateByUrl("/home");
    }
  }

  toggleFieldTextType() {
    this.fieldTextType = !this.fieldTextType;
  }

  /**
   * Login form control
   */
  get controls() {
    return this.loginForm.controls;
  }

  /**
   * Take username and password from the login form
   * and create session and save base65 session to localStorage
   */
  onSubmit() {
    this.submitted = true;
    if (!this.loginForm.invalid) {
      const value = this.loginForm.value;
      const string = `${value.username}:${value.password}`;
      const base64 = btoa(string);
      saveToStorage("session", base64);
      this.sessionService.loginSession(base64).subscribe((response) => {
        if (response.authenticated === true) {
          this.sessionService.provider(response.user.uuid).subscribe(
            (provider) => {
            
              this.authService.sendToken(response.user.sessionId);
              saveToStorage("user", response.user);
              saveToStorage("provider",  provider.results[0]);
              this.pushNotificationsService.getUserSettings(response.user.uuid).subscribe((response) => {
                if(response['data'].isChange == 0){
                  this.dialog.open(ChangePasswordComponent, { width: '500px', data: {isChange: false } });
                }
              })

              if (provider.results[0].attributes.length === 0) {
                this.router.navigate(["/myAccount"]);
              } else {
                this.router.navigate(["/home"]);
              }
              this.snackbar.open(`Welcome ${provider.results[0].person.display}`, null, {
                duration: 4000,
              });
            },
            (error) => {
              this.router.navigate(["home"]);
            }
          );
          
        } else {
          this.snackbar.open("Username & Password doesn't match", null, {
            duration: 4000,
          });
        }
      });
    }
  }
}