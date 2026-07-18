import { ToolDecorator as Tool, Widget, ExecutionContext, z, Injectable } from '@nitrostack/core';
import { SessionContext } from '../../auth/session.context.js';
import { AcademicsService } from './academics.service.js';

// Note: Using explicit deps for ESM compatibility
@Injectable({ deps: [AcademicsService, SessionContext] })
export class AcademicsTools {
    constructor(
        private readonly academicsService: AcademicsService,
        private readonly sessionContext: SessionContext
    ) { }

    // ─── get_timetable ──────────────────────────────────────────────────────

    @Tool({
        name: 'get_timetable',
        description: "Retrieve a student's class schedule for today. Returns course name, room number, floor, building, start/end time, and faculty for each class scheduled on the current day of the week.",
        inputSchema: z.object({}),
        examples: {
            request: { studentId: 'student_001' },
            response: {
                studentId: 'student_001',
                studentName: 'Arjun Mehta',
                date: '2026-07-17',
                dayOfWeek: 'Thursday',
                classes: [
                    {
                        courseId: 'CS301',
                        courseName: 'Algorithms & Data Structures',
                        faculty: 'Dr. Rajesh Kumar',
                        room: 'A-204',
                        building: 'block_a',
                        floor: 2,
                        startTime: '09:00',
                        endTime: '10:30',
                        dayOfWeek: ['Monday', 'Wednesday', 'Friday'],
                    },
                ],
            },
        },
    })
    @Widget('schedule-card')
    async getTimetable(input: any, ctx: ExecutionContext) {
        const studentId = this.sessionContext.getAuthenticatedStudentId();
        if (!studentId) {
            throw new Error("Please authenticate first using your email and password.");
        }
        ctx.logger.info('Fetching timetable', { studentId });
        return this.academicsService.getTimetable(studentId);
    }

    // ─── get_attendance ─────────────────────────────────────────────────────

    @Tool({
        name: 'get_attendance',
        description: 'Get attendance percentage per course for a student, their overall attendance, and a boolean isLow flag that is true when any course is below 75% (the minimum required attendance threshold).',
        inputSchema: z.object({}),
        examples: {
            request: { studentId: 'student_001' },
            response: {
                studentId: 'student_001',
                overall: 79,
                isLow: true,
                courses: [
                    { courseId: 'CS301', courseName: 'Algorithms & Data Structures', attended: 26, total: 36, percentage: 72, isLow: true },
                    { courseId: 'CS312', courseName: 'Operating Systems', attended: 30, total: 36, percentage: 83, isLow: false },
                ],
            },
        },
    })
    @Widget('attendance-gauge')
    async getAttendance(input: any, ctx: ExecutionContext) {
        const studentId = this.sessionContext.getAuthenticatedStudentId();
        if (!studentId) {
            throw new Error("Please authenticate first using your email and password.");
        }
        ctx.logger.info('Fetching attendance', { studentId });
        return this.academicsService.getAttendance(studentId);
    }

    // ─── get_assignments ─────────────────────────────────────────────────────

    @Tool({
        name: 'get_assignments',
        description: 'Get a student\'s pending assignments due within a specified number of hours. Defaults to the next 48 hours. Returns sorted by nearest deadline first.',
        inputSchema: z.object({
            dueWithinHours: z
                .number()
                .min(1)
                .max(168)
                .default(48)
                .describe('Return assignments due within this many hours from now. Default is 48 hours.'),
        }),
        examples: {
            request: { studentId: 'student_001', dueWithinHours: 48 },
            response: {
                studentId: 'student_001',
                dueWithinHours: 48,
                assignments: [
                    {
                        id: 'asgn_001',
                        courseId: 'CS301',
                        courseName: 'Algorithms & Data Structures',
                        title: "Implement Dijkstra's Algorithm",
                        description: 'Implement Dijkstra\'s shortest path algorithm and benchmark it on provided test graphs.',
                        dueDate: '2026-07-18',
                        dueTime: '23:59',
                        weight: '15%',
                        hoursUntilDue: 26,
                    },
                ],
            },
        },
    })
    async getAssignments(input: any, ctx: ExecutionContext) {
        const studentId = this.sessionContext.getAuthenticatedStudentId();
        if (!studentId) {
            throw new Error("Please authenticate first using your email and password.");
        }
        ctx.logger.info('Fetching assignments', {
            studentId,
            dueWithinHours: input.dueWithinHours,
        });
        return this.academicsService.getAssignments(studentId, input.dueWithinHours ?? 48);
    }
}
