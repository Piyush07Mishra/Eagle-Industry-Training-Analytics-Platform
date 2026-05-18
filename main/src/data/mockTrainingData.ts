// Mock Data for Enterprise Training, Compliance, Analytics & Reporting System

export interface Trainer {
  id: string;
  name: string;
  email: string;
  expertise: string[];
  score: number;
  sessionsCount: number;
  averageRating: number;
  trainerSinceDate: string;
  performance: number;
  attendance: number;
}

export interface Trainee {
  id: string;
  name: string;
  email: string;
  employeeId: string;
  batchId: string;
  batchName: string;
  role: string;
  department: string;
  score: number;
  attendance: number;
  completedSessions: string[];
  assignedTrainer?: string;
  joinDate: string;
  performance: number;
}

export interface Training {
  id: string;
  topic: string;
  description: string;
  trainerId: string;
  trainerName: string;
  status: "Upcoming" | "Ongoing" | "Completed" | "Cancelled";
  startDate: string;
  endDate: string;
  duration: number; // in hours
  participants: number;
  completedParticipants: number;
  compliance: string;
  location: string;
  attendancePercentage: number;
}

export interface Session {
  id: string;
  trainingId: string;
  topic: string;
  trainerId: string;
  trainerName: string;
  traineesAssigned: string[];
  date: string;
  time: string;
  duration: number;
  status: "Scheduled" | "Ongoing" | "Completed" | "Cancelled";
  attendees: number;
  attendancePercentage: number;
}

export interface Feedback {
  id: string;
  fromUserId: string;
  fromUserName: string;
  fromUserRole: "Admin" | "Trainer" | "Trainee";
  toUserId: string;
  toUserName: string;
  sessionId: string;
  sessionTopic: string;
  rating: number;
  comment: string;
  date: string;
  categories: {
    contentQuality: number;
    delivery: number;
    engagement: number;
    timeManagement: number;
  };
}

export interface BatchInfo {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  status: "Active" | "Completed" | "Planned";
  traineesCount: number;
  trainersCount: number;
}

export interface Attendance {
  id: string;
  traineeId: string;
  sessionId: string;
  sessionTopic: string;
  date: string;
  status: "Present" | "Absent" | "Late";
  duration: number;
}

// MOCK TRAINERS DATA
export const trainers: Trainer[] = [
  {
    id: "T001",
    name: "Anil Kumar",
    email: "anil.kumar@company.com",
    expertise: ["Fire Safety", "Emergency Protocols", "Evacuation Procedures"],
    score: 85,
    sessionsCount: 12,
    averageRating: 4.6,
    trainerSinceDate: "2020-01-15",
    performance: 88,
    attendance: 98,
  },
  {
    id: "T002",
    name: "Priya Sharma",
    email: "priya.sharma@company.com",
    expertise: ["Data Protection", "GDPR Compliance", "Information Security"],
    score: 92,
    sessionsCount: 15,
    averageRating: 4.8,
    trainerSinceDate: "2019-06-10",
    performance: 95,
    attendance: 99,
  },
  {
    id: "T003",
    name: "Rajesh Patel",
    email: "rajesh.patel@company.com",
    expertise: ["Environmental Safety", "Waste Management", "ISO Standards"],
    score: 78,
    sessionsCount: 8,
    averageRating: 4.2,
    trainerSinceDate: "2021-03-20",
    performance: 80,
    attendance: 95,
  },
  {
    id: "T004",
    name: "Neha Gupta",
    email: "neha.gupta@company.com",
    expertise: ["Workplace Ethics", "Communication Skills", "Leadership"],
    score: 89,
    sessionsCount: 18,
    averageRating: 4.7,
    trainerSinceDate: "2018-11-05",
    performance: 92,
    attendance: 100,
  },
  {
    id: "T005",
    name: "Vikram Singh",
    email: "vikram.singh@company.com",
    expertise: ["Technical Skills", "Software Training", "System Administration"],
    score: 87,
    sessionsCount: 20,
    averageRating: 4.5,
    trainerSinceDate: "2017-05-12",
    performance: 90,
    attendance: 97,
  },
];

// MOCK TRAINEES DATA
export const trainees: Trainee[] = [
  {
    id: "TR001",
    name: "Rahul Verma",
    email: "rahul.verma@company.com",
    employeeId: "EMP001",
    batchId: "B001",
    batchName: "Batch 2025-A",
    role: "Associate",
    department: "Operations",
    score: 90,
    attendance: 95,
    completedSessions: ["Fire Safety", "Data Protection"],
    assignedTrainer: "T001",
    joinDate: "2025-01-01",
    performance: 92,
  },
  {
    id: "TR002",
    name: "Anjali Desai",
    email: "anjali.desai@company.com",
    employeeId: "EMP002",
    batchId: "B001",
    batchName: "Batch 2025-A",
    role: "Associate",
    department: "HR",
    score: 85,
    attendance: 90,
    completedSessions: ["Data Protection", "Workplace Ethics"],
    assignedTrainer: "T004",
    joinDate: "2025-01-01",
    performance: 87,
  },
  {
    id: "TR003",
    name: "Arjun Nair",
    email: "arjun.nair@company.com",
    employeeId: "EMP003",
    batchId: "B001",
    batchName: "Batch 2025-A",
    role: "Associate",
    department: "IT",
    score: 88,
    attendance: 92,
    completedSessions: ["Technical Skills", "Fire Safety"],
    assignedTrainer: "T005",
    joinDate: "2025-01-01",
    performance: 89,
  },
  {
    id: "TR004",
    name: "Divya Iyer",
    email: "divya.iyer@company.com",
    employeeId: "EMP004",
    batchId: "B002",
    batchName: "Batch 2025-B",
    role: "Associate",
    department: "Finance",
    score: 92,
    attendance: 98,
    completedSessions: ["Data Protection", "GDPR Compliance", "Workplace Ethics"],
    assignedTrainer: "T002",
    joinDate: "2025-02-01",
    performance: 94,
  },
  {
    id: "TR005",
    name: "Karan Mehta",
    email: "karan.mehta@company.com",
    employeeId: "EMP005",
    batchId: "B002",
    batchName: "Batch 2025-B",
    role: "Associate",
    department: "Operations",
    score: 80,
    attendance: 88,
    completedSessions: ["Fire Safety"],
    assignedTrainer: "T003",
    joinDate: "2025-02-01",
    performance: 82,
  },
  {
    id: "TR006",
    name: "Bhavna Reddy",
    email: "bhavna.reddy@company.com",
    employeeId: "EMP006",
    batchId: "B002",
    batchName: "Batch 2025-B",
    role: "Associate",
    department: "Sales",
    score: 87,
    attendance: 94,
    completedSessions: ["Leadership", "Communication Skills"],
    assignedTrainer: "T004",
    joinDate: "2025-02-01",
    performance: 88,
  },
  {
    id: "TR007",
    name: "Sanjay Kumar",
    email: "sanjay.kumar@company.com",
    employeeId: "EMP007",
    batchId: "B003",
    batchName: "Batch 2025-C",
    role: "Associate",
    department: "IT",
    score: 83,
    attendance: 91,
    completedSessions: ["System Administration", "Technical Skills"],
    assignedTrainer: "T005",
    joinDate: "2025-03-01",
    performance: 85,
  },
  {
    id: "TR008",
    name: "Meera Singh",
    email: "meera.singh@company.com",
    employeeId: "EMP008",
    batchId: "B003",
    batchName: "Batch 2025-C",
    role: "Associate",
    department: "Marketing",
    score: 86,
    attendance: 93,
    completedSessions: ["Data Protection", "Environmental Safety"],
    assignedTrainer: "T002",
    joinDate: "2025-03-01",
    performance: 87,
  },
];

// MOCK TRAININGS DATA
export const trainings: Training[] = [
  {
    id: "TS001",
    topic: "Fire Safety",
    description: "Essential fire safety and emergency procedures for all employees",
    trainerId: "T001",
    trainerName: "Anil Kumar",
    status: "Completed",
    startDate: "2026-01-10",
    endDate: "2026-01-12",
    duration: 6,
    participants: 25,
    completedParticipants: 24,
    compliance: "Mandatory",
    location: "Building A - Training Room 1",
    attendancePercentage: 96,
  },
  {
    id: "TS002",
    topic: "Data Protection",
    description: "GDPR and data privacy compliance training",
    trainerId: "T002",
    trainerName: "Priya Sharma",
    status: "Completed",
    startDate: "2026-01-15",
    endDate: "2026-01-17",
    duration: 6,
    participants: 30,
    completedParticipants: 30,
    compliance: "Mandatory",
    location: "Building B - Training Room 2",
    attendancePercentage: 100,
  },
  {
    id: "TS003",
    topic: "Environmental Safety",
    description: "Workplace environmental safety and waste management",
    trainerId: "T003",
    trainerName: "Rajesh Patel",
    status: "Ongoing",
    startDate: "2026-02-01",
    endDate: "2026-02-03",
    duration: 4,
    participants: 20,
    completedParticipants: 0,
    compliance: "Mandatory",
    location: "Building C - Training Room 3",
    attendancePercentage: 85,
  },
  {
    id: "TS004",
    topic: "Workplace Ethics",
    description: "Professional ethics and workplace conduct guidelines",
    trainerId: "T004",
    trainerName: "Neha Gupta",
    status: "Upcoming",
    startDate: "2026-03-15",
    endDate: "2026-03-17",
    duration: 6,
    participants: 35,
    completedParticipants: 0,
    compliance: "Mandatory",
    location: "Building A - Auditorium",
    attendancePercentage: 0,
  },
  {
    id: "TS005",
    topic: "Technical Skills",
    description: "Advanced technical training for IT professionals",
    trainerId: "T005",
    trainerName: "Vikram Singh",
    status: "Upcoming",
    startDate: "2026-03-20",
    endDate: "2026-03-25",
    duration: 12,
    participants: 15,
    completedParticipants: 0,
    compliance: "Optional",
    location: "Building D - Lab",
    attendancePercentage: 0,
  },
  {
    id: "TS006",
    topic: "Leadership Development",
    description: "Leadership skills and management training",
    trainerId: "T004",
    trainerName: "Neha Gupta",
    status: "Completed",
    startDate: "2026-01-20",
    endDate: "2026-01-24",
    duration: 10,
    participants: 18,
    completedParticipants: 18,
    compliance: "Optional",
    location: "Building B - Training Room 2",
    attendancePercentage: 100,
  },
];

// MOCK SESSIONS DATA
export const sessions: Session[] = [
  {
    id: "S001",
    trainingId: "TS001",
    topic: "Fire Safety - Session 1",
    trainerId: "T001",
    trainerName: "Anil Kumar",
    traineesAssigned: ["TR001", "TR003", "TR007"],
    date: "2026-01-10",
    time: "09:00",
    duration: 2,
    status: "Completed",
    attendees: 3,
    attendancePercentage: 100,
  },
  {
    id: "S002",
    trainingId: "TS001",
    topic: "Fire Safety - Session 2",
    trainerId: "T001",
    trainerName: "Anil Kumar",
    traineesAssigned: ["TR005", "TR006"],
    date: "2026-01-11",
    time: "10:00",
    duration: 2,
    status: "Completed",
    attendees: 2,
    attendancePercentage: 100,
  },
  {
    id: "S003",
    trainingId: "TS002",
    topic: "Data Protection - Session 1",
    trainerId: "T002",
    trainerName: "Priya Sharma",
    traineesAssigned: ["TR001", "TR004", "TR008"],
    date: "2026-01-15",
    time: "14:00",
    duration: 2,
    status: "Completed",
    attendees: 3,
    attendancePercentage: 100,
  },
  {
    id: "S004",
    trainingId: "TS002",
    topic: "Data Protection - Session 2",
    trainerId: "T002",
    trainerName: "Priya Sharma",
    traineesAssigned: ["TR002", "TR005"],
    date: "2026-01-16",
    time: "11:00",
    duration: 2,
    status: "Completed",
    attendees: 2,
    attendancePercentage: 100,
  },
  {
    id: "S005",
    trainingId: "TS004",
    topic: "Workplace Ethics - Session 1",
    trainerId: "T004",
    trainerName: "Neha Gupta",
    traineesAssigned: ["TR002", "TR006"],
    date: "2026-03-15",
    time: "09:00",
    duration: 3,
    status: "Scheduled",
    attendees: 0,
    attendancePercentage: 0,
  },
  {
    id: "S006",
    trainingId: "TS005",
    topic: "Technical Skills - Session 1",
    trainerId: "T005",
    trainerName: "Vikram Singh",
    traineesAssigned: ["TR003", "TR007"],
    date: "2026-03-20",
    time: "10:00",
    duration: 4,
    status: "Scheduled",
    attendees: 0,
    attendancePercentage: 0,
  },
];

// MOCK FEEDBACK DATA
export const feedbacks: Feedback[] = [
  {
    id: "F001",
    fromUserId: "TR001",
    fromUserName: "Rahul Verma",
    fromUserRole: "Trainee",
    toUserId: "T001",
    toUserName: "Anil Kumar",
    sessionId: "S001",
    sessionTopic: "Fire Safety - Session 1",
    rating: 5,
    comment: "Excellent session. Very knowledgeable instructor with great delivery.",
    date: "2026-01-10",
    categories: {
      contentQuality: 5,
      delivery: 5,
      engagement: 4,
      timeManagement: 5,
    },
  },
  {
    id: "F002",
    fromUserId: "TR002",
    fromUserName: "Anjali Desai",
    fromUserRole: "Trainee",
    toUserId: "T004",
    toUserName: "Neha Gupta",
    sessionId: "S003",
    sessionTopic: "Data Protection - Session 1",
    rating: 4,
    comment: "Good content coverage, could have interactive examples.",
    date: "2026-01-15",
    categories: {
      contentQuality: 4,
      delivery: 4,
      engagement: 3,
      timeManagement: 5,
    },
  },
  {
    id: "F003",
    fromUserId: "T001",
    fromUserName: "Anil Kumar",
    fromUserRole: "Trainer",
    toUserId: "Admin",
    toUserName: "Admin",
    sessionId: "S001",
    sessionTopic: "Fire Safety - Session 1",
    rating: 4,
    comment: "Session completed successfully. Good attendance and participation.",
    date: "2026-01-10",
    categories: {
      contentQuality: 5,
      delivery: 5,
      engagement: 4,
      timeManagement: 5,
    },
  },
  {
    id: "F004",
    fromUserId: "TR004",
    fromUserName: "Divya Iyer",
    fromUserRole: "Trainee",
    toUserId: "T002",
    toUserName: "Priya Sharma",
    sessionId: "S003",
    sessionTopic: "Data Protection - Session 1",
    rating: 5,
    comment: "Exceptional training. Clear explanations and practical examples.",
    date: "2026-01-15",
    categories: {
      contentQuality: 5,
      delivery: 5,
      engagement: 5,
      timeManagement: 4,
    },
  },
];

// MOCK BATCH DATA
export const batches: BatchInfo[] = [
  {
    id: "B001",
    name: "Batch 2025-A",
    startDate: "2025-01-01",
    endDate: "2025-06-30",
    status: "Active",
    traineesCount: 3,
    trainersCount: 3,
  },
  {
    id: "B002",
    name: "Batch 2025-B",
    startDate: "2025-02-01",
    endDate: "2025-07-31",
    status: "Active",
    traineesCount: 3,
    trainersCount: 2,
  },
  {
    id: "B003",
    name: "Batch 2025-C",
    startDate: "2025-03-01",
    endDate: "2025-08-31",
    status: "Active",
    traineesCount: 2,
    trainersCount: 2,
  },
];

// MOCK ATTENDANCE DATA
export const attendances: Attendance[] = [
  {
    id: "A001",
    traineeId: "TR001",
    sessionId: "S001",
    sessionTopic: "Fire Safety - Session 1",
    date: "2026-01-10",
    status: "Present",
    duration: 120,
  },
  {
    id: "A002",
    traineeId: "TR001",
    sessionId: "S003",
    sessionTopic: "Data Protection - Session 1",
    date: "2026-01-15",
    status: "Present",
    duration: 120,
  },
  {
    id: "A003",
    traineeId: "TR002",
    sessionId: "S004",
    sessionTopic: "Data Protection - Session 2",
    date: "2026-01-16",
    status: "Present",
    duration: 120,
  },
  {
    id: "A004",
    traineeId: "TR003",
    sessionId: "S001",
    sessionTopic: "Fire Safety - Session 1",
    date: "2026-01-10",
    status: "Present",
    duration: 120,
  },
  {
    id: "A005",
    traineeId: "TR004",
    sessionId: "S003",
    sessionTopic: "Data Protection - Session 1",
    date: "2026-01-15",
    status: "Present",
    duration: 130,
  },
  {
    id: "A006",
    traineeId: "TR005",
    sessionId: "S002",
    sessionTopic: "Fire Safety - Session 2",
    date: "2026-01-11",
    status: "Present",
    duration: 120,
  },
  {
    id: "A007",
    traineeId: "TR006",
    sessionId: "S002",
    sessionTopic: "Fire Safety - Session 2",
    date: "2026-01-11",
    status: "Absent",
    duration: 0,
  },
  {
    id: "A008",
    traineeId: "TR007",
    sessionId: "S001",
    sessionTopic: "Fire Safety - Session 1",
    date: "2026-01-10",
    status: "Present",
    duration: 120,
  },
  {
    id: "A009",
    traineeId: "TR008",
    sessionId: "S003",
    sessionTopic: "Data Protection - Session 1",
    date: "2026-01-15",
    status: "Late",
    duration: 100,
  },
];
