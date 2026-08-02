import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface BillLine {
  SheetTypeID?: number;
  SheetName?: string;
  Quantity?: number;
  Price?: number;
  Amount?: number;
}

export interface BillPayment {
  BillPaymentID?: number;
  BillID?: number;
  PaymentDate?: string;
  AmountPaid?: number;
  BillLogID?: number;
}

export interface Bill {
  BillID?: number;
  CustomerID?: number;
  CustomerName?: string;
  MobileNumber?: string;
  BillDate?: string;
  Files?: string;
  FileSize?: number;
  BookingTime?: string;
  DeliveryTime?: string;
  Total?: number;
  Advance?: number;
  BalancePaid?: number;
  Discount?: number;
  BillType?: string;
  Lines?: BillLine[];
  AdvancePayments?: BillPayment[];
}

export interface SheetOption {
  SheetTypeID?: number;
  Name?: string;
  Amount?: number;
  SheetType?: string;
}

export interface FileSizeOption {
  ID?: number;
  FileSize?: string;
}

@Injectable({ providedIn: 'root' })
export class BillService {
  private apiUrl = 'http://localhost:3600/bills';

  constructor(private http: HttpClient) {}

  getBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(this.apiUrl);
  }

  searchBills(fromDate?: string, toDate?: string): Observable<Bill[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<Bill[]>(`${this.apiUrl}/search`, { params });
  }

  getSheets(sheetType: string): Observable<SheetOption[]> {
    return this.http.get<SheetOption[]>(`${this.apiUrl}/sheets/${sheetType}`);
  }

  getFileSizes(): Observable<FileSizeOption[]> {
    return this.http.get<FileSizeOption[]>(`${this.apiUrl}/filesizes`);
  }

  createBill(bill: Bill): Observable<Bill> {
    return this.http.post<Bill>(this.apiUrl, bill);
  }

  updateBill(bill: Bill): Observable<Bill> {
    const id = bill.BillID;
    if (!id) throw new Error('Bill ID required to update');
    return this.http.put<Bill>(`${this.apiUrl}/${id}`, bill);
  }

  getBill(id: number | undefined): Observable<Bill> {
    if (!id) throw new Error('Bill ID required');
    return this.http.get<Bill>(`${this.apiUrl}/${id}`);
  }

  addPayment(billId: number | undefined, paymentAmount: number): Observable<Bill> {
    if (!billId) throw new Error('Bill ID required');
    return this.http.post<Bill>(`${this.apiUrl}/${billId}/payments`, { amountPaid: paymentAmount });
  }
}
