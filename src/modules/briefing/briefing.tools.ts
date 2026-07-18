import { ToolDecorator as Tool, Widget, ExecutionContext, z, Injectable } from '@nitrostack/core';
import { AcademicsService } from '../academics/academics.service.js';
import { NavigationService } from '../navigation/navigation.service.js';
import { computeDailyAdvice, DailyAdviceItem } from './daily-advice.js';

// Note: Using explicit deps for ESM compatibility
@Injectable({ deps: [AcademicsService, NavigationService] })
export class BriefingTools {
    constructor(
        private readonly academicsService: AcademicsService,
        private readonly navigationService: NavigationService,
    ) {}

    // ─── get_morning_briefing ────────────────────────────────────────────────

    @Tool({
        name: 'get_morning_briefing',
        description: "Generate a personalised morning briefing for a student. Combines today's first class with its room location, an attendance warning if any course is below 75%, assignments due in the next 48 hours, a navigation tip (nearest printer to the first class building), and deterministic daily advice lines.",
        inputSchema: z.object({
            studentId: z.string().describe("The student's unique ID (e.g. \"student_001\")"),
        }),
        examples: {
            request: { studentId: 'student_001' },
            response: {
                studentId: 'student_001',
                studentName: 'Arjun Mehta',
                generatedAt: '2026-07-18T04:17:00.000Z',
                firstClass: {
                    courseId: 'CS301',
                    courseName: 'Algorithms & Data Structures',
                    faculty: 'Dr. Rajesh Kumar',
                    startTime: '09:00',
                    endTime: '10:30',
                    room: 'A-204',
                    building: 'block_a',
                    floor: 2,
                },
                classroomLocation: {
                    buildingName: 'Block A — Sciences & Computing',
                    room: 'A-204',
                    floor: 2,
                    landmark: 'Near the staircase on the south end',
                },
                attendanceWarning: {
                    hasWarning: true,
                    message: '⚠️ Your attendance in Algorithms & Data Structures is below the 75% minimum.',
                    affectedCourses: [
                        { courseId: 'CS301', courseName: 'Algorithms & Data Structures', percentage: 72 },
                    ],
                },
                assignmentsDueSoon: [
                    {
                        title: "Implement Dijkstra's Algorithm",
                        courseId: 'CS301',
                        courseName: 'Algorithms & Data Structures',
                        dueDate: '2026-07-19',
                        dueTime: '23:59',
                        hoursUntilDue: 26,
                        weight: '15%',
                    },
                ],
                navigationTip: {
                    message: 'Nearest printer to Block A is Block A — 2F Print Station (right around the corner). Room A-210.',
                    printerName: 'Block A — 2F Print Station',
                    room: 'A-210',
                    walkingMinutes: 2,
                },
                dailyAdvice: [
                    { type: 'prioritize', priority: 'high', message: '📚 Prioritise attending Algorithms & Data Structures...' },
                    { type: 'gap_time', priority: 'low', message: '⏱️ You have a 1h 30min gap between...' },
                ],
            },
        },
    })
    @Widget('briefing-dashboard')
    async getMorningBriefing(input: any, ctx: ExecutionContext) {
        ctx.logger.info('Generating morning briefing', { studentId: input.studentId });

        // Pull data from injected services — no duplicate data reads
        const timetable = this.academicsService.getTimetable(input.studentId);
        const attendance = this.academicsService.getAttendance(input.studentId);
        const assignments = this.academicsService.getAssignments(input.studentId, 48);

        // First class of the day
        const firstClass = timetable.classes[0] ?? null;

        // Classroom location for the first class
        const classroomLocation = firstClass
            ? this.navigationService.findClassroom(firstClass.courseId)
            : null;

        // Nearest printer to the first class building
        const printerBuilding = firstClass?.building ?? 'block_a';
        const printerInfo = this.navigationService.nearestPrinter(printerBuilding);

        // Attendance warning
        const lowCourses = attendance.courses.filter(c => c.isLow);
        const attendanceWarning = {
            hasWarning: attendance.isLow,
            message: attendance.isLow
                ? `⚠️ Your attendance in ${lowCourses.map(c => c.courseName).join(', ')} is below the 75% minimum.`
                : '✅ Your attendance is on track for all courses.',
            affectedCourses: lowCourses.map(c => ({
                courseId: c.courseId,
                courseName: c.courseName,
                percentage: c.percentage,
            })),
        };

        // Navigation tip
        const navigationTip = printerInfo.found && printerInfo.printer
            ? {
                  message: printerInfo.message + ` Room ${printerInfo.printer.room}.`,
                  printerName: printerInfo.printer.name,
                  room: printerInfo.printer.room,
                  walkingMinutes: printerInfo.printer.walkingMinutes,
              }
            : null;

        // Daily advice — additive field, deterministic
        const dailyAdvice: DailyAdviceItem[] = computeDailyAdvice({
            classes: timetable.classes,
            attendance,
            assignments,
            printer: printerInfo,
        });

        return {
            // ── All existing fields unchanged ──────────────────────────────────
            studentId: input.studentId,
            studentName: timetable.studentName,
            generatedAt: new Date().toISOString(),
            firstClass: firstClass
                ? {
                      courseId: firstClass.courseId,
                      courseName: firstClass.courseName,
                      faculty: firstClass.faculty,
                      startTime: firstClass.startTime,
                      endTime: firstClass.endTime,
                      room: firstClass.room,
                      building: firstClass.building,
                      floor: firstClass.floor,
                  }
                : null,
            classroomLocation: classroomLocation?.found
                ? {
                      buildingName: classroomLocation.buildingName,
                      room: classroomLocation.room,
                      floor: classroomLocation.floor,
                      landmark: classroomLocation.landmark,
                  }
                : null,
            attendanceWarning,
            assignmentsDueSoon: assignments.assignments.map(a => ({
                title: a.title,
                courseId: a.courseId,
                courseName: a.courseName,
                dueDate: a.dueDate,
                dueTime: a.dueTime,
                hoursUntilDue: a.hoursUntilDue,
                weight: a.weight,
            })),
            navigationTip,
            // ── New additive field ─────────────────────────────────────────────
            dailyAdvice,
        };
    }

    // ─── get_optimized_day ───────────────────────────────────────────────────

    @Tool({
        name: 'get_optimized_day',
        description: "Generate a structured, step-by-step optimised day plan for a student. Returns an ordered timeline of class blocks, study gaps, and action items — with a priority course recommendation, urgent assignments, equipment tips, and actionable daily advice. Use this when the student asks 'what should I focus on today' or 'plan my day'.",
        inputSchema: z.object({
            studentId: z.string().describe("The student's unique ID (e.g. \"student_001\")"),
        }),
        examples: {
            request: { studentId: 'student_001' },
            response: {
                studentId: 'student_001',
                studentName: 'Arjun Mehta',
                date: '2026-07-18',
                plan: [
                    { step: 1, time: '09:00', type: 'class', label: 'Algorithms & Data Structures', detail: 'Room A-204, Block A Floor 2 · Dr. Rajesh Kumar' },
                    { step: 2, time: '10:30', type: 'gap', label: '90-min Study Window', detail: 'Work on "Implement Dijkstra\'s Algorithm" due tomorrow' },
                    { step: 3, time: '11:00', type: 'class', label: 'Operating Systems', detail: 'Room A-301, Block A Floor 3 · Prof. Anita Sharma' },
                    { step: 4, time: '12:30', type: 'action', label: 'Print materials', detail: 'Block A 2F Print Station (2 min) supports colour' },
                ],
                priorityCourse: { courseId: 'CS301', courseName: 'Algorithms & Data Structures', reason: 'Attendance at 72% — below the 75% minimum' },
                urgentAssignments: [{ title: "Implement Dijkstra's Algorithm", hoursUntilDue: 26 }],
                dailyAdvice: [
                    { type: 'prioritize', priority: 'high', message: '📚 Prioritise attending Algorithms & Data Structures...' },
                ],
            },
        },
    })
    @Widget('day-plan')
    async getOptimizedDay(input: any, ctx: ExecutionContext) {
        ctx.logger.info('Generating optimised day plan', { studentId: input.studentId });

        const timetable = this.academicsService.getTimetable(input.studentId);
        const attendance = this.academicsService.getAttendance(input.studentId);
        const assignments = this.academicsService.getAssignments(input.studentId, 48);

        const printerBuilding = timetable.classes[0]?.building ?? 'block_a';
        const printerInfo = this.navigationService.nearestPrinter(printerBuilding);

        // Build ordered step-by-step plan
        const plan: {
            step: number;
            time: string;
            type: 'class' | 'gap' | 'action' | 'urgent';
            label: string;
            detail: string;
        }[] = [];

        let stepNum = 1;
        const classes = timetable.classes;

        for (let i = 0; i < classes.length; i++) {
            const cls = classes[i];

            // Add gap before first class if significant morning time exists
            if (i === 0) {
                const nowMins = new Date().getHours() * 60 + new Date().getMinutes();
                const classStartMins = parseInt(cls.startTime.split(':')[0]) * 60 + parseInt(cls.startTime.split(':')[1]);
                const earlyGap = classStartMins - nowMins;
                if (earlyGap >= 30 && earlyGap <= 180) {
                    const topAssignment = assignments.assignments[0];
                    plan.push({
                        step: stepNum++,
                        time: new Date().getHours().toString().padStart(2, '0') + ':' + new Date().getMinutes().toString().padStart(2, '0'),
                        type: 'gap',
                        label: `${earlyGap}-min Window Before Class`,
                        detail: topAssignment
                            ? `Review notes or start "${topAssignment.title}" before your first class`
                            : 'Grab breakfast and review today\'s material',
                    });
                }
            }

            // Class block
            const location = this.navigationService.findClassroom(cls.courseId);
            const locationDetail = location.found
                ? `Room ${location.room}, ${location.buildingName} Floor ${cls.floor} · ${cls.faculty}`
                : `Room ${cls.room} · ${cls.faculty}`;
            plan.push({
                step: stepNum++,
                time: cls.startTime,
                type: 'class',
                label: cls.courseName,
                detail: locationDetail,
            });

            // Gap to next class
            if (i < classes.length - 1) {
                const endMins = parseInt(cls.endTime.split(':')[0]) * 60 + parseInt(cls.endTime.split(':')[1]);
                const nextStartMins = parseInt(classes[i + 1].startTime.split(':')[0]) * 60 + parseInt(classes[i + 1].startTime.split(':')[1]);
                const gap = nextStartMins - endMins;

                if (gap >= 30) {
                    const topAssignment = assignments.assignments.find(a => a.hoursUntilDue < 48);
                    const gapHours = Math.floor(gap / 60);
                    const gapMins = gap % 60;
                    const gapLabel = gapHours > 0
                        ? `${gapHours}h${gapMins > 0 ? ` ${gapMins}min` : ''} Study Window`
                        : `${gapMins}-min Break`;
                    plan.push({
                        step: stepNum++,
                        time: cls.endTime,
                        type: 'gap',
                        label: gapLabel,
                        detail: topAssignment
                            ? `Work on "${topAssignment.title}" (due in ${topAssignment.hoursUntilDue}h)`
                            : 'Review lecture notes or get ahead on readings',
                    });
                }
            }
        }

        // Printer action if there's an assignment due soon
        if (printerInfo.found && printerInfo.printer && assignments.assignments.length > 0) {
            const lastClass = classes[classes.length - 1];
            plan.push({
                step: stepNum++,
                time: lastClass?.endTime ?? '18:00',
                type: 'action',
                label: 'Print assignment materials',
                detail: `${printerInfo.printer.name} — Room ${printerInfo.printer.room} (~${printerInfo.printer.walkingMinutes} min walk${printerInfo.printer.supportsColor ? ', colour supported' : ''})`,
            });
        }

        // Urgent assignments as standalone action items
        const urgent = assignments.assignments.filter(a => a.hoursUntilDue < 24);
        for (const a of urgent) {
            plan.push({
                step: stepNum++,
                time: '23:59',
                type: 'urgent',
                label: `🔴 DEADLINE: ${a.title}`,
                detail: `Due ${a.dueTime} tonight · ${a.courseName} · ${a.weight}`,
            });
        }

        // Determine priority course
        const criticalCourse = attendance.courses.find(c => c.percentage < 75);
        const priorityCourse = criticalCourse
            ? {
                  courseId: criticalCourse.courseId,
                  courseName: criticalCourse.courseName,
                  reason: `Attendance at ${criticalCourse.percentage}% — below the 75% minimum`,
              }
            : null;

        // Daily advice
        const dailyAdvice = computeDailyAdvice({
            classes,
            attendance,
            assignments,
            printer: printerInfo,
        });

        return {
            studentId: input.studentId,
            studentName: timetable.studentName,
            date: timetable.date,
            plan,
            priorityCourse,
            urgentAssignments: urgent.map(a => ({
                title: a.title,
                courseId: a.courseId,
                courseName: a.courseName,
                dueDate: a.dueDate,
                dueTime: a.dueTime,
                hoursUntilDue: a.hoursUntilDue,
                weight: a.weight,
            })),
            dailyAdvice,
        };
    }
}
