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
  role?: number | null = null;

  constructor(private router: Router, private http: HttpClient, @Inject(API_BASE) private apiBase: string) {
    this.apiUrl = `${this.apiBase || ''}/auth/login`;
    // restore persisted login state
    try {
      const stored = localStorage.getItem('auth.isLoggedIn');
      this.isLoggedIn = stored === 'true';
      const storedRole = localStorage.getItem('auth.role');
      this.role = storedRole ? Number(storedRole) : null;
    } catch {
      this.isLoggedIn = false;
    }
  }

  login(username: string, password: string): Observable<boolean> {
    return this.http.post<AuthResult>(this.apiUrl, { userName: username, password }).pipe(
      map((response) => {
        this.isLoggedIn = response?.isValid === true;
        this.role = response?.role ?? null;
        try { localStorage.setItem('auth.isLoggedIn', this.isLoggedIn ? 'true' : 'false'); } catch {}
        try { if (this.role != null) localStorage.setItem('auth.role', String(this.role)); else localStorage.removeItem('auth.role'); } catch {}
        return this.isLoggedIn;
      }),
      catchError(() => {
        this.isLoggedIn = false;
        try { localStorage.setItem('auth.isLoggedIn', 'false'); } catch {}
        return of(false);
      })
    );
  }

  logout() {
    this.isLoggedIn = false;
    this.role = null;
    try { localStorage.removeItem('auth.isLoggedIn'); } catch {}
    try { localStorage.removeItem('auth.role'); } catch {}
    this.router.navigate(['/login']);
  }

  isAuthenticated(): boolean {
    return this.isLoggedIn;
  }
}
