export interface FarmInfo {
  id: string;
  name: string;
  location: string;
  area: string;
}

export interface Zone {
  id: string;
  code: string;
  name: string;
  variety: string;
  area: string;
  status: "ACTIVE" | "INACTIVE" | "ARCHIVED";
}

export interface Sensor {
  id: string;
  name: string;
  status: "online" | "offline";
  battery: number;
  lastSignal: string;
  zoneId?: string;
}

export const INITIAL_SENSORS: Sensor[] = [
  {
    id: "S01",
    name: "Module cảm biến A1",
    status: "online",
    battery: 85,
    lastSignal: "Vài giây trước",
    zoneId: "A",
  },
  {
    id: "S02",
    name: "Module cảm biến A2",
    status: "online",
    battery: 42,
    lastSignal: "15 phút trước",
    zoneId: "B",
  },
  {
    id: "S03",
    name: "Module cảm biến B1",
    status: "offline",
    battery: 0,
    lastSignal: "2 ngày trước",
    zoneId: "C",
  },
];
