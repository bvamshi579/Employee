import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService, SheetInventory, SheetInventoryTx, SheetOption, FileSizeOption } from '../../services/bill.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  providers: [DatePipe]
})
export class InventoryComponent implements OnInit {
  // Controls whether the summaries panel is collapsed
  summariesCollapsed = false;
  sheetType = 'Lab';
  sheets: SheetOption[] = [];
  inventory: SheetInventory[] = [];
    sheetSummary: SheetInventory[] = [];
    fileSizeSummary: SheetInventory[] = [];
  transactions: SheetInventoryTx[] = [];
  selectedSheetId: number | null = null;
  searchText = '';
  txFilter = 'ALL';
  fromDate = '';
  toDate = '';
  quantityToAdd = 0;
  txType: 'IN' | 'OUT' = 'IN';
  sourceType = 'Manual';
  sourceRef = '';
  comment = '';
  performedBy = '';
  selectedFileSize?: number | null = null;
  txDate = this.formatDateForInput(new Date());
  message = '';
  error = '';
  fileSizes: FileSizeOption[] = [];
  summarySelectedSheetId?: number | null = null;
  summarySelectedFileSize?: number | null = null;

  constructor(private billService: BillService, private datePipe: DatePipe) {}

  toggleSummaries() {
    this.summariesCollapsed = !this.summariesCollapsed;
  }

  ngOnInit(): void {
    this.loadSheets();
    this.loadFileSizes();
    this.loadInventory();
    this.loadSheetSummary();
    this.loadFileSizeSummary();
    this.loadTransactions();
    this.loadFileSizes();
  }

  onSheetSelected() {
    if (this.selectedSheetId) {
      this.selectedFileSize = null;
    }
    this.loadTransactions();
  }

  onFileSizeSelected() {
    if (this.selectedFileSize) {
      this.selectedSheetId = null;
    }
    this.loadTransactions();
  }

  get filteredInventory(): SheetInventory[] {
    const term = this.searchText.trim().toLowerCase();
    return this.inventory.filter((item) => {
      const matchesText = !term || (item.Name || '').toLowerCase().includes(term);
      const matchesSheet = !this.selectedSheetId || item.SheetTypeID === this.selectedSheetId;
      return matchesText && matchesSheet;
    });
  }

  get totalOnHand(): number {
    return this.inventory.reduce((sum, item) => sum + (item.Quantity ?? 0), 0);
  }

  loadSheets() {
    this.billService.getSheets(this.sheetType).subscribe({
      next: (s) => {
        this.sheets = s || [];
        // Do not auto-select the first sheet here; leave `selectedSheetId` null
        // so transaction ledger filters (date/txType) show file-size transactions.
      },
      error: () => this.error = 'Unable to load sheets.'
    });
  }

  loadInventory() {
    if (this.selectedFileSize != null) {
      // specific file-size bucket
      this.billService.getInventoryByFileSize(this.selectedFileSize).subscribe({
        next: (i) => this.inventory = i || [],
        error: () => this.error = 'Unable to load inventory.'
      });
    } else if (this.selectedSheetId != null) {
      // specific sheet-type view
      this.billService.getInventory(this.sheetType).subscribe({
        next: (i) => this.inventory = i || [],
        error: () => this.error = 'Unable to load inventory.'
      });
    } else {
      // no specific selection: show summary of all file-size inventory
      this.billService.getInventoryAllByFileSize().subscribe({
        next: (i) => this.inventory = i || [],
        error: () => this.error = 'Unable to load inventory.'
      });
    }
  }

  loadSheetSummary() {
    this.billService.getInventory(this.sheetType).subscribe({
      next: (rows) => {
        this.sheetSummary = rows || [];
        if (this.sheetSummary.length && this.summarySelectedSheetId == null) {
          this.summarySelectedSheetId = null; // default: show all
        }
      },
      error: () => this.error = 'Unable to load sheet summary.'
    });
  }

  loadFileSizeSummary() {
    this.billService.getInventoryAllByFileSize().subscribe({
      next: (rows) => {
        this.fileSizeSummary = rows || [];
        if (this.fileSizeSummary.length && this.summarySelectedFileSize == null) {
          this.summarySelectedFileSize = null;
        }
      },
      error: () => this.error = 'Unable to load file-size summary.'
    });
  }

  loadTransactions() {
    const sheetId = this.selectedSheetId ?? undefined;
    const fSize = this.selectedFileSize ?? undefined;
    // Ensure we send date-only values (YYYY-MM-DD) so server-side filtering ignores time
    const startDate = this.fromDate ? String(this.fromDate).split('T')[0] : undefined;
    const endDate = this.toDate ? String(this.toDate).split('T')[0] : undefined;
    this.billService.getInventoryTransactions(sheetId, fSize, startDate || undefined, endDate || undefined, this.txFilter === 'ALL' ? undefined : this.txFilter).subscribe({
      next: (rows) => this.transactions = rows || [],
      error: () => this.error = 'Unable to load inventory transactions.'
    });
  }

  addInventory() {
    const hasSheet = (this.selectedSheetId ?? null) != null;
    const hasFile = (this.selectedFileSize ?? null) != null;
    if (!hasSheet && !hasFile) {
      this.error = 'Select either a sheet or a file size.';
      return;
    }
    if (hasSheet && hasFile) {
      this.error = 'Select only one: sheet or file size.';
      return;
    }
    if (!this.quantityToAdd || this.quantityToAdd <= 0) {
      this.error = 'Enter a valid positive quantity.';
      return;
    }

    this.billService.addInventory(this.selectedSheetId ?? null, Number(this.quantityToAdd), this.selectedFileSize ?? undefined).subscribe({
      next: () => {
        this.message = 'Inventory updated successfully.';
        this.error = '';
        this.quantityToAdd = 0;
        this.loadInventory();
        this.loadTransactions();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Failed to update inventory.';
        this.message = '';
      }
    });
  }

  addManualTransaction() {
    const hasSheet = (this.selectedSheetId ?? null) != null;
    const hasFile = (this.selectedFileSize ?? null) != null;
    if (!hasSheet && !hasFile) {
      this.error = 'Select either a sheet or a file size.';
      return;
    }
    if (hasSheet && hasFile) {
      this.error = 'Select only one: sheet or file size.';
      return;
    }
    if (!this.quantityToAdd || this.quantityToAdd <= 0) {
      this.error = 'Provide a positive quantity.';
      return;
    }

    const qty = Number(this.quantityToAdd);
    const request: any = {
      sheetTypeID: this.selectedSheetId ?? null,
      txType: this.txType,
      quantity: qty,
      sourceType: this.sourceType,
      sourceRef: this.sourceRef || 'Manual',
      performedBy: this.performedBy || 'System',
      comment: this.comment || 'Manual inventory adjustment',
      fileSize: this.selectedFileSize ?? undefined
    };

    this.billService.addInventoryTransaction(request).subscribe({
      next: () => {
        this.message = `Manual ${this.txType} transaction saved.`;
        this.error = '';
        this.quantityToAdd = 0;
        this.sourceRef = '';
        this.comment = '';
        this.performedBy = '';
        this.txDate = this.formatDateForInput(new Date());
        this.loadInventory();
        this.loadTransactions();
      },
      error: (err) => {
        // Show detailed server response when available to aid debugging
        const status = err?.status;
        const serverMsg = err?.error?.message || err?.error || err?.message;
        this.error = serverMsg ? `Error ${status}: ${serverMsg}` : 'Unable to save the manual inventory transaction.';
        this.message = '';
        console.error('Inventory transaction save failed', err);
      }
    });
  }

  loadFileSizes() {
    this.billService.getFileSizes().subscribe({
      next: (rows) => this.fileSizes = rows || [],
      error: () => this.error = 'Unable to load file sizes.'
    });
  }

  private formatDateForInput(d?: Date | string): string {
    const date = d ? (d instanceof Date ? d : new Date(d)) : new Date();
    const pad = (n: number) => String(n).padStart(2, '0');
    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());
    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  }

  getSheetName(sheetTypeId?: number): string {
    return this.sheets.find((sheet) => sheet.SheetTypeID === sheetTypeId)?.Name || 'Unknown';
  }

  getFileSizeName(fileSizeId?: number): string {
    if (fileSizeId == null) return '—';
    return this.fileSizes.find((f) => f.ID === fileSizeId)?.FileSize || String(fileSizeId);
  }

  get filteredSheetSummary(): SheetInventory[] {
    // kept for backward compatibility but replaced by expanded view
    if (!this.sheetSummary || this.sheetSummary.length === 0) return [];
    if (this.summarySelectedSheetId == null) return this.sheetSummary;
    return this.sheetSummary.filter(i => i.SheetTypeID === this.summarySelectedSheetId);
  }

  get aggregatedSheetSummary(): SheetInventory[] {
    if (!this.sheetSummary || this.sheetSummary.length === 0) return [];
    const map = new Map<number | undefined, SheetInventory>();
    for (const s of this.sheetSummary) {
      var key = s.SheetTypeID;
      if (!map.has(key)) {
        map.set(key, { SheetTypeID: s.SheetTypeID, Name: s.Name, Quantity: s.Quantity ?? 0 });
      } else {
        var existing = map.get(key)!;
        existing.Quantity = (existing.Quantity ?? 0) + (s.Quantity ?? 0);
      }
    }
    return Array.from(map.values());
  }

  get filteredAggregatedSheetSummary(): SheetInventory[] {
    const term = this.searchText.trim().toLowerCase();
    let list = this.aggregatedSheetSummary;
    if (this.summarySelectedSheetId != null) list = list.filter(i => i.SheetTypeID === this.summarySelectedSheetId);
    if (term) list = list.filter(i => (i.Name || '').toLowerCase().includes(term));
    return list;
  }

  get filteredFileSizeSummary(): SheetInventory[] {
    if (!this.fileSizeSummary || this.fileSizeSummary.length === 0) return [];
    if (this.summarySelectedFileSize == null) return this.fileSizeSummary;
    return this.fileSizeSummary.filter(i => i.FileSize === this.summarySelectedFileSize);
  }

  get fullFileSizeSummary(): SheetInventory[] {
    // Ensure we show every configured file size even when there's no inventory row
    const map = new Map<number, number>();
    (this.fileSizeSummary || []).forEach(s => {
      if (s.FileSize != null) map.set(s.FileSize, s.Quantity ?? 0);
    });
    const out: SheetInventory[] = [];
    (this.fileSizes || []).forEach(f => {
      const id = f.ID ?? 0;
      out.push({ SheetTypeID: undefined, Name: f.FileSize ?? String(id), FileSize: id, Quantity: map.get(id) ?? 0 });
    });
    return out;
  }

  get filteredFullFileSizeSummary(): SheetInventory[] {
    const term = (this.searchText || '').trim().toLowerCase();
    let list = this.fullFileSizeSummary;
    if (this.summarySelectedFileSize != null) list = list.filter(i => i.FileSize === this.summarySelectedFileSize);
    if (term) list = list.filter(i => (i.Name || '').toLowerCase().includes(term));
    return list;
  }

  get expandedSheetSummary(): SheetInventory[] {
    // produce one row per sheet x fileSize; if file-size bucket doesn't exist show Quantity=0
    if (!this.sheets || this.sheets.length === 0) return [];
    const sizes = (this.fileSizes || []).map(f => f.ID).filter(id => id != null) as number[];
    // if no sizes configured, fall back to raw sheetSummary
    if (!sizes.length) return this.sheetSummary || [];

    const map = new Map<string, number>();
    (this.sheetSummary || []).forEach(s => {
      const key = `${s.SheetTypeID ?? 0}_${s.FileSize ?? 0}`;
      map.set(key, s.Quantity ?? 0);
    });

    const out: SheetInventory[] = [];
    for (const sh of this.sheets) {
      for (const fs of sizes) {
        const key = `${sh.SheetTypeID ?? 0}_${fs}`;
        const qty = map.get(key) ?? 0;
        out.push({ SheetTypeID: sh.SheetTypeID ?? undefined, Name: sh.Name, FileSize: fs, Quantity: qty });
      }
    }

    return out;
  }

  get filteredExpandedSheetSummary(): SheetInventory[] {
    const term = this.searchText.trim().toLowerCase();
    const list = this.expandedSheetSummary;
    let filtered = list;
    if (this.summarySelectedSheetId != null) filtered = filtered.filter(i => i.SheetTypeID === this.summarySelectedSheetId);
    if (term) filtered = filtered.filter(i => (i.Name || '').toLowerCase().includes(term));
    return filtered;
  }

  formatDate(value?: string): string {
    if (!value) return '';
    return this.datePipe.transform(value, 'dd-MMM-yyyy HH:mm') ?? value;
  }

  get isManualTransactionValid(): boolean {
    const hasSheet = this.selectedSheetId != null;
    const hasFile = this.selectedFileSize != null;
    return (hasSheet !== hasFile) && (this.quantityToAdd > 0);
  }
}
