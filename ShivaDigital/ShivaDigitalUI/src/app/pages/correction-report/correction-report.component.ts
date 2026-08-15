import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BillService, BillSheetSummary, CorrectionUser, SheetOption, BillLine } from '../../services/bill.service';
import { ExportService } from '../../services/export.service';

@Component({
  selector: 'app-correction-report',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './correction-report.component.html',
  styleUrls: ['./correction-report.component.scss']
})
export class CorrectionReportComponent implements OnInit {
  fromDate = '';
  toDate = '';
  correctionUsers: CorrectionUser[] = [];
  selectedCorrectionUserId: number | null = null;
  rows: BillSheetSummary[] = [];
  sheetOptions: SheetOption[] = [];
  visibleSheets: SheetOption[] = [];
  totals: { [sheetId: number]: number } = {};
  searchGridFilter = '';
  loading = false;
  message = '';

  constructor(private billService: BillService, private exportService: ExportService) {}

  ngOnInit() {
    const to = new Date();
    const from = new Date();
    from.setMonth(from.getMonth() - 1);
    this.fromDate = this.formatDateOnly(from);
    this.toDate = this.formatDateOnly(to);
    this.loadCorrectionUsers();
    this.loadSheets();
  }

  loadSheets() {
    this.billService.getSheets('Lab').subscribe({ next: (s) => { this.sheetOptions = s || []; if (this.rows && this.rows.length) this.computeTotals(); }, error: () => {/* ignore */} });
  }

  private formatDateOnly(d: Date) {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  }

  loadCorrectionUsers() {
    this.billService.getCorrectionUsers().subscribe({ next: (u) => this.correctionUsers = u || [], error: () => this.message = 'Unable to load users' });
  }

  search() {
    if (!this.selectedCorrectionUserId) {
      this.message = 'Select a user.';
      return;
    }
    this.loading = true;
    this.message = '';
    this.billService.searchBillsByCorrectionUser(this.fromDate, this.toDate, this.selectedCorrectionUserId).subscribe({
      next: (data) => { this.rows = data || []; this.computeTotals(); this.loading = false; },
      error: () => { this.message = 'Unable to fetch report'; this.loading = false; }
    });
  }

  export() {
    const headers = ['BillID', ...this.visibleSheets.map(s => s.Name || String(s.SheetTypeID))];
    const csvRows = this.rows.map(r => {
      const row: any = { BillID: r.BillID };
      for (const s of this.visibleSheets) {
        const found = (r.Lines || []).find(l => l.SheetTypeID === s.SheetTypeID);
        row[s.Name || String(s.SheetTypeID)] = found ? (found.Quantity ?? 0) : 0;
      }
      return row;
    });

    this.exportService.buildCsv(csvRows, headers, 'correction-report');
  }

  private computeTotals() {
    this.totals = {};
    for (const s of this.sheetOptions) {
      this.totals[s.SheetTypeID ?? -1] = 0;
    }
    for (const r of this.rows) {
      for (const s of this.sheetOptions) {
        const found = (r.Lines || []).find(l => l.SheetTypeID === s.SheetTypeID);
        this.totals[s.SheetTypeID ?? -1] += found ? (found.Quantity ?? 0) : 0;
      }
    }
    // compute visible sheets: only those where total > 0
    this.visibleSheets = this.sheetOptions.filter(s => (this.totals[s.SheetTypeID ?? -1] ?? 0) > 0);
  }

  get filteredRows(): BillSheetSummary[] {
    const term = (this.searchGridFilter || '').toString().trim().toLowerCase();
    if (!term) return this.rows;
    return this.rows.filter(r => {
      const idMatch = r.BillID ? String(r.BillID).includes(term) : false;
      const sheetMatch = (r.Lines || []).some(l => (l.SheetName || '').toLowerCase().includes(term));
      return idMatch || sheetMatch;
    });
  }

  getQuantity(row: BillSheetSummary, sheetId?: number): number {
    if (!row || !row.Lines || sheetId == null) return 0;
    const found = (row.Lines || []).find(l => l.SheetTypeID === sheetId);
    return found ? (found.Quantity ?? 0) : 0;
  }
}
