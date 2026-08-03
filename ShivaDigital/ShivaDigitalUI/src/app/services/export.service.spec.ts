import { ExportService } from './export.service';

describe('ExportService', () => {
  let service: ExportService;

  beforeEach(() => {
    service = new ExportService();
  });

  it('builds csv content with headers and rows', () => {
    const csv = service.buildCsv(
      [
        { Name: 'Alice', Amount: 100 },
        { Name: 'Bob', Amount: 200 }
      ],
      ['Name', 'Amount'],
      'test-export'
    );

    expect(csv).toContain('Name,Amount');
    expect(csv).toContain('Alice,100');
    expect(csv).toContain('Bob,200');
  });
});
