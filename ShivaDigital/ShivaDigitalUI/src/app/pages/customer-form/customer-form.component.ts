import { Component, EventEmitter, Input, Output, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Customer, CustomerService } from '../../services/customer.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './customer-form.component.html',
  styleUrl: './customer-form.component.scss'
})
export class CustomerFormComponent implements OnInit, OnChanges {
  @Input() customer: Customer | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  customerForm: FormGroup;
  loading = false;
  error = '';
  toastMessage = '';
  toastType: 'success' | 'error' | '' = '';
  submitAttempted = false;

  constructor(private fb: FormBuilder, private customerService: CustomerService) {
    this.customerForm = this.fb.group({
      CustomerID: [null],
      CustomerName: ['', [Validators.required, Validators.minLength(3)]],
      MobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      Address: ['', [Validators.required, Validators.minLength(5)]],
      PanNumber: ['', [Validators.pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)]],
      AadharNumber: ['', [Validators.pattern(/^\d{12}$/)]]
    });
  }

  ngOnInit() {
    this.applyCustomerToForm();
  }

  ngOnChanges(changes: SimpleChanges) {
    if (changes['customer']) {
      this.applyCustomerToForm();
    }
  }

  private applyCustomerToForm() {
    this.submitAttempted = false;
    if (this.customer) {
      this.customerForm.patchValue(this.customer);
    } else {
      this.customerForm.reset({
        CustomerID: null,
        CustomerName: '',
        MobileNumber: '',
        Address: '',
        PanNumber: '',
        AadharNumber: ''
      });
    }
  }

  private markAllTouched() {
    Object.values(this.customerForm.controls).forEach((control) => control.markAsTouched());
  }

  saveCustomer() {
    this.submitAttempted = true;
    this.error = '';

    if (this.customerForm.invalid) {
      this.markAllTouched();
      return;
    }

    this.loading = true;
    const customer = this.customerForm.value as Customer;
    if (customer.CustomerID) {
      this.customerService.updateCustomer(customer).subscribe({
        next: () => {
          this.showToast('Customer updated successfully.', 'success');
          this.saved.emit();
          this.loading = false;
        },
        error: () => {
          this.showToast('Failed to update customer.', 'error');
          this.loading = false;
        }
      });
    } else {
      this.customerService.addCustomer(customer).subscribe({
        next: () => {
          this.showToast('Customer added successfully.', 'success');
          this.customerForm.reset({
            CustomerID: null,
            CustomerName: '',
            MobileNumber: '',
            Address: '',
            PanNumber: '',
            AadharNumber: ''
          });
          this.submitAttempted = false;
          this.saved.emit();
          this.loading = false;
        },
        error: () => {
          this.showToast('Failed to add customer.', 'error');
          this.loading = false;
        }
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

  onCancel() {
    this.cancel.emit();
    this.submitAttempted = false;
    this.error = '';
    this.customerForm.reset({
      CustomerID: null,
      CustomerName: '',
      MobileNumber: '',
      Address: '',
      PanNumber: '',
      AadharNumber: ''
    });
  }
}
