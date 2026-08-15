import { Routes } from '@angular/router';
import { LoginComponent } from './pages/login/login.component';
import { HomeComponent } from './pages/home/home.component';
import { AuthGuard } from './guards/auth.guard';
import { CustomerComponent } from './pages/customer/customer.component';
import { BillComponent } from './pages/bill/bill.component';
import { CorrectionReportComponent } from './pages/correction-report/correction-report.component';

export const routes: Routes = [
  { path: 'login', component: LoginComponent },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'customer', component: CustomerComponent, canActivate: [AuthGuard] },
  { path: 'bill', component: BillComponent, canActivate: [AuthGuard] },
  { path: 'correction-report', component: CorrectionReportComponent, canActivate: [AuthGuard] },
  { path: 'bill-search', component: BillComponent, data: { mode: 'search' }, canActivate: [AuthGuard] },
  { path: 'payment-search', component: BillComponent, data: { mode: 'payment-search' }, canActivate: [AuthGuard] },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' }
];
