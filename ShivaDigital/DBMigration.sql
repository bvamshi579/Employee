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

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.vvtblSheetInventory') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.vvtblSheetInventory (
        SheetTypeID INT NOT NULL,
        FileSize INT NOT NULL DEFAULT 0,
        Quantity INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_vvtblSheetInventory_Sheets FOREIGN KEY (SheetTypeID) REFERENCES dbo.vvtblSheets(ID),
        CONSTRAINT PK_vvtblSheetInventory PRIMARY KEY (SheetTypeID, FileSize)
    );
END
ELSE
BEGIN
    -- If table exists but FileSize column missing, add it and convert PK to composite (SheetTypeID, FileSize)
    IF COL_LENGTH('dbo.vvtblSheetInventory','FileSize') IS NULL
    BEGIN
        ALTER TABLE dbo.vvtblSheetInventory ADD FileSize INT NOT NULL DEFAULT 0;
        -- ensure existing rows have FileSize = 0 (default applied)
        UPDATE dbo.vvtblSheetInventory SET FileSize = 0 WHERE FileSize IS NULL;
        -- drop existing primary key if present and recreate composite PK
        DECLARE @pkname NVARCHAR(128);
        SELECT @pkname = kc.name FROM sys.key_constraints kc WHERE kc.parent_object_id = OBJECT_ID('dbo.vvtblSheetInventory') AND kc.type = 'PK';
        IF @pkname IS NOT NULL
        BEGIN
            EXEC('ALTER TABLE dbo.vvtblSheetInventory DROP CONSTRAINT [' + @pkname + ']');
        END
        ALTER TABLE dbo.vvtblSheetInventory ADD CONSTRAINT PK_vvtblSheetInventory PRIMARY KEY (SheetTypeID, FileSize);
    END
END
-- Migration: AddSheetInventoryTx.sql
-- Creates a transaction ledger for sheet inventory movements

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.vvtblSheetInventoryTx') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.vvtblSheetInventoryTx (
        TxID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SheetTypeID INT NOT NULL,
        TxDate DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        FileSize INT NULL,
        TxType VARCHAR(10) NOT NULL, -- 'IN' or 'OUT'
        Quantity INT NOT NULL,
        SourceType VARCHAR(32) NULL, -- e.g. 'Bill', 'Manual', 'Purchase'
        SourceRef VARCHAR(128) NULL, -- e.g. BillID or reference number
        PerformedBy VARCHAR(128) NULL,
        Comment VARCHAR(512) NULL,
        BalanceAfter INT NULL,
        CONSTRAINT FK_vvtblSheetInventoryTx_Sheets FOREIGN KEY (SheetTypeID) REFERENCES dbo.vvtblSheets(ID)
    );

    CREATE INDEX IX_vvtblSheetInventoryTx_SheetDate ON dbo.vvtblSheetInventoryTx (SheetTypeID, TxDate DESC);
END

-- Note: This script only creates the ledger table. Application code should insert
-- rows into this table whenever inventory changes (manual adjustments or bill create/update),
-- and may set BalanceAfter based on the resulting inventory level.
