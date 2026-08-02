import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Customer, CustomerService } from '../../services/customer.service';
import { Bill, BillLine, BillPayment, BillService, SheetOption, FileSizeOption } from '../../services/bill.service';

@Component({
  selector: 'app-bill',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './bill.component.html',
  styleUrl: './bill.component.scss'
})
export class BillComponent implements OnInit {
  isEditMode = false;
  currentBillId: number | null = null;
  customers: Customer[] = [];
  bills: Bill[] = [];
  searchBills: Bill[] = [];
  searchFromDate = '';
  searchToDate = '';
  searchLoading = false;
  searchError = '';
  selectedPaymentBill: Bill | null = null;
  paymentAmountForBill = 0;
  paymentMessage = '';
  paymentError = '';
  // filtering and paging
  billIdFilter = '';
  page = 1;
  pageSize = 10;
  sheetOptions: SheetOption[] = [];
  fileSizes: FileSizeOption[] = [];
  selectedCustomerId: number | null = null;
  selectedCustomerName = '';
  customerSearch = '';
  filteredCustomers: Customer[] = [];
  files = '';
  fileSize: number | '' = '';
  bookingTime = '';
  deliveryTime = '';
  total = 0;
  subtotal = 0;
  payable = 0;
  advance = 0;
  balancePaid = 0;
  due = 0;
  discount = 0;
  billType = 'Lab';
  message = '';
  toastMessage = '';
  toastType: 'success' | 'error' | '' = '';
  fieldErrors: {
    customer?: string;
    files?: string;
    fileSize?: string;
    bookingTime?: string;
    deliveryTime?: string;
    lines?: string;
  } = {};
  lines: BillLine[] = [];
  payments: BillPayment[] = [];
  paymentAmount = 0;

  constructor(
    private customerService: CustomerService,
    private billService: BillService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit() {
    this.loadCustomers();
    this.loadSheets();
    this.loadFileSizes();
    this.resetLines();
    this.setDefaultSearchDateRange();
    this.loadSearchBills();
    // default booking time to now for new bills
    this.bookingTime = this.formatDateForInput(new Date().toISOString());
  }

  trackBySheetType(_index: number, item: BillLine) {
    return item.SheetTypeID ?? item.SheetName ?? _index;
  }

  private setDefaultSearchDateRange() {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    this.searchFromDate = this.formatDateOnly(from);
    this.searchToDate = this.formatDateOnly(to);
  }

  private formatDateOnly(date: Date): string {
    const pad = (value: number) => String(value).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
  }

  loadCustomers() {
    this.customerService.getCustomers().subscribe({
      next: (data) => {
        this.customers = data;
        this.filteredCustomers = data;
      },
      error: () => this.message = 'Unable to load customers.'
    });
  }

  loadBills() {
    this.billService.getBills().subscribe({
      next: (data) => this.bills = data,
      error: () => this.message = 'Unable to load bills.'
    });
  }

  loadSearchBills() {
    this.searchLoading = true;
    this.searchError = '';
    this.paymentMessage = '';
    this.paymentError = '';

    this.billService.searchBills(this.searchFromDate, this.searchToDate).subscribe({
      next: (data) => {
        this.searchBills = data || [];
        this.searchLoading = false;
      },
      error: () => {
        this.searchLoading = false;
        this.searchError = 'Unable to load bills for the selected date range.';
      }
    });
  }

  selectPaymentBill(bill: Bill) {
    this.selectedPaymentBill = bill;
    this.paymentAmountForBill = 0;
    this.paymentError = '';
    this.paymentMessage = '';
  }

  addPaymentToSelectedBill() {
    if (!this.selectedPaymentBill?.BillID) {
      this.paymentError = 'Please select a bill first.';
      return;
    }

    if (!this.paymentAmountForBill || this.paymentAmountForBill <= 0) {
      this.paymentError = 'Enter a valid payment amount.';
      return;
    }

    this.billService.addPayment(this.selectedPaymentBill.BillID, this.paymentAmountForBill).subscribe({
      next: () => {
        this.paymentAmountForBill = 0;
        this.paymentMessage = 'Payment added successfully.';
        this.loadSearchBills();
      },
      error: () => {
        this.paymentError = 'Unable to add the payment.';
      }
    });
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

  loadSheets() {
    this.billService.getSheets('Lab').subscribe({
      next: (data) => {
        this.sheetOptions = data;
        this.resetLines();
      },
      error: () => (this.message = 'Unable to load sheet options.')
    });
  }

  loadFileSizes() {
    this.billService.getFileSizes().subscribe({
      next: (data) => {
        this.fileSizes = data || [];
      },
      error: () => (this.message = 'Unable to load file sizes.')
    });
  }

  filterCustomers() {
    const term = this.customerSearch.toLowerCase().trim();
    if (term.length < 3) {
      this.filteredCustomers = [];
      return;
    }

    this.filteredCustomers = this.customers.filter((customer) => {
      const fullText = `${customer.CustomerName || ''} ${customer.MobileNumber || ''}`.toLowerCase();
      return fullText.includes(term);
    });
  }

  selectCustomer(customer: Customer) {
    this.selectedCustomerId = customer.CustomerID ?? null;
    this.selectedCustomerName = customer.CustomerName || '';
    this.customerSearch = `${customer.CustomerName} (${customer.MobileNumber})`;
    this.filteredCustomers = [];
    this.loadCustomerBills();
    // when starting a new bill for a selected customer, default booking time
    if (!this.bookingTime) {
      this.bookingTime = this.formatDateForInput(new Date().toISOString());
    }
  }

  loadCustomerBills() {
    if (!this.selectedCustomerId) {
      this.bills = [];
      return;
    }

    this.billService.getBills().subscribe({
      next: (data) => {
        this.bills = data.filter((bill) => bill.CustomerID === this.selectedCustomerId);
        // reset paging and filters when loading for a new customer
        this.page = 1;
        this.billIdFilter = '';
      },
      error: () => (this.message = 'Unable to load bills.')
    });
  }

  get filteredBills(): Bill[] {
    const idTerm = (this.billIdFilter || '').toString().trim();
    if (!idTerm) return this.bills;
    const num = Number(idTerm);
    if (!isNaN(num) && idTerm !== '') {
      return this.bills.filter((b) => b.BillID === num || String(b.BillID)?.includes(idTerm));
    }
    return this.bills.filter((b) => (b.BillID ? String(b.BillID).includes(idTerm) : false));
  }

  get pagedBills(): Bill[] {
    const start = (this.page - 1) * this.pageSize;
    return this.filteredBills.slice(start, start + this.pageSize);
  }

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.filteredBills.length / this.pageSize));
  }

  onFilterChange() {
    this.page = 1;
  }

  prevPage() {
    if (this.page > 1) this.page--;
  }

  nextPage() {
    if (this.page < this.totalPages) this.page++;
  }

  resetLines() {
    this.lines = this.sheetOptions.map((sheet) => ({
      SheetTypeID: sheet.SheetTypeID,
      SheetName: sheet.Name,
      Quantity: 0,
      Price: sheet.Amount,
      Amount: 0
    }));
  }

  calculateLineAmount(line: BillLine) {
    const quantity = Number(line.Quantity ?? 0);
    const price = Number(line.Price ?? 0);
    line.Quantity = quantity;
    line.Amount = quantity * price;
    this.recalculateTotals();
    this.cdr.detectChanges();
  }

  onQuantityInput(line: BillLine) {
    this.calculateLineAmount(line);
  }

  private isSameDate(a: Date, b: Date) {
    return a.getFullYear() === b.getFullYear()
      && a.getMonth() === b.getMonth()
      && a.getDate() === b.getDate();
  }

  private computePaymentTotals() {
    const bookingDate = this.bookingTime ? new Date(this.bookingTime) : null;
    this.advance = this.payments
      .filter((payment) => payment.AmountPaid && payment.PaymentDate && bookingDate && this.isSameDate(bookingDate, new Date(payment.PaymentDate)))
      .reduce((sum, payment) => sum + (payment.AmountPaid ?? 0), 0);
    this.balancePaid = this.payments.reduce((sum, payment) => sum + (payment.AmountPaid ?? 0), 0);
  }

  recalculateTotals() {
    this.computePaymentTotals();
    const subtotal = this.lines.reduce((sum, line) => sum + (line.Amount ?? 0), 0);
    const discountValue = this.discount || 0;
    this.subtotal = Math.max(0, subtotal);
    this.total = this.subtotal; // total should not include discount
    this.payable = Math.max(0, this.subtotal - discountValue);
    this.due = Math.max(0, this.payable - (this.balancePaid || 0));
  }

  get printableLines(): BillLine[] {
    return this.lines.filter((line) => (line.Quantity ?? 0) > 0);
  }

  get printableFileSize(): string | null {
    if (!this.fileSize && this.fileSize !== 0) return null;
    const id = typeof this.fileSize === 'number' ? this.fileSize : Number(this.fileSize);
    const found = this.fileSizes.find((f) => f.ID === id);
    return found ? found.FileSize ?? String(id) : String(id);
  }

  get printableBooking(): Date | null {
    if (!this.bookingTime) return null;
    const d = new Date(this.bookingTime);
    return isNaN(d.getTime()) ? null : d;
  }

  get printableDelivery(): Date | null {
    if (!this.deliveryTime) return null;
    const d = new Date(this.deliveryTime);
    return isNaN(d.getTime()) ? null : d;
  }

  printBill() {
    window.print();
  }

  formatDateForInput(dateStr?: string) {
    const d = dateStr ? new Date(dateStr) : new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = d.getFullYear();
    const month = pad(d.getMonth() + 1);
    const day = pad(d.getDate());
    const hours = pad(d.getHours());
    const minutes = pad(d.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  addPayment() {
    if (!this.paymentAmount || this.paymentAmount <= 0) return;
    this.payments.push({
      PaymentDate: `${this.formatDateForInput(new Date().toISOString())}:00`,
      AmountPaid: this.paymentAmount
    });
    this.paymentAmount = 0;
    this.computePaymentTotals();
    this.recalculateTotals();
  }

  saveBill() {
    if (!this.validateBill()) return;

    this.computePaymentTotals();

    const bill: Bill = {
      BillID: this.currentBillId ?? undefined,
      CustomerID: this.selectedCustomerId ?? undefined,
      Files: this.files,
      FileSize: Number(this.fileSize) || 0,
      BookingTime: this.bookingTime ? `${this.bookingTime}:00` : `${this.formatDateForInput()}:00`,
      DeliveryTime: this.deliveryTime ? `${this.deliveryTime}:00` : `${this.formatDateForInput()}:00`,
      Total: this.total,
      Advance: this.advance,
      BalancePaid: this.balancePaid,
      Discount: this.discount,
      BillType: this.billType,
      Lines: this.lines.filter((line) => (line.Quantity ?? 0) > 0),
      AdvancePayments: this.payments
    };

    if (this.currentBillId) {
      this.billService.updateBill(bill).subscribe({
        next: (updated) => {
          this.showToast('Bill updated successfully.', 'success');
          this.loadCustomerBills();
          this.editBill(updated);
        },
        error: () => this.showToast('Failed to update bill.', 'error')
      });
    } else {
      this.billService.createBill(bill).subscribe({
        next: (created) => {
          this.showToast('Bill saved successfully.', 'success');
          // reload list for the selected customer
          this.loadCustomerBills();
          // open created bill in edit mode
          this.editBill(created);
        },
        error: () => this.showToast('Failed to save bill.', 'error')
      });
    }
  }

  showToast(message: string, type: 'success' | 'error') {
    this.toastMessage = message;
    this.toastType = type;
    window.setTimeout(() => {
      this.toastMessage = '';
      this.toastType = '';
    }, 3200);
  }

  validateBill() {
    this.fieldErrors = {};
    this.message = '';

    if (!this.selectedCustomerId) {
      this.fieldErrors.customer = 'Please select a customer.';
    }
    if (!this.files || !this.files.trim()) {
      this.fieldErrors.files = 'Files is required.';
    }
    if (!this.fileSize) {
      this.fieldErrors.fileSize = 'File size is required.';
    }
    if (!this.bookingTime) {
      this.fieldErrors.bookingTime = 'Booking time is required.';
    }
    if (!this.deliveryTime) {
      this.fieldErrors.deliveryTime = 'Delivery time is required.';
    }
    if (this.bookingTime && this.deliveryTime) {
      const booking = new Date(this.bookingTime);
      const delivery = new Date(this.deliveryTime);
      if (delivery.getTime() < booking.getTime()) {
        this.fieldErrors.deliveryTime = 'Delivery time must be greater than or equal to booking time.';
      }
    }
    const selectedLines = this.lines.filter((l) => (l.Quantity ?? 0) > 0);
    if (!selectedLines.length) {
      this.fieldErrors.lines = 'At least one sheet quantity must be greater than zero.';
    }

    if (Object.keys(this.fieldErrors).length) {
      this.message = this.fieldErrors.customer || this.fieldErrors.files || this.fieldErrors.fileSize || this.fieldErrors.bookingTime || this.fieldErrors.deliveryTime || this.fieldErrors.lines || 'Please correct the highlighted fields.';
      return false;
    }

    return true;
  }

  editBill(bill: Bill) {
    if (!bill) return;
    // if bill lines are missing from the list payload, fetch full bill
    if ((!bill.Lines || bill.Lines.length === 0) && bill.BillID) {
      this.billService.getBill(bill.BillID).subscribe({
        next: (full) => this.openBillForEdit(full),
        error: () => this.message = 'Unable to load bill details.'
      });
      return;
    }
    this.openBillForEdit(bill);
  }

  openBillForEdit(bill: Bill) {
    this.isEditMode = true;
    this.currentBillId = bill.BillID ?? null;
    this.selectedCustomerId = bill.CustomerID ?? null;
    this.selectedCustomerName = bill.CustomerName || '';
    this.customerSearch = this.selectedCustomerName;
    this.files = bill.Files || '';
    // ensure fileSizes are loaded and then set the selected value so the <select> binds correctly
    const assignFileSize = () => {
      this.fileSize = bill.FileSize != null ? bill.FileSize : '';
    };

    if (this.fileSizes && this.fileSizes.length) {
      assignFileSize();
    } else {
      this.billService.getFileSizes().subscribe({
        next: (data) => {
          this.fileSizes = data || [];
          assignFileSize();
        },
        error: () => {
          // keep whatever value
          assignFileSize();
        }
      });
    }
    this.bookingTime = this.formatDateForInput(bill.BookingTime || undefined);
    this.deliveryTime = this.formatDateForInput(bill.DeliveryTime || undefined);
    this.discount = bill.Discount || 0;
    this.billType = bill.BillType || 'Lab';
    this.payments = bill.AdvancePayments || [];
    this.computePaymentTotals();
    // map lines to sheet options if available, otherwise use provided lines
    const mapLines = (sheetOpts: SheetOption[]) => {
      const linesMap = new Map<number, BillLine>();
      (bill.Lines || []).forEach((l) => {
        if (l.SheetTypeID != null) linesMap.set(l.SheetTypeID, l);
      });
      this.lines = sheetOpts.map((s) => {
        const found = linesMap.get(s.SheetTypeID ?? -1);
        const qty = found?.Quantity ?? 0;
        const amt = found?.Amount ?? 0;
        return {
          SheetTypeID: s.SheetTypeID,
          SheetName: s.Name,
          Quantity: Number(qty ?? 0),
          Price: s.Amount,
          Amount: Number(amt ?? 0)
        } as BillLine;
      });
    };

    if (this.sheetOptions && this.sheetOptions.length) {
      mapLines(this.sheetOptions);
    } else {
      // fetch sheet options then map so bindings work
      this.billService.getSheets(this.billType || 'Lab').subscribe({
        next: (data) => {
          this.sheetOptions = data || [];
          mapLines(this.sheetOptions);
          this.cdr.detectChanges();
        },
        error: () => {
          // fallback to bill lines if sheets cannot be loaded
          this.lines = (bill.Lines || []).map(l => ({ ...l, Quantity: Number(l.Quantity ?? 0), Amount: Number(l.Amount ?? 0) } as BillLine));
        }
      });
    }
    this.recalculateTotals();
    this.cdr.detectChanges();
  }
}
