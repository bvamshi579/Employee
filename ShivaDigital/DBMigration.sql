ALTER TABLE vvtblbill DISABLE TRIGGER ALL;
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
    -- Inventory buckets: either a SheetTypeID OR a FileSize, tracked separately.
    CREATE TABLE dbo.vvtblSheetInventory (
        InventoryID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SheetTypeID INT NULL,
        FileSize INT NULL,
        Quantity INT NOT NULL DEFAULT 0,
        CONSTRAINT CK_vvtblSheetInventory_EitherOne CHECK (
            (CASE WHEN SheetTypeID IS NULL THEN 0 ELSE 1 END) + (CASE WHEN FileSize IS NULL THEN 0 ELSE 1 END) = 1
        )
    );
    -- Ensure uniqueness of the bucket key (SheetTypeID, FileSize)
    CREATE UNIQUE INDEX UX_vvtblSheetInventory_Sheet_File ON dbo.vvtblSheetInventory (SheetTypeID, FileSize);
END
ELSE
BEGIN
    -- Existing databases are out of scope for this fresh-schema script. If you need migration logic,
    -- add it separately. For now, do nothing when table exists.
END
-- Migration: AddSheetInventoryTx.sql
-- Creates a transaction ledger for sheet inventory movements

IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.vvtblSheetInventoryTx') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.vvtblSheetInventoryTx (
        TxID INT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        SheetTypeID INT NULL,
        FileSize INT NULL,
        TxDate DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        TxType VARCHAR(10) NOT NULL, -- 'IN' or 'OUT'
        Quantity INT NOT NULL,
        SourceType VARCHAR(32) NULL, -- e.g. 'Bill', 'Manual', 'Purchase'
        SourceRef VARCHAR(128) NULL, -- e.g. BillID or reference number
        PerformedBy VARCHAR(128) NULL,
        Comment VARCHAR(512) NULL,
        BalanceAfter INT NULL,
        CONSTRAINT CK_vvtblSheetInventoryTx_EitherOne CHECK (
            (CASE WHEN SheetTypeID IS NULL THEN 0 ELSE 1 END) + (CASE WHEN FileSize IS NULL THEN 0 ELSE 1 END) = 1
        )
    );

    CREATE INDEX IX_vvtblSheetInventoryTx_SheetDate ON dbo.vvtblSheetInventoryTx (SheetTypeID, TxDate DESC);
    CREATE INDEX IX_vvtblSheetInventoryTx_FileSizeDate ON dbo.vvtblSheetInventoryTx (FileSize, TxDate DESC);
END

-- Note: This script only creates the ledger table. Application code should insert
-- rows into this table whenever inventory changes (manual adjustments or bill create/update),
-- and may set BalanceAfter based on the resulting inventory level.
