import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

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
  private apiUrl = 'http://localhost:3600/auth/login';

  constructor(private router: Router, private http: HttpClient) { }

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
