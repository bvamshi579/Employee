import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SimpleChange } from '@angular/core';
import { of } from 'rxjs';
import { CustomerListComponent } from './customer-list.component';
import { CustomerService } from '../../services/customer.service';

describe('CustomerListComponent', () => {
  let component: CustomerListComponent;
  let fixture: ComponentFixture<CustomerListComponent>;
  let customerService: jasmine.SpyObj<CustomerService>;

  beforeEach(async () => {
    const customerServiceSpy = jasmine.createSpyObj('CustomerService', ['getCustomers', 'deleteCustomer']);
    customerServiceSpy.getCustomers.and.returnValue(of([
      { CustomerID: 1, CustomerName: 'A', MobileNumber: '1234567890', Address: 'Address 1', PanNumber: 'PAN1', AadharNumber: 'AAD1' },
      { CustomerID: 2, CustomerName: 'B', MobileNumber: '1234567890', Address: 'Address 2', PanNumber: 'PAN2', AadharNumber: 'AAD2' },
      { CustomerID: 3, CustomerName: 'C', MobileNumber: '1234567890', Address: 'Address 3', PanNumber: 'PAN3', AadharNumber: 'AAD3' }
    ]));

    await TestBed.configureTestingModule({
      imports: [CustomerListComponent],
      providers: [{ provide: CustomerService, useValue: customerServiceSpy }]
    }).compileComponents();

    fixture = TestBed.createComponent(CustomerListComponent);
    component = fixture.componentInstance;
    customerService = TestBed.inject(CustomerService) as jasmine.SpyObj<CustomerService>;
  });

  it('should reload data when the refresh token changes', () => {
    component.ngOnInit();
    component.ngOnChanges({ refreshToken: new SimpleChange(0, 1, false) });

    expect(customerService.getCustomers).toHaveBeenCalledTimes(2);
  });

  it('should paginate customers into the current page slice', () => {
    component.pageSize = 2;
    component.customers = [
      { CustomerID: 1, CustomerName: 'A', MobileNumber: '1234567890', Address: '1', PanNumber: 'P1', AadharNumber: 'A1' },
      { CustomerID: 2, CustomerName: 'B', MobileNumber: '1234567890', Address: '2', PanNumber: 'P2', AadharNumber: 'A2' },
      { CustomerID: 3, CustomerName: 'C', MobileNumber: '1234567890', Address: '3', PanNumber: 'P3', AadharNumber: 'A3' }
    ];
    component.updatePagedCustomers();

    expect(component.totalPages).toBe(2);
    expect(component.pagedCustomers.length).toBe(2);
    expect(component.pagedCustomers[0].CustomerID).toBe(1);
  });
});
