import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { Customer, CustomerService } from '../../services/customer.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit {
  customers: Customer[] = [];
  loading = false;
  error = '';

  @Output() edit = new EventEmitter<Customer>();
  @Output() deleted = new EventEmitter<void>();

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading = true;
    this.customerService.getCustomers().subscribe({
      next: (data) => { this.customers = data; this.loading = false; },
      error: () => { this.error = 'Failed to load customers'; this.loading = false; }
    });
  }

  onEdit(customer: Customer) {
    this.edit.emit(customer);
  }

  onDelete(id: number | undefined) {
    if (!id) return;
    if (confirm('Are you sure you want to delete this customer?')) {
      this.customerService.deleteCustomer(id).subscribe(() => {
        this.loadCustomers();
        this.deleted.emit();
      });
    }
  }
}
