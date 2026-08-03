import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { Customer, CustomerService } from '../../services/customer.service';
import { ExportService } from '../../services/export.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Bill, BillService } from '../../services/bill.service';
import { Router } from '@angular/router';

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

  constructor(
    private customerService: CustomerService,
    private exportService: ExportService
    ,
    private billService: BillService,
    private router: Router
  ) {}

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

  // recent-bills modal state
  showRecentModal = false;
  recentModalLoading = false;
  recentModalCustomerName = '';
  recentModalCustomerId: number | undefined;
  recentBills: Bill[] = [];
  recentModalPage = 1;
  recentModalPageSize = 6;
  recentModalShowDueOnly = false;

  openRecentBills(customer: Customer) {
    this.recentModalLoading = true;
    this.recentModalCustomerName = customer.CustomerName || '';
    this.recentModalCustomerId = customer.CustomerID;
    this.billService.getBills().subscribe({
      next: (data) => {
        const id = customer.CustomerID;
        const bills = (data || []).filter((b) => b.CustomerID === id);
        // sort by BillDate desc if present otherwise BillID desc
        bills.sort((a, b) => {
          const aTime = a.BillDate ? new Date(a.BillDate).getTime() : (a.BillID ?? 0);
          const bTime = b.BillDate ? new Date(b.BillDate).getTime() : (b.BillID ?? 0);
          return bTime - aTime;
        });
        this.recentBills = bills;
        this.recentModalLoading = false;
        this.recentModalPage = 1;
        this.showRecentModal = true;
      },
      error: () => {
        this.recentModalLoading = false;
        this.recentBills = [];
        this.showRecentModal = true;
      }
    });
  }

  closeRecentModal() {
    this.showRecentModal = false;
    this.recentBills = [];
    this.recentModalCustomerName = '';
    this.recentModalCustomerId = undefined;
  }

  getPayable(bill: Bill): number {
    return Math.max(0, (bill.Total ?? 0) - (bill.Discount ?? 0));
  }

  getTotalPaid(bill: Bill): number {
    return bill.BalancePaid ?? 0;
  }

  getBalanceDue(bill: Bill): number {
    return Math.max(0, this.getPayable(bill) - this.getTotalPaid(bill));
  }

  exportRecentModalBills() {
    const filtered = this.recentModalShowDueOnly ? this.recentBills.filter((b) => this.getBalanceDue(b) > 0) : this.recentBills;
    const rows = filtered.map((b) => ({
      BillID: b.BillID,
      BillDate: b.BillDate,
      Total: b.Total,
      Discount: b.Discount,
      Payable: this.getPayable(b),
      TotalPaid: this.getTotalPaid(b),
      BalanceDue: this.getBalanceDue(b),
      Advance: b.Advance
    }));
    this.exportService.buildCsv(rows, ['BillID', 'BillDate', 'Total', 'Discount', 'Payable', 'TotalPaid', 'BalanceDue', 'Advance'], `recent-bills-${this.recentModalCustomerName}`);
  }

  get recentModalTotalPages(): number {
    return Math.max(1, Math.ceil((this.recentBills || []).length / this.recentModalPageSize));
  }

  get recentModalPagedBills(): Bill[] {
    const collection = this.recentModalShowDueOnly ? (this.recentBills || []).filter((b) => this.getBalanceDue(b) > 0) : (this.recentBills || []);
    const start = (this.recentModalPage - 1) * this.recentModalPageSize;
    return collection.slice(start, start + this.recentModalPageSize);
  }

  recentModalPrev() {
    if (this.recentModalPage > 1) this.recentModalPage--;
  }

  recentModalNext() {
    if (this.recentModalPage < this.recentModalTotalPages) this.recentModalPage++;
  }

  openBillFromModal(bill: Bill) {
    this.closeRecentModal();
    const params: any = { billId: bill.BillID };
    if (this.recentModalCustomerId) params.customerId = this.recentModalCustomerId;
    this.router.navigate(['/bill'], { queryParams: params });
  }

  goToPage(page: number) {
    if (page < 1 || page > this.totalPages) {
      return;
    }
    this.currentPage = page;
    this.updatePagedCustomers();
  }

  exportCustomers() {
    this.exportService.buildCsv(
      this.filteredCustomers,
      ['CustomerName', 'MobileNumber', 'Address', 'PanNumber', 'AadharNumber'],
      'customers'
    );
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
