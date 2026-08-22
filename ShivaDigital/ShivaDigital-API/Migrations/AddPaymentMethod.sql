IF COL_LENGTH('dbo.vvtblBillPayment', 'PaymentMethod') IS NULL
BEGIN
    ALTER TABLE dbo.vvtblBillPayment
        ADD PaymentMethod VARCHAR(20) NOT NULL
            CONSTRAINT DF_vvtblBillPayment_PaymentMethod DEFAULT 'Others';
END

IF EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_vvtblBillPayment_PaymentMethod'
      AND parent_object_id = OBJECT_ID('dbo.vvtblBillPayment')
)
BEGIN
    ALTER TABLE dbo.vvtblBillPayment
        DROP CONSTRAINT CK_vvtblBillPayment_PaymentMethod;
END

IF COL_LENGTH('dbo.vvtblBillPayment', 'PaymentMethod') IS NOT NULL
BEGIN
    ALTER TABLE dbo.vvtblBillPayment
        ADD CONSTRAINT CK_vvtblBillPayment_PaymentMethod
        CHECK (PaymentMethod IN ('UPI', 'Cash', 'Others'));
END