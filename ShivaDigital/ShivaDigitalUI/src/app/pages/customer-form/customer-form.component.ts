import { Component, EventEmitter, Input, Output, OnInit } from '@angular/core';
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
export class CustomerFormComponent implements OnInit {
  @Input() customer: Customer | null = null;
  @Output() saved = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  customerForm: FormGroup;
  loading = false;
  error = '';

  constructor(private fb: FormBuilder, private customerService: CustomerService) {
    this.customerForm = this.fb.group({
      mgr_CustomerID: [null],
      cusomerName: ['', Validators.required],
      mobileNumber: ['', [Validators.required, Validators.pattern(/^\d{10}$/)]],
      address: ['', Validators.required]
    });
  }

  ngOnInit() {
    if (this.customer) {
      this.customerForm.patchValue(this.customer);
    }
  }

  ngOnChanges() {
    if (this.customer) {
      this.customerForm.patchValue(this.customer);
    } else {
      this.customerForm.reset();
    }
  }

  saveCustomer() {
    if (this.customerForm.invalid) return;
    this.loading = true;
    const customer = this.customerForm.value as Customer;
    if (customer.mgr_CustomerID) {
      this.customerService.updateCustomer(customer).subscribe({
        next: () => { this.saved.emit(); this.loading = false; },
        error: () => { this.error = 'Failed to update customer'; this.loading = false; }
      });
    } else {
      this.customerService.addCustomer(customer).subscribe({
        next: () => { this.saved.emit(); this.loading = false; },
        error: () => { this.error = 'Failed to add customer'; this.loading = false; }
      });
    }
  }

  onCancel() {
    this.cancel.emit();
    this.customerForm.reset();
  }
}
