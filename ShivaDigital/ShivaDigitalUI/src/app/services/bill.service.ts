import { Injectable, Inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_BASE } from '../app.tokens';

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
  PaymentDate?: string;
  PaymentAmount?: number;
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
  CorrectionUserID?: number;
  CorrectionUserName?: string;
}

export interface SheetOption {
  SheetTypeID?: number;
  Name?: string;
  Amount?: number;
  SheetType?: string;
}

export interface SheetInventory {
  SheetTypeID?: number;
  Name?: string;
  Quantity?: number;
  FileSize?: number;
}

export interface SheetInventoryTx {
  TxID?: number;
  SheetTypeID?: number;
  TxDate?: string;
  TxType?: string;
  Quantity?: number;
  SourceType?: string;
  SourceRef?: string;
  PerformedBy?: string;
  Comment?: string;
  FileSize?: number;
  BalanceAfter?: number;
}

export interface FileSizeOption {
  ID?: number;
  FileSize?: string;
}

export interface CorrectionUser {
  CorrectionUserID?: number;
  Name?: string;
}

export interface BillSheetSummary {
  BillID?: number;
  Lines?: BillLine[];
}

@Injectable({ providedIn: 'root' })
export class BillService {
  private apiUrl = '';

  constructor(private http: HttpClient, @Inject(API_BASE) private apiBase: string) {
    this.apiUrl = `${this.apiBase || ''}/bills`;
  }

  getBills(): Observable<Bill[]> {
    return this.http.get<Bill[]>(this.apiUrl);
  }

  searchBills(fromDate?: string, toDate?: string): Observable<Bill[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<Bill[]>(`${this.apiUrl}/search`, { params });
  }

  searchBillsByPaymentDate(fromDate?: string, toDate?: string): Observable<Bill[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    return this.http.get<Bill[]>(`${this.apiUrl}/search/payments`, { params });
  }

  getSheets(sheetType: string): Observable<SheetOption[]> {
    return this.http.get<SheetOption[]>(`${this.apiUrl}/sheets/${sheetType}`);
  }

  getCorrectionUsers(): Observable<CorrectionUser[]> {
    return this.http.get<CorrectionUser[]>(`${this.apiUrl}/correction-users`);
  }

  searchBillsByCorrectionUser(fromDate?: string, toDate?: string, correctionUserId?: number): Observable<BillSheetSummary[]> {
    let params = new HttpParams();
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (correctionUserId != null) params = params.set('correctionUserId', String(correctionUserId));
    return this.http.get<BillSheetSummary[]>(`${this.apiUrl}/search/by-correction-user`, { params });
  }

  getFileSizes(): Observable<FileSizeOption[]> {
    return this.http.get<FileSizeOption[]>(`${this.apiUrl}/filesizes`);
  }

  getInventory(sheetType: string): Observable<SheetInventory[]> {
    return this.http.get<SheetInventory[]>(`${this.apiUrl}/inventory/${sheetType}`);
  }

  getInventoryByFileSize(fileSize: number): Observable<SheetInventory[]> {
    return this.http.get<SheetInventory[]>(`${this.apiUrl}/inventory/filesize/${fileSize}`);
  }

  getInventoryAllByFileSize(): Observable<SheetInventory[]> {
    return this.http.get<SheetInventory[]>(`${this.apiUrl}/inventory/filesizes/summary`);
  }

  addInventory(sheetTypeId: number | null | undefined, quantity: number, fileSize?: number): Observable<void> {
    const payload: any = { quantity };
    if (sheetTypeId != null) payload.sheetTypeID = sheetTypeId;
    if (fileSize != null) payload.fileSize = fileSize;
    return this.http.post<void>(`${this.apiUrl}/inventory`, payload);
  }

  getInventoryTransactions(sheetTypeId?: number, fileSize?: number, fromDate?: string, toDate?: string, txType?: string, page?: number, pageSize?: number): Observable<SheetInventoryTx[]> {
    let params = new HttpParams();
    if (sheetTypeId != null) params = params.set('sheetTypeId', String(sheetTypeId));
    if (fileSize != null) params = params.set('fileSize', String(fileSize));
    if (fromDate) params = params.set('fromDate', fromDate);
    if (toDate) params = params.set('toDate', toDate);
    if (txType) params = params.set('txType', txType);
    if (page) params = params.set('page', String(page));
    if (pageSize) params = params.set('pageSize', String(pageSize));
    return this.http.get<SheetInventoryTx[]>(`${this.apiUrl}/inventory/transactions`, { params });
  }

  addInventoryTransaction(req: { sheetTypeID?: number | null; txType: string; quantity: number; sourceType?: string; sourceRef?: string; performedBy?: string; comment?: string; fileSize?: number }): Observable<void> {
    const payload: any = { txType: req.txType, quantity: req.quantity };
    if (req.sheetTypeID != null) payload.sheetTypeID = req.sheetTypeID;
    if (req.sourceType) payload.sourceType = req.sourceType;
    if (req.sourceRef) payload.sourceRef = req.sourceRef;
    if (req.performedBy) payload.performedBy = req.performedBy;
    if (req.comment) payload.comment = req.comment;
    if (req.fileSize != null) payload.fileSize = req.fileSize;
    return this.http.post<void>(`${this.apiUrl}/inventory/transactions`, payload);
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
