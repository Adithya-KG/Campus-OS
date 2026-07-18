'use client';

import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface FirstClass {
    courseId: string;
    courseName: string;
    faculty: string;
    startTime: string;
    endTime: string;
    room: string;
    building: string;
    floor: number;
}

interface ClassroomLocation {
    buildingName: string;
    room: string;
    floor: number;
    landmark: string;
}

interface AttendanceWarning {
    hasWarning: boolean;
    message: string;
    affectedCourses: { courseId: string; courseName: string; percentage: number }[];
}

interface AssignmentItem {
    title: string;
    courseId: string;
    courseName: string;
    dueDate: string;
    dueTime: string;
    hoursUntilDue: number;
    weight: string;
}

interface NavigationTip {
    message: string;
    printerName: string;
    room: string;
    walkingMinutes: number;
}

interface DailyAdviceItem {
    type: string;
    priority: 'high' | 'medium' | 'low';
    message: string;
}

interface BriefingData {
    studentName: string;
    generatedAt: string;
    firstClass: FirstClass | null;
    classroomLocation: ClassroomLocation | null;
    attendanceWarning: AttendanceWarning;
    assignmentsDueSoon: AssignmentItem[];
    navigationTip: NavigationTip | null;
    dailyAdvice?: DailyAdviceItem[];
}

function timeLabel(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`;
}

function Section({ title, icon, children, borderColor }: {
    title: string; icon: string; children: React.ReactNode; borderColor: string;
}) {
    return (
        <div style={{ marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <span style={{ fontSize: 14 }}>{icon}</span>
                <span style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: borderColor }}>
                    {title}
                </span>
            </div>
            {children}
        </div>
    );
}

export default function BriefingDashboard() {
    const { isReady, getToolOutput } = useWidgetSDK();
    const theme = useTheme();
    const data = getToolOutput<BriefingData>();
    const isDark = theme === 'dark';

    const bg      = isDark ? '#0f172a' : '#ffffff';
    const surface = isDark ? '#1e293b' : '#f8fafc';
    const border  = isDark ? '#334155' : '#e2e8f0';
    const text    = isDark ? '#f1f5f9' : '#0f172a';
    const muted   = isDark ? '#94a3b8' : '#64748b';

    const INDIGO = '#6366f1';
    const RED    = '#ef4444';
    const AMBER  = '#f59e0b';
    const GREEN  = '#22c55e';
    const TEAL   = '#14b8a6';

    // ── Not yet connected to host ──────────────────────────────────────────────
    if (!isReady) {
        return (
            <div style={{ padding: 24, background: bg, color: muted, textAlign: 'center', borderRadius: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Loading briefing…</div>
            </div>
        );
    }

    // ── Tool hasn't returned data yet (genuine no-data state) ─────────────────
    if (!data) {
        return (
            <div style={{ padding: 24, background: bg, color: text, textAlign: 'center', borderRadius: 12 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>🌅</div>
                <div style={{ fontWeight: 600 }}>No briefing data</div>
                <div style={{ fontSize: 12, color: muted, marginTop: 6 }}>
                    Ask the assistant to run get_morning_briefing for your student ID.
                </div>
            </div>
        );
    }

    // ── Data present — render full briefing ────────────────────────────────────
    // Note: data.firstClass being null is VALID (weekend / no classes today)
    // We still render attendance, assignments, navigation tip, and daily advice.

    const now = new Date(data.generatedAt);
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 18 ? 'Good afternoon' : 'Good evening';

    return (
        <div style={{ background: bg, padding: 16, fontFamily: 'system-ui, sans-serif', color: text, borderRadius: 12, maxWidth: 420 }}>

            {/* Greeting header */}
            <div style={{
                background: `linear-gradient(135deg, ${INDIGO} 0%, #818cf8 100%)`,
                borderRadius: 12, padding: '14px 16px', marginBottom: 14, color: '#fff'
            }}>
                <div style={{ fontSize: 13, opacity: 0.85 }}>{greeting},</div>
                <div style={{ fontSize: 18, fontWeight: 800 }}>{data.studentName} 👋</div>
                <div style={{ fontSize: 11, opacity: 0.75, marginTop: 4 }}>
                    {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
                </div>
            </div>

            {/* Attendance warning — always show when data is present */}
            <div style={{
                background: data.attendanceWarning.hasWarning
                    ? (isDark ? '#450a0a' : '#fef2f2')
                    : (isDark ? '#052e16' : '#f0fdf4'),
                border: `1px solid ${data.attendanceWarning.hasWarning ? RED : GREEN}`,
                borderRadius: 10, padding: '10px 14px', marginBottom: 14,
            }}>
                <div style={{ fontSize: 12, fontWeight: 700, color: data.attendanceWarning.hasWarning ? RED : GREEN, marginBottom: 4 }}>
                    {data.attendanceWarning.hasWarning ? '⚠️ Attendance Alert' : '✅ Attendance OK'}
                </div>
                <div style={{ fontSize: 12, color: data.attendanceWarning.hasWarning ? (isDark ? '#fca5a5' : '#991b1b') : (isDark ? '#86efac' : '#166534') }}>
                    {data.attendanceWarning.message}
                </div>
            </div>

            {/* First class — only when there ARE classes today */}
            {data.firstClass ? (
                <Section title="First class today" icon="🎓" borderColor={INDIGO}>
                    <div style={{
                        background: surface, borderRadius: 10, padding: '12px 14px',
                        border: `1px solid ${border}`, borderLeft: `4px solid ${INDIGO}`
                    }}>
                        <div style={{ fontWeight: 700, fontSize: 13 }}>{data.firstClass.courseName}</div>
                        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                            {timeLabel(data.firstClass.startTime)} – {timeLabel(data.firstClass.endTime)} · {data.firstClass.faculty}
                        </div>
                        {data.classroomLocation && (
                            <div style={{ fontSize: 11, color: muted, marginTop: 4 }}>
                                📍 {data.classroomLocation.buildingName}, Room {data.classroomLocation.room} (Floor {data.classroomLocation.floor})
                                {data.classroomLocation.landmark && (
                                    <span style={{ display: 'block', marginTop: 2, fontStyle: 'italic' }}>
                                        {data.classroomLocation.landmark}
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </Section>
            ) : (
                /* No classes today is a valid, distinct state — show a positive note */
                <div style={{
                    background: isDark ? '#0f2a1a' : '#f0fdf4',
                    border: `1px solid ${GREEN}`,
                    borderRadius: 10, padding: '10px 14px', marginBottom: 12,
                }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: GREEN }}>🎉 No classes today</div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
                        Great day to catch up on assignments or review your notes.
                    </div>
                </div>
            )}

            {/* Assignments due soon */}
            {data.assignmentsDueSoon.length > 0 && (
                <Section title="Due soon" icon="📝" borderColor={AMBER}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {data.assignmentsDueSoon.map(a => (
                            <div key={a.title} style={{
                                background: surface, borderRadius: 10, padding: '10px 14px',
                                border: `1px solid ${border}`, borderLeft: `4px solid ${AMBER}`
                            }}>
                                <div style={{ fontWeight: 700, fontSize: 12 }}>{a.title}</div>
                                <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                                    {a.courseName} · {a.weight}
                                </div>
                                <div style={{ fontSize: 11, color: a.hoursUntilDue < 24 ? RED : AMBER, fontWeight: 600, marginTop: 3 }}>
                                    ⏰ Due in {a.hoursUntilDue}h ({a.dueDate} {a.dueTime})
                                </div>
                            </div>
                        ))}
                    </div>
                </Section>
            )}

            {/* Navigation tip */}
            {data.navigationTip && (
                <Section title="Navigation tip" icon="🖨️" borderColor={TEAL}>
                    <div style={{
                        background: surface, borderRadius: 10, padding: '10px 14px',
                        border: `1px solid ${border}`, borderLeft: `4px solid ${TEAL}`
                    }}>
                        <div style={{ fontWeight: 700, fontSize: 12 }}>{data.navigationTip.printerName}</div>
                        <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
                            Room {data.navigationTip.room} · ~{data.navigationTip.walkingMinutes} min walk
                        </div>
                    </div>
                </Section>
            )}

            {/* Daily advice */}
            {data.dailyAdvice && data.dailyAdvice.length > 0 && (
                <Section title="Today's advice" icon="💡" borderColor='#f59e0b'>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {data.dailyAdvice.map((item, i) => {
                            const priorityColor = item.priority === 'high' ? RED : item.priority === 'medium' ? AMBER : INDIGO;
                            return (
                                <div key={i} style={{
                                    background: surface, borderRadius: 8, padding: '8px 12px',
                                    border: `1px solid ${border}`,
                                    borderLeft: `3px solid ${priorityColor}`,
                                    fontSize: 11, color: text, lineHeight: 1.5,
                                }}>
                                    {item.message}
                                </div>
                            );
                        })}
                    </div>
                </Section>
            )}
        </div>
    );
}
