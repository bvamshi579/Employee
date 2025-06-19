import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-header',
  imports: [CommonModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.scss',
  standalone: true
})
export class HeaderComponent implements OnInit {
  showLogout = false;
  isSidenavOpen = true;
  isLoginPage = false;

  constructor(private authService: AuthService, private router: Router) {}

  ngOnInit() {
    const checkLoginRoute = (url: string) => url.startsWith('/login');
    this.isLoginPage = checkLoginRoute(this.router.url);
    this.showLogout = !this.isLoginPage;
    this.router.events.subscribe(() => {
      this.isLoginPage = checkLoginRoute(this.router.url);
      this.showLogout = !this.isLoginPage;
    });
  }

  logout() {
    this.authService.logout();
  }

  toggleSidenav() {
    this.isSidenavOpen = !this.isSidenavOpen;
    const event = new CustomEvent('toggle-sidenav', { detail: this.isSidenavOpen });
    window.dispatchEvent(event);
  }
}
