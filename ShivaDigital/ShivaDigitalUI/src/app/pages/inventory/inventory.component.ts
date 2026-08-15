import { Component, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService, SheetInventory, SheetInventoryTx, SheetOption } from '../../services/bill.service';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './inventory.component.html',
  styleUrls: ['./inventory.component.scss'],
  providers: [DatePipe]
})
export class InventoryComponent implements OnInit {
  sheetType = 'Lab';
  sheets: SheetOption[] = [];
  inventory: SheetInventory[] = [];
  transactions: SheetInventoryTx[] = [];
  selectedSheetId: number | null = null;
  searchText = '';
  txFilter = 'ALL';
  fromDate = '';
  toDate = '';
  quantityToAdd = 0;
  txType: 'IN' | 'OUT' = 'OUT';
  sourceType = 'Manual';
  sourceRef = '';
  comment = '';
  performedBy = '';
  txDate = new Date().toISOString().slice(0, 16);
  message = '';
  error = '';

  constructor(private billService: BillService, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.loadSheets();
    this.loadInventory();
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
        if (!this.selectedSheetId && this.sheets.length) {
          this.selectedSheetId = this.sheets[0].SheetTypeID ?? null;
        }
      },
      error: () => this.error = 'Unable to load sheets.'
    });
  }

  loadInventory() {
    this.billService.getInventory(this.sheetType).subscribe({
      next: (i) => this.inventory = i || [],
      error: () => this.error = 'Unable to load inventory.'
    });
  }

  loadTransactions() {
    const sheetId = this.selectedSheetId ?? undefined;
    this.billService.getInventoryTransactions(sheetId, this.fromDate || undefined, this.toDate || undefined, this.txFilter === 'ALL' ? undefined : this.txFilter).subscribe({
      next: (rows) => this.transactions = rows || [],
      error: () => this.error = 'Unable to load inventory transactions.'
    });
  }

  addInventory() {
    if (!this.selectedSheetId || !this.quantityToAdd || this.quantityToAdd <= 0) {
      this.error = 'Select a sheet and enter a valid positive quantity.';
      return;
    }

    this.billService.addInventory(this.selectedSheetId, Number(this.quantityToAdd)).subscribe({
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
    if (!this.selectedSheetId || !this.quantityToAdd || this.quantityToAdd <= 0) {
      this.error = 'Select a sheet and provide a positive quantity.';
      return;
    }

    const qty = Number(this.quantityToAdd);
    const request = {
      sheetTypeID: this.selectedSheetId,
      txType: this.txType,
      quantity: qty,
      sourceType: this.sourceType,
      sourceRef: this.sourceRef || 'Manual',
      performedBy: this.performedBy || 'System',
      comment: this.comment || 'Manual inventory adjustment'
    };

    this.billService.addInventoryTransaction(request).subscribe({
      next: () => {
        this.message = `Manual ${this.txType} transaction saved.`;
        this.error = '';
        this.quantityToAdd = 0;
        this.sourceRef = '';
        this.comment = '';
        this.performedBy = '';
        this.txDate = new Date().toISOString().slice(0, 16);
        this.loadInventory();
        this.loadTransactions();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Unable to save the manual inventory transaction.';
        this.message = '';
      }
    });
  }

  getSheetName(sheetTypeId?: number): string {
    return this.sheets.find((sheet) => sheet.SheetTypeID === sheetTypeId)?.Name || 'Unknown';
  }

  formatDate(value?: string): string {
    if (!value) return '';
    return this.datePipe.transform(value, 'dd-MMM-yyyy HH:mm') ?? value;
  }
}
