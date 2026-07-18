import { AttendanceCourse } from '../../data/data.service.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type AttendanceLevel = 'critical' | 'warning' | 'healthy';

export interface CourseAdvice {
    courseId: string;
    courseName: string;
    percentage: number;
    level: AttendanceLevel;
    /** Number of additional classes needed to reach 75%. 0 if level is not critical. */
    classesNeeded: number;
    message: string;
}

export interface AttendanceAdvice {
    /** High-level one-liner: worst-case summary or a positive note. */
    summary: string;
    courses: CourseAdvice[];
}

// ─── Logic ────────────────────────────────────────────────────────────────────

const CRITICAL_THRESHOLD = 75;
const WARNING_THRESHOLD = 80;

/**
 * Pure, deterministic advice computation — no external calls.
 *
 * Rules:
 *  < 75%  → critical: compute exact classes needed to reach 75%
 *  75–80% → warning:  "Don't miss any more classes this week"
 *  > 80%  → healthy:  short positive note
 */
export function computeAttendanceAdvice(
    courses: (AttendanceCourse & { isLow: boolean })[],
): AttendanceAdvice {
    const advisedCourses: CourseAdvice[] = courses.map(c => {
        if (c.percentage < CRITICAL_THRESHOLD) {
            // Classes needed: solve for x where (attended + x) / (total + x) >= 0.75
            // → attended + x >= 0.75 * total + 0.75x → 0.25x >= 0.75*total - attended
            // → x >= (0.75*total - attended) / 0.25 = 3*total - 4*attended
            // But simpler (and more intuitive for student): how many more must attend
            // assuming the denominator grows too: ceiling of (0.75*total - attended) / 0.25
            const needed = Math.ceil((CRITICAL_THRESHOLD / 100) * c.total - c.attended);
            return {
                courseId: c.courseId,
                courseName: c.courseName,
                percentage: c.percentage,
                level: 'critical',
                classesNeeded: Math.max(0, needed),
                message: `⚠️ Critical: Attend the next ${Math.max(0, needed)} class${needed === 1 ? '' : 'es'} of ${c.courseName} consecutively to recover to 75%. Missing any more will make recovery harder.`,
            };
        } else if (c.percentage <= WARNING_THRESHOLD) {
            return {
                courseId: c.courseId,
                courseName: c.courseName,
                percentage: c.percentage,
                level: 'warning',
                classesNeeded: 0,
                message: `📌 On the edge in ${c.courseName} (${c.percentage}%). Don't miss any more classes this week — you have minimal buffer.`,
            };
        } else {
            return {
                courseId: c.courseId,
                courseName: c.courseName,
                percentage: c.percentage,
                level: 'healthy',
                classesNeeded: 0,
                message: `✅ ${c.courseName}: Great attendance at ${c.percentage}%. Keep it up!`,
            };
        }
    });

    const criticalCount = advisedCourses.filter(a => a.level === 'critical').length;
    const warningCount = advisedCourses.filter(a => a.level === 'warning').length;

    let summary: string;
    if (criticalCount > 0) {
        const names = advisedCourses
            .filter(a => a.level === 'critical')
            .map(a => a.courseName)
            .join(', ');
        summary = `⚠️ Attendance is critically low in ${criticalCount} course${criticalCount > 1 ? 's' : ''}: ${names}. Immediate action required.`;
    } else if (warningCount > 0) {
        summary = `📌 Attendance is borderline in ${warningCount} course${warningCount > 1 ? 's' : ''}. Stay consistent this week.`;
    } else {
        summary = `✅ Attendance looks healthy across all courses. Keep attending regularly!`;
    }

    return { summary, courses: advisedCourses };
}
