import { Component } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-sidenav',
  imports: [RouterModule, CommonModule],
  templateUrl: './sidenav.component.html',
  styleUrl: './sidenav.component.scss',
  standalone: true
})
export class SidenavComponent {
  navLinks: NavLink[] = NAV_LINKS;
  expandedLinks = new Set<string>();

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
  { label: 'Profile', route: '/settings/profile', icon: 'person' },
  { label: 'Security', route: '/settings/security', icon: 'security' }

];
