import { Injectable } from '@nitrostack/core';
import { TimetableEntry, AttendanceCourse } from '../../data/data.service.js';
import { StudentRepository } from '../../data/student.repository.js';
import { computeAttendanceAdvice, AttendanceAdvice } from './attendance-advice.js';

// ─── Return Types ─────────────────────────────────────────────────────────────

export interface TimetableResult {
    studentId: string;
    studentName: string;
    date: string;
    dayOfWeek: string;
    classes: TimetableEntry[];
}

export interface AttendanceResult {
    studentId: string;
    overall: number;
    isLow: boolean;
    courses: (AttendanceCourse & { isLow: boolean })[];
    /** Deterministic per-course advice and overall summary (additive field). */
    advice: AttendanceAdvice;
}

export interface AssignmentResult {
    studentId: string;
    dueWithinHours: number;
    assignments: {
        id: string;
        courseId: string;
        courseName: string;
        title: string;
        description: string;
        dueDate: string;
        dueTime: string;
        weight: string;
        hoursUntilDue: number;
    }[];
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ deps: [StudentRepository] })
export class AcademicsService {
    constructor(private readonly studentRepo: StudentRepository) {}

    getTimetable(studentId: string): TimetableResult {
        const student = this.studentRepo.getStudent(studentId);
        const now = new Date();
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const todayName = days[now.getDay()];

        const allEntries = this.studentRepo.getTimetable(studentId);
        // Filter to classes scheduled for today's weekday
        const todayClasses = allEntries
            .filter(e => e.dayOfWeek.includes(todayName))
            .sort((a, b) => a.startTime.localeCompare(b.startTime));

        return {
            studentId,
            studentName: student?.name ?? studentId,
            date: now.toISOString().split('T')[0],
            dayOfWeek: todayName,
            classes: todayClasses,
        };
    }

    getAttendance(studentId: string): AttendanceResult {
        const record = this.studentRepo.getAttendance(studentId);
        if (!record) {
            return {
                studentId,
                overall: 0,
                isLow: true,
                courses: [],
                advice: { summary: 'No attendance data found.', courses: [] },
            };
        }

        const LOW_THRESHOLD = 75;
        const coursesWithFlag = record.courses.map(c => ({
            ...c,
            isLow: c.percentage < LOW_THRESHOLD,
        }));

        // Compute advice — purely deterministic, no external calls
        const advice = computeAttendanceAdvice(coursesWithFlag);

        return {
            studentId,
            overall: record.overall,
            isLow: coursesWithFlag.some(c => c.isLow),
            courses: coursesWithFlag,
            advice,
        };
    }

    getAssignments(studentId: string, dueWithinHours: number = 48): AssignmentResult {
        const now = new Date();
        const cutoff = new Date(now.getTime() + dueWithinHours * 60 * 60 * 1000);

        const raw = this.studentRepo.getAssignments(studentId);
        const filtered = raw
            .filter(a => {
                const dueDateTime = new Date(`${a.dueDate}T${a.dueTime}:00`);
                return dueDateTime >= now && dueDateTime <= cutoff;
            })
            .map(a => {
                const dueDateTime = new Date(`${a.dueDate}T${a.dueTime}:00`);
                const hoursUntilDue = Math.round((dueDateTime.getTime() - now.getTime()) / (1000 * 60 * 60));
                return {
                    id: a.id,
                    courseId: a.courseId,
                    courseName: a.courseName,
                    title: a.title,
                    description: a.description,
                    dueDate: a.dueDate,
                    dueTime: a.dueTime,
                    weight: a.weight,
                    hoursUntilDue,
                };
            })
            .sort((a, b) => a.hoursUntilDue - b.hoursUntilDue);

        return { studentId, dueWithinHours, assignments: filtered };
    }
}
