import { TimetableEntry } from '../../data/data.service.js';
import { AttendanceResult } from '../academics/academics.service.js';
import { AssignmentResult } from '../academics/academics.service.js';
import { NearestPrinterResult } from '../navigation/navigation.service.js';

// ─── Types ────────────────────────────────────────────────────────────────────

export type DailyAdviceType = 'gap_time' | 'prioritize' | 'assignment_urgency' | 'equipment';

export interface DailyAdviceItem {
    type: DailyAdviceType;
    priority: 'high' | 'medium' | 'low';
    message: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toMinutes(timeStr: string): number {
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
}

function formatDuration(minutes: number): string {
    if (minutes < 60) return `${minutes} min`;
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function timeLabel(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`;
}

// ─── Core Logic ───────────────────────────────────────────────────────────────

/**
 * Produces 2–4 short, actionable daily advice items.
 * Fully deterministic — no external calls.
 */
export function computeDailyAdvice(params: {
    classes: TimetableEntry[];
    attendance: AttendanceResult;
    assignments: AssignmentResult;
    printer: NearestPrinterResult;
}): DailyAdviceItem[] {
    const { classes, attendance, assignments, printer } = params;
    const items: DailyAdviceItem[] = [];

    // ── 1. Urgent assignments (< 24h) ────────────────────────────────────────
    const urgent = assignments.assignments.filter(a => a.hoursUntilDue < 24);
    for (const a of urgent) {
        items.push({
            type: 'assignment_urgency',
            priority: 'high',
            message: `🔴 URGENT: "${a.title}" for ${a.courseName} is due in ${a.hoursUntilDue}h. Prioritise this above everything else today.`,
        });
    }

    // ── 2. Attendance prioritisation ─────────────────────────────────────────
    const criticalCourses = attendance.courses.filter(c => c.percentage < 75);
    if (criticalCourses.length > 0) {
        const courseName = criticalCourses[0].courseName;
        const advice = attendance.advice.courses.find(a => a.courseId === criticalCourses[0].courseId);
        const needed = advice?.classesNeeded ?? 0;
        items.push({
            type: 'prioritize',
            priority: 'high',
            message: `📚 Prioritise attending ${courseName} — you need ${needed} more class${needed === 1 ? '' : 'es'} to avoid the attendance penalty. Do not skip today's session.`,
        });
    } else if (attendance.courses.some(c => c.percentage <= 80)) {
        const borderline = attendance.courses.find(c => c.percentage <= 80)!;
        items.push({
            type: 'prioritize',
            priority: 'medium',
            message: `📌 ${borderline.courseName} is at ${borderline.percentage}% — stay consistent and don't miss this week's classes.`,
        });
    }

    // ── 3. Gap-time suggestions ───────────────────────────────────────────────
    if (classes.length >= 2) {
        for (let i = 0; i < classes.length - 1; i++) {
            const endMin = toMinutes(classes[i].endTime);
            const startMin = toMinutes(classes[i + 1].startTime);
            const gap = startMin - endMin;

            if (gap >= 60) {
                // Find most urgent non-urgent assignment to fill the gap
                const fillWith = assignments.assignments.find(a => a.hoursUntilDue >= 24);
                const activity = fillWith
                    ? `work on "${fillWith.title}" (${fillWith.courseName})`
                    : 'review notes or get ahead on readings';
                items.push({
                    type: 'gap_time',
                    priority: 'low',
                    message: `⏱️ You have a ${formatDuration(gap)} gap between ${timeLabel(classes[i].endTime)} and ${timeLabel(classes[i + 1].startTime)}. Good window to ${activity}.`,
                });
                break; // Only surface the first significant gap to keep advice concise
            }
        }
    } else if (classes.length === 0) {
        // No classes today — good study day
        const topAssignment = assignments.assignments[0];
        if (topAssignment) {
            items.push({
                type: 'gap_time',
                priority: 'low',
                message: `📖 No classes today — great opportunity to get ahead on "${topAssignment.title}" due ${topAssignment.dueDate}.`,
            });
        }
    }

    // ── 4. Equipment / print tip ──────────────────────────────────────────────
    if (printer.found && printer.printer) {
        const p = printer.printer;
        // Only surface the tip if there's an upcoming assignment and printer is close
        const hasAssignment = assignments.assignments.length > 0;
        if (hasAssignment && p.walkingMinutes <= 5) {
            items.push({
                type: 'equipment',
                priority: 'low',
                message: `🖨️ ${p.name} is only ~${p.walkingMinutes} min away (Room ${p.room})${p.supportsColor ? ', supports colour printing' : ''}. Print your assignment materials before class.`,
            });
        }
    }

    // Cap at 4 items, highest priority first
    const priorityOrder = { high: 0, medium: 1, low: 2 };
    return items
        .sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority])
        .slice(0, 4);
}
