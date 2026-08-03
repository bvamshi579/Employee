import { Injectable, Inject } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { API_BASE } from '../app.tokens';

interface AuthResult {
  isValid: boolean;
  userName?: string;
  role?: number;
  isActive?: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private isLoggedIn = false;
  private apiUrl = '';

  constructor(private router: Router, private http: HttpClient, @Inject(API_BASE) private apiBase: string) {
    this.apiUrl = `${this.apiBase || ''}/auth/login`;
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<AuthResult>(this.apiUrl, { userName: username, password }).pipe(
      map((response) => {
        this.isLoggedIn = response?.isValid === true;
        return this.isLoggedIn;
      }),
      catchError(() => {
        this.isLoggedIn = false;
        return of(false);
      })
    );
  }

  logout() {
    this.isLoggedIn = false;
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}
