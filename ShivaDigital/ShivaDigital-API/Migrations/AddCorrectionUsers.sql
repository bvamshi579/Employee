-- Migration: add correction users table and reference on bills
IF OBJECT_ID('dbo.vvtblCorrectionUsers') IS NULL
BEGIN
    CREATE TABLE dbo.vvtblCorrectionUsers (
        CorrectionUserID INT IDENTITY(1,1) PRIMARY KEY,
        [Name] VARCHAR(200) NOT NULL
    );
END

IF COL_LENGTH('dbo.vvtblBill','CorrectionUserID') IS NULL
BEGIN
    ALTER TABLE dbo.vvtblBill ADD CorrectionUserID INT NULL;
END
