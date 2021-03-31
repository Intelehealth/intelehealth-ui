import { Component, OnInit } from '@angular/core';
import { FormGroup, FormControl, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from 'src/app/services/auth.service';
import { SessionService } from 'src/app/services/session.service';
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
    private authService: AuthService
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
    const value = this.loginForm.value;
    const string = `${value.username}:${value.password}`;
    const base64 = btoa(string);
    saveToStorage('session', base64);
    this.sessionService.loginSession(base64).subscribe(response => {
      if (response.authenticated === true) {
        this.sessionService.provider(response.user.uuid).subscribe((provider) => {
          if (provider.results[0].attributes.length === 0) {
            this.router.navigate(['/myAccount']);
          } else {
            this.router.navigate(['/home']);
          }

        }, (error) => {
          this.router.navigate(['home']);
        })
        this.authService.sendToken(response.user.sessionId);
        saveToStorage('user', response.user);
        this.snackbar.open(`Welcome ${response.user.person.display}`, null, { duration: 4000 });
      } else {
        this.snackbar.open('Username & Password doesn\'t match', null, { duration: 4000 });
      }
    });
  }
}