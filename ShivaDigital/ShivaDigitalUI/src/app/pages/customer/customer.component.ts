import { Component } from '@angular/core';
import { Customer } from '../../services/customer.service';
import { CustomerFormComponent } from '../customer-form/customer-form.component';
import { CustomerListComponent } from '../customer-list/customer-list.component';

@Component({
  selector: 'app-customer',
  standalone: true,
  imports: [
    CustomerFormComponent,
    CustomerListComponent
  ],
  templateUrl: './customer.component.html',
  styleUrl: './customer.component.scss'
})
export class CustomerComponent {
  selectedCustomer: Customer | null = null;
  refreshToken = 0;

  onEdit(customer: Customer) {
    this.selectedCustomer = customer;
  }

  onSaved() {
    this.selectedCustomer = null;
    this.refreshToken++;
  }

  onCancel() {
    this.selectedCustomer = null;
  }
}
