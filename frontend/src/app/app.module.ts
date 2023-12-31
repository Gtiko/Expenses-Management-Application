import { APP_INITIALIZER, NgModule, inject } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app.component';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { DataService } from './auth/data.service';
import { environment as env } from 'src/environments/environment';
import { checkTokenGuard } from './auth/check-token.guard';
import { LoginComponent } from './login.component';
import { SignupComponent } from './signup.component';
import jwt_decode from 'jwt-decode';
import { IState } from './users/IUser.interface';
import { addTokenInterceptor } from './auth/add-token.interceptor';
import { ErrorPageComponent } from './error-page.component';
import { WelcomeComponent } from './welcome.component'
import { ToastrModule } from 'ngx-toastr';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';


import { FontAwesomeModule } from '@fortawesome/angular-fontawesome'

function bootstrap() {
  let userService = inject(DataService);
  return () => {
    const state = localStorage.getItem(env.KEY);
    if (state) {
      const decoded_token: IState = jwt_decode(state);
      decoded_token.token = JSON.parse(state)
      userService.state.set(decoded_token);
    }
  };
}

@NgModule({
  declarations: [AppComponent, LoginComponent, SignupComponent, ErrorPageComponent, WelcomeComponent],
  imports: [
    BrowserModule,
    FormsModule,
    ReactiveFormsModule,
    FontAwesomeModule,
    ToastrModule.forRoot({
      timeOut: 3000, 
      positionClass: 'toast-top-right', 
      preventDuplicates: true,
      closeButton: true
    }),
    BrowserAnimationsModule,
    
    RouterModule.forRoot([

      { path: '', redirectTo: 'welcome', pathMatch: 'full' },
      { path: 'welcome', component: WelcomeComponent },
      { path: 'login', component: LoginComponent },
      { path: 'signup', component: SignupComponent },
      {
        path: 'users',
        loadChildren: () =>
          import('./users/users.module').then((module) => module.UsersModule),
        canActivate: [checkTokenGuard],
      },
      { path: '**', component: ErrorPageComponent },
    ]),
  ],
  providers: [
    provideHttpClient(withInterceptors([addTokenInterceptor])),
    { provide: APP_INITIALIZER, multi: true, useFactory: bootstrap, deps: [] },
  ],
  bootstrap: [AppComponent],
  
})
export class AppModule { }
