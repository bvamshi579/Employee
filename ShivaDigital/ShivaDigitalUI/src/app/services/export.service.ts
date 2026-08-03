import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ExportService {
  buildCsv<T>(rows: T[], headers: string[], filename: string): string {
    const csvRows: string[] = [];
    csvRows.push(headers.join(','));

    rows.forEach((row) => {
      const values = headers.map((header) => {
        const value = (row as Record<string, unknown>)[header];
        const normalized = value == null ? '' : String(value);
        return normalized.replace(/\r?\n/g, ' ').replace(/,/g, ';');
      });
      csvRows.push(values.join(','));
    });

    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${filename}.csv`;
    link.click();
    URL.revokeObjectURL(url);
    return csvRows.join('\n');
  }
}
