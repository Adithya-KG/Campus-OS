import { Injectable } from '@nitrostack/core';
import {
    DataService,
    Student,
    TimetableEntry,
    AttendanceRecord,
    Assignment,
} from './data.service.js';

/**
 * StudentRepository — thin typed wrapper over DataService for all
 * student-related data: profile, timetable, attendance, assignments.
 */
@Injectable({ deps: [DataService] })
export class StudentRepository {
    constructor(private readonly dataService: DataService) {}

    getStudent(studentId: string): Student | undefined {
        return this.dataService.getStudent(studentId);
    }

    getAllStudents(): Student[] {
        // DataService exposes individual lookups; we expose the full list
        // by proxying the underlying array via a typed accessor.
        return (this.dataService as any).students as Student[];
    }

    getTimetable(studentId: string): TimetableEntry[] {
        return this.dataService.getTimetable(studentId);
    }

    getAttendance(studentId: string): AttendanceRecord | undefined {
        return this.dataService.getAttendance(studentId);
    }

    /** Returns raw (unfiltered by due-date) assignments for a student. */
    getAssignments(studentId: string): Assignment[] {
        return this.dataService.getAssignments(studentId);
    }
}
