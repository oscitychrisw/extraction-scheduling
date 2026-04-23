CREATE TABLE dbo.Employees (
    EmployeeId UNIQUEIDENTIFIER NOT NULL PRIMARY KEY,
    Name NVARCHAR(200) NOT NULL,
    Notes NVARCHAR(1000) NULL,
    IsActive BIT NOT NULL CONSTRAINT DF_Employees_IsActive DEFAULT 1,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Employees_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_Employees_UpdatedAt DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.EmployeeCompetencies (
    EmployeeId UNIQUEIDENTIFIER NOT NULL,
    CompetencyName NVARCHAR(100) NOT NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_EmployeeCompetencies_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_EmployeeCompetencies PRIMARY KEY (EmployeeId, CompetencyName),
    CONSTRAINT FK_EmployeeCompetencies_Employees FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(EmployeeId) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.EmployeeShiftAvailability (
    EmployeeId UNIQUEIDENTIFIER NOT NULL,
    ShiftCode NVARCHAR(20) NOT NULL,
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_EmployeeShiftAvailability_CreatedAt DEFAULT SYSUTCDATETIME(),
    CONSTRAINT PK_EmployeeShiftAvailability PRIMARY KEY (EmployeeId, ShiftCode),
    CONSTRAINT FK_EmployeeShiftAvailability_Employees FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(EmployeeId) ON DELETE CASCADE
);
GO

CREATE TABLE dbo.ScheduleWeeks (
    WeekKey NVARCHAR(50) NOT NULL PRIMARY KEY,
    Status NVARCHAR(30) NOT NULL CONSTRAINT DF_ScheduleWeeks_Status DEFAULT 'Draft',
    CreatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ScheduleWeeks_CreatedAt DEFAULT SYSUTCDATETIME(),
    UpdatedAt DATETIME2(0) NOT NULL CONSTRAINT DF_ScheduleWeeks_UpdatedAt DEFAULT SYSUTCDATETIME()
);
GO

CREATE TABLE dbo.ScheduleAssignments (
    WeekKey NVARCHAR(50) NOT NULL,
    DayName NVARCHAR(20) NOT NULL,
    ShiftCode NVARCHAR(20) NOT NULL,
    SlotCode NVARCHAR(50) NOT NULL,
    EmployeeId UNIQUEIDENTIFIER NULL,
    AssignedBy NVARCHAR(320) NULL,
    AssignedAt DATETIME2(0) NULL,
    CONSTRAINT PK_ScheduleAssignments PRIMARY KEY (WeekKey, DayName, ShiftCode, SlotCode),
    CONSTRAINT FK_ScheduleAssignments_ScheduleWeeks FOREIGN KEY (WeekKey) REFERENCES dbo.ScheduleWeeks(WeekKey) ON DELETE CASCADE,
    CONSTRAINT FK_ScheduleAssignments_Employees FOREIGN KEY (EmployeeId) REFERENCES dbo.Employees(EmployeeId)
);
GO

CREATE OR ALTER TRIGGER dbo.TR_Employees_UpdatedAt
ON dbo.Employees
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE e
    SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.Employees e
    INNER JOIN inserted i ON e.EmployeeId = i.EmployeeId;
END;
GO

CREATE OR ALTER TRIGGER dbo.TR_ScheduleWeeks_UpdatedAt
ON dbo.ScheduleWeeks
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    UPDATE w
    SET UpdatedAt = SYSUTCDATETIME()
    FROM dbo.ScheduleWeeks w
    INNER JOIN inserted i ON w.WeekKey = i.WeekKey;
END;
GO
