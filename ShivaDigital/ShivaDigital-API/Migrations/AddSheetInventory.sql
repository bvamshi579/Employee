-- Adds table to track sheet inventory levels
IF NOT EXISTS (SELECT * FROM sys.objects WHERE object_id = OBJECT_ID(N'dbo.vvtblSheetInventory') AND type in (N'U'))
BEGIN
    CREATE TABLE dbo.vvtblSheetInventory (
        SheetTypeID INT NOT NULL PRIMARY KEY,
        Quantity INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_vvtblSheetInventory_Sheets FOREIGN KEY (SheetTypeID) REFERENCES dbo.vvtblSheets(ID)
    );
END

-- Note: run this script against your database to create the inventory table.
