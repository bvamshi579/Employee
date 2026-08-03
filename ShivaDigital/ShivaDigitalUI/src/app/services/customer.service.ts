import { Injectable, Inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../app.tokens';

export interface Customer {
  CustomerID?: number;
  CustomerName: string;
  MobileNumber: string;
  Address: string;
  PanNumber?: string;
  AadharNumber?: string;
}

@Injectable({ providedIn: 'root' })
export class CustomerService {
  private apiUrl = '';

  constructor(private http: HttpClient, @Inject(API_BASE) private apiBase: string) {
    this.apiUrl = `${this.apiBase || ''}/customers`;
  }

  getCustomers(): Observable<Customer[]> {
    return this.http.get<Customer[]>(this.apiUrl);
  }

  getCustomer(id: number): Observable<Customer> {
    return this.http.get<Customer>(`${this.apiUrl}/${id}`);
  }

  addCustomer(customer: Customer): Observable<Customer> {
    return this.http.post<Customer>(this.apiUrl, customer);
  }

  updateCustomer(customer: Customer): Observable<Customer> {
    return this.http.put<Customer>(`${this.apiUrl}/${customer.CustomerID}`, customer);
  }

  deleteCustomer(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
