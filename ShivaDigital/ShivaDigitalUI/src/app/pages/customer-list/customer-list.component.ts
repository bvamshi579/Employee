import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Customer, CustomerService } from '../../services/customer.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-list.component.html',
  styleUrl: './customer-list.component.scss'
})
export class CustomerListComponent implements OnInit, OnChanges {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  pagedCustomers: Customer[] = [];
  loading = false;
  error = '';
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  searchTerm = '';

  @Input() refreshToken = 0;
  @Output() edit = new EventEmitter<Customer>();
  @Output() deleted = new EventEmitter<void>();

  constructor(private customerService: CustomerService) {}

  ngOnInit() {
    this.loadCustomers();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['refreshToken'] && !changes['refreshToken'].firstChange) {
      this.loadCustomers();
    }
  }

  loadCustomers() {
    this.loading = true;
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.updatePagedCustomers();
        this.loading = false;
      },
      error: () => {
        this.error = 'Failed to load customers';
        this.loading = false;
      }
    });
  }

  applyFilter() {
    this.currentPage = 1;
    this.updatePagedCustomers();
  }

  private filterCustomers(): Customer[] {
    const term = this.searchTerm.toLowerCase().trim();
    if (!term) {
      return this.customers;
    }

    return this.customers.filter((customer) => {
      const values = [
        customer.CustomerName,
        customer.MobileNumber,
        customer.Address,
        customer.PanNumber,
        customer.AadharNumber
      ];

      return values.some((value) => value?.toString().toLowerCase().includes(term));
    });
  }

  updatePagedCustomers() {
    this.filteredCustomers = this.filterCustomers();
    this.totalPages = Math.max(1, Math.ceil(this.filteredCustomers.length / this.pageSize));
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }

    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.pagedCustomers = this.filteredCustomers.slice(startIndex, startIndex + this.pageSize);
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.updatePagedCustomers();
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
