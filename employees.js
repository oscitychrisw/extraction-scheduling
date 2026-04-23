import { getPool, sql } from "./db.js";
import { DAYS, SHIFTS, SLOT_CODES } from "./constants.js";
import { normalizeAssignments } from "./schedule.js";

export async function listEmployees() {
  const pool = await getPool();
  const employeesResult = await pool.request().query(`
    SELECT EmployeeId, Name, Notes, IsActive
    FROM dbo.Employees
    WHERE IsActive = 1
    ORDER BY Name;
  `);

  const competenciesResult = await pool.request().query(`
    SELECT EmployeeId, CompetencyName
    FROM dbo.EmployeeCompetencies;
  `);

  const shiftsResult = await pool.request().query(`
    SELECT EmployeeId, ShiftCode
    FROM dbo.EmployeeShiftAvailability;
  `);

  const competenciesByEmployee = new Map();
  for (const row of competenciesResult.recordset) {
    const key = row.EmployeeId;
    if (!competenciesByEmployee.has(key)) competenciesByEmployee.set(key, []);
    competenciesByEmployee.get(key).push(row.CompetencyName);
  }

  const shiftsByEmployee = new Map();
  for (const row of shiftsResult.recordset) {
    const key = row.EmployeeId;
    if (!shiftsByEmployee.has(key)) shiftsByEmployee.set(key, []);
    shiftsByEmployee.get(key).push(row.ShiftCode);
  }

  return employeesResult.recordset.map((row) => ({
    id: row.EmployeeId,
    name: row.Name,
    notes: row.Notes || "",
    competencies: competenciesByEmployee.get(row.EmployeeId) || [],
    shifts: shiftsByEmployee.get(row.EmployeeId) || [],
  }));
}

export async function upsertEmployee(employee) {
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    await new sql.Request(tx)
      .input("EmployeeId", sql.UniqueIdentifier, employee.id)
      .input("Name", sql.NVarChar(200), employee.name)
      .input("Notes", sql.NVarChar(1000), employee.notes || "")
      .query(`
        MERGE dbo.Employees AS target
        USING (SELECT @EmployeeId AS EmployeeId) AS source
        ON target.EmployeeId = source.EmployeeId
        WHEN MATCHED THEN
          UPDATE SET Name = @Name, Notes = @Notes, IsActive = 1
        WHEN NOT MATCHED THEN
          INSERT (EmployeeId, Name, Notes, IsActive)
          VALUES (@EmployeeId, @Name, @Notes, 1);
      `);

    await new sql.Request(tx)
      .input("EmployeeId", sql.UniqueIdentifier, employee.id)
      .query(`
        DELETE FROM dbo.EmployeeCompetencies WHERE EmployeeId = @EmployeeId;
        DELETE FROM dbo.EmployeeShiftAvailability WHERE EmployeeId = @EmployeeId;
      `);

    for (const competency of employee.competencies || []) {
      await new sql.Request(tx)
        .input("EmployeeId", sql.UniqueIdentifier, employee.id)
        .input("CompetencyName", sql.NVarChar(100), competency)
        .query(`
          INSERT INTO dbo.EmployeeCompetencies (EmployeeId, CompetencyName)
          VALUES (@EmployeeId, @CompetencyName);
        `);
    }

    for (const shiftCode of employee.shifts || []) {
      await new sql.Request(tx)
        .input("EmployeeId", sql.UniqueIdentifier, employee.id)
        .input("ShiftCode", sql.NVarChar(20), shiftCode)
        .query(`
          INSERT INTO dbo.EmployeeShiftAvailability (EmployeeId, ShiftCode)
          VALUES (@EmployeeId, @ShiftCode);
        `);
    }

    await tx.commit();
    return employee;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}

export async function softDeleteEmployee(employeeId) {
  const pool = await getPool();
  await pool.request()
    .input("EmployeeId", sql.UniqueIdentifier, employeeId)
    .query(`
      UPDATE dbo.Employees
      SET IsActive = 0
      WHERE EmployeeId = @EmployeeId;
    `);
}

export async function getSchedule(weekKey) {
  const pool = await getPool();
  const assignments = normalizeAssignments({});

  const result = await pool.request()
    .input("WeekKey", sql.NVarChar(50), weekKey)
    .query(`
      SELECT WeekKey, DayName, ShiftCode, SlotCode, EmployeeId
      FROM dbo.ScheduleAssignments
      WHERE WeekKey = @WeekKey;
    `);

  for (const row of result.recordset) {
    if (assignments[row.DayName] && assignments[row.DayName][row.ShiftCode]) {
      assignments[row.DayName][row.ShiftCode][row.SlotCode] = row.EmployeeId;
    }
  }

  return assignments;
}

export async function saveSchedule(weekKey, assignments, assignedBy) {
  const normalized = normalizeAssignments(assignments);
  const pool = await getPool();
  const tx = new sql.Transaction(pool);
  await tx.begin();

  try {
    await new sql.Request(tx)
      .input("WeekKey", sql.NVarChar(50), weekKey)
      .query(`
        MERGE dbo.ScheduleWeeks AS target
        USING (SELECT @WeekKey AS WeekKey) AS source
        ON target.WeekKey = source.WeekKey
        WHEN NOT MATCHED THEN
          INSERT (WeekKey, Status) VALUES (@WeekKey, 'Draft');
      `);

    await new sql.Request(tx)
      .input("WeekKey", sql.NVarChar(50), weekKey)
      .query(`DELETE FROM dbo.ScheduleAssignments WHERE WeekKey = @WeekKey;`);

    for (const day of DAYS) {
      for (const shift of SHIFTS) {
        for (const slot of SLOT_CODES) {
          await new sql.Request(tx)
            .input("WeekKey", sql.NVarChar(50), weekKey)
            .input("DayName", sql.NVarChar(20), day)
            .input("ShiftCode", sql.NVarChar(20), shift)
            .input("SlotCode", sql.NVarChar(50), slot)
            .input("EmployeeId", sql.UniqueIdentifier, normalized[day][shift][slot] || null)
            .input("AssignedBy", sql.NVarChar(320), assignedBy || null)
            .query(`
              INSERT INTO dbo.ScheduleAssignments (WeekKey, DayName, ShiftCode, SlotCode, EmployeeId, AssignedBy, AssignedAt)
              VALUES (@WeekKey, @DayName, @ShiftCode, @SlotCode, @EmployeeId, @AssignedBy, SYSUTCDATETIME());
            `);
        }
      }
    }

    await tx.commit();
    return normalized;
  } catch (error) {
    await tx.rollback();
    throw error;
  }
}
