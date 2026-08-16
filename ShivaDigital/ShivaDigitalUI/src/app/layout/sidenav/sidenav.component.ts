import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidenav',
  imports: [RouterModule, CommonModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  standalone: true
})
export class SidenavComponent {
  navLinks: NavLink[] = [];
  expandedLinks = new Set<string>();
  constructor(private authService: AuthService) {
    // Filter nav links based on role requirements
    this.navLinks = NAV_LINKS.filter(link => !link.requiresRole || this.authService.role === link.requiresRole);
  }

  toggleCollapse(link: NavLink) {
    if (!link.label) return;
    if (this.expandedLinks.has(link.label)) {
      this.expandedLinks.delete(link.label);
    } else {
      this.expandedLinks.add(link.label);
    }
  }

  isExpanded(link: NavLink): boolean {
    return this.expandedLinks.has(link.label);
  }
}

export interface NavLink {
  label: string;
  route?: string;
  icon?: string;
  children?: NavLink[];
  requiresRole?: number;
}

export const NAV_LINKS: NavLink[] = [
  {
    label: 'Home',
    route: '/home',
    icon: 'home',
  },
  { label: 'Customer', route: '/customer', icon: 'person' },
  { label: 'Bill', route: '/bill', icon: 'receipt' },
  { label: 'Bill Search', route: '/bill-search', icon: 'search' },
  { label: 'Payment Search', route: '/payment-search', icon: 'payment' },
  { label: 'Correction Report', route: '/correction-report', icon: 'report' },
  { label: 'Inventory Report', route: '/inventory', icon: 'report', requiresRole: 1 },
  { label: 'Profile', route: '/settings/profile', icon: 'person' },
  { label: 'Security', route: '/settings/security', icon: 'security' }

];
