"use client";

import React, { useState, useMemo } from "react";

// --- SIMPLE, STABLE VERSION (NO MULTI-ASSIGN, CLEAN LAYOUT) ---

const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri"];
const SHIFTS = [
  { id: "AM", label: "AM", time: "5:45–2:15" },
  { id: "PM", label: "PM", time: "1:45–10:15" },
  { id: "ON", label: "ON", time: "9:45–6:15" }
];

const ROLES = [
  { id: "sup", label: "Supervisor" },
  { id: "cr1", label: "Crystallization 1" },
  { id: "cr2", label: "Crystallization 2" },
  { id: "sr", label: "Solvent Recovery" },
  { id: "mw", label: "Matrix Washing" }
];

export default function ProcessingTeamScheduler() {
  const [employees] = useState([
    { id: "1", name: "Drew" },
    { id: "2", name: "Jim" },
    { id: "3", name: "Tiawan" },
    { id: "4", name: "Mark" },
    { id: "5", name: "Michael" }
  ]);

  const [assignments, setAssignments] = useState({});
  const [dragged, setDragged] = useState(null);

  const employeeMap = useMemo(() => {
    const map = {};
    employees.forEach(e => (map[e.id] = e));
    return map;
  }, [employees]);

  function handleDrop(day, shift, role, empId) {
    setAssignments(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: {
          ...prev[day]?.[shift],
          [role]: empId
        }
      }
    }));
  }

  function clearSlot(day, shift, role) {
    setAssignments(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        [shift]: {
          ...prev[day]?.[shift],
          [role]: null
        }
      }
    }));
  }

  return (
    <div className="flex gap-4 p-4">
      {/* LEFT PANEL */}
      <div className="w-1/4 border p-2 overflow-y-auto max-h-[90vh]">
        <h2 className="text-lg font-bold mb-2">Employees</h2>
        {employees.map(emp => (
          <div
            key={emp.id}
            draggable
            onDragStart={e => {
              setDragged(emp.id);
              e.dataTransfer.setData("text/plain", emp.id);
            }}
            className="border p-2 mb-2 cursor-grab bg-white"
          >
            {emp.name}
          </div>
        ))}
      </div>

      {/* RIGHT PANEL */}
      <div className="w-3/4 overflow-auto">
        <table className="border-collapse w-full text-xs">
          <thead>
            <tr>
              <th className="border p-1">Role</th>
              {DAYS.flatMap(day =>
                SHIFTS.map(shift => (
                  <th key={day + shift.id} className="border p-1">
                    {day}<br />{shift.label}
                  </th>
                ))
              )}
            </tr>
          </thead>

          <tbody>
            {ROLES.map(role => (
              <tr key={role.id}>
                <td className="border p-1 font-semibold">{role.label}</td>

                {DAYS.flatMap(day =>
                  SHIFTS.map(shift => {
                    const assigned = assignments?.[day]?.[shift.id]?.[role.id];
                    return (
                      <td
                        key={day + shift.id + role.id}
                        className="border p-1 min-w-[80px] h-[40px]"
                        onDragOver={e => e.preventDefault()}
                        onDrop={e => {
                          const id = e.dataTransfer.getData("text/plain");
                          handleDrop(day, shift.id, role.id, id);
                        }}
                      >
                        {assigned ? (
                          <div className="flex justify-between items-center">
                            <span>{employeeMap[assigned]?.name}</span>
                            <button onClick={() => clearSlot(day, shift.id, role.id)}>x</button>
                          </div>
                        ) : (
                          <span className="text-gray-400">—</span>
                        )}
                      </td>
                    );
                  })
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
