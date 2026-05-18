export type LockerStatus = "locked" | "open" | "forced";

export interface Locker {
  id: string;
  name: string;
  number: string;
  status: LockerStatus;
  battery: number;
  signal: number;
  lastUpdated: string;
  location?: { lat: number; lng: number };
}

export interface Alert {
  id: string;
  type: "forced_entry" | "low_battery" | "connection_lost" | "tamper";
  lockerId: string;
  lockerNumber: string;
  message: string;
  timestamp: string;
  dismissed: boolean;
}

export interface ActivityEvent {
  id: string;
  lockerId: string;
  lockerNumber: string;
  type: "lock" | "unlock" | "forced_entry" | "battery_low" | "buzzer_on" | "buzzer_off";
  timestamp: string;
}

export const mockLockers: Locker[] = [
  { id: "1", name: "Main Entrance", number: "L-001", status: "locked", battery: 92, signal: 85, lastUpdated: "2 min ago" },
  { id: "2", name: "Server Room", number: "L-002", status: "open", battery: 78, signal: 92, lastUpdated: "5 min ago" },
  { id: "3", name: "Storage Unit A", number: "L-003", status: "locked", battery: 45, signal: 67, lastUpdated: "1 min ago" },
  { id: "4", name: "Lab Access", number: "L-004", status: "forced", battery: 63, signal: 34, lastUpdated: "Just now" },
  { id: "5", name: "Parking Gate", number: "L-005", status: "locked", battery: 100, signal: 98, lastUpdated: "10 min ago" },
];

export const mockAlerts: Alert[] = [
  { id: "a1", type: "forced_entry", lockerId: "4", lockerNumber: "L-004", message: "Forced entry detected at Lab Access", timestamp: "2024-03-05 14:23:00", dismissed: false },
  { id: "a2", type: "low_battery", lockerId: "3", lockerNumber: "L-003", message: "Battery low on Storage Unit A (45%)", timestamp: "2024-03-05 13:10:00", dismissed: false },
  { id: "a3", type: "tamper", lockerId: "4", lockerNumber: "L-004", message: "Tamper detected on Lab Access", timestamp: "2024-03-05 12:55:00", dismissed: true },
];

export const mockActivity: ActivityEvent[] = [
  { id: "e1", lockerId: "1", lockerNumber: "L-001", type: "lock", timestamp: "2024-03-05 14:30:00" },
  { id: "e2", lockerId: "2", lockerNumber: "L-002", type: "unlock", timestamp: "2024-03-05 14:25:00" },
  { id: "e3", lockerId: "4", lockerNumber: "L-004", type: "forced_entry", timestamp: "2024-03-05 14:23:00" },
  { id: "e4", lockerId: "1", lockerNumber: "L-001", type: "unlock", timestamp: "2024-03-05 13:50:00" },
  { id: "e5", lockerId: "3", lockerNumber: "L-003", type: "battery_low", timestamp: "2024-03-05 13:10:00" },
  { id: "e6", lockerId: "5", lockerNumber: "L-005", type: "lock", timestamp: "2024-03-05 12:00:00" },
  { id: "e7", lockerId: "2", lockerNumber: "L-002", type: "lock", timestamp: "2024-03-05 11:30:00" },
  { id: "e8", lockerId: "4", lockerNumber: "L-004", type: "buzzer_on", timestamp: "2024-03-05 14:23:05" },
];
