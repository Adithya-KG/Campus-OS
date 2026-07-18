import { Injectable } from '@nitrostack/core';
import { createRequire } from 'module';
import { fileURLToPath } from 'url';
import * as path from 'path';

const require = createRequire(import.meta.url);

// ─── Types ────────────────────────────────────────────────────────────────────

export interface Student {
    id: string;
    name: string;
    email: string;
    year: number;
    program: string;
    defaultBuilding: string;
}

export interface TimetableEntry {
    courseId: string;
    courseName: string;
    faculty: string;
    room: string;
    building: string;
    floor: number;
    startTime: string;
    endTime: string;
    dayOfWeek: string[];
}

export interface AttendanceCourse {
    courseId: string;
    courseName: string;
    attended: number;
    total: number;
    percentage: number;
}

export interface AttendanceRecord {
    overall: number;
    courses: AttendanceCourse[];
}

export interface Assignment {
    id: string;
    studentId: string;
    courseId: string;
    courseName: string;
    title: string;
    description: string;
    dueDate: string;
    dueTime: string;
    status: string;
    weight: string;
}

export interface Room {
    courseId: string;
    building: string;
    buildingName: string;
    room: string;
    floor: number;
    landmark: string;
}

export interface Printer {
    id: string;
    name: string;
    building: string;
    floor: number;
    room: string;
    isWorking: boolean;
    walkingMinutes: number;
    supportsColor: boolean;
    supportsA3: boolean;
    note?: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

/** Loads all JSON fixtures once and exposes typed getters. */
@Injectable({ deps: [] })
export class DataService {
    private readonly students: Student[];
    private readonly timetable: Record<string, TimetableEntry[]>;
    private readonly attendance: Record<string, AttendanceRecord>;
    private readonly assignments: Assignment[];
    private readonly rooms: Room[];
    private readonly printers: Printer[];

    constructor() {
        const dir = path.join(process.cwd(), 'src', 'data');

        this.students = require(path.join(dir, 'students.json')) as Student[];
        this.timetable = require(path.join(dir, 'timetable.json')) as Record<string, TimetableEntry[]>;
        this.attendance = require(path.join(dir, 'attendance.json')) as Record<string, AttendanceRecord>;

        // Resolve placeholder dates in assignments at load time
        const rawAssignments = require(path.join(dir, 'assignments.json')) as Assignment[];
        this.assignments = this.resolveAssignmentDates(rawAssignments);

        this.rooms = require(path.join(dir, 'rooms.json')) as Room[];
        this.printers = require(path.join(dir, 'printers.json')) as Printer[];
    }

    // ── Getters ───────────────────────────────────────────────────────────────

    getStudent(studentId: string): Student | undefined {
        return this.students.find(s => s.id === studentId);
    }

    getTimetable(studentId: string): TimetableEntry[] {
        return this.timetable[studentId] ?? [];
    }

    getAttendance(studentId: string): AttendanceRecord | undefined {
        return this.attendance[studentId];
    }

    getAssignments(studentId: string): Assignment[] {
        return this.assignments.filter(a => a.studentId === studentId);
    }

    getRoom(courseId: string): Room | undefined {
        return this.rooms.find(r => r.courseId === courseId);
    }

    getPrinters(): Printer[] {
        return this.printers;
    }

    getPrintersByBuilding(buildingId: string): Printer[] {
        return this.printers.filter(p => p.building === buildingId);
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Replaces placeholder strings like __TOMORROW__, __IN_3_DAYS__ with real
     * ISO date strings so demo data always looks current.
     */
    private resolveAssignmentDates(raw: Assignment[]): Assignment[] {
        const today = new Date();

        const resolve = (placeholder: string): string => {
            const match = placeholder.match(/^__IN_(\d+)_DAYS__$/);
            if (match) {
                const d = new Date(today);
                d.setDate(d.getDate() + parseInt(match[1], 10));
                return d.toISOString().split('T')[0];
            }
            if (placeholder === '__TOMORROW__') {
                const d = new Date(today);
                d.setDate(d.getDate() + 1);
                return d.toISOString().split('T')[0];
            }
            return placeholder;
        };

        return raw.map(a => ({ ...a, dueDate: resolve(a.dueDate) }));
    }
}
