'use client';

import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface TimetableEntry {
    courseId: string;
    courseName: string;
    faculty: string;
    room: string;
    building: string;
    floor: number;
    startTime: string;
    endTime: string;
}

interface ScheduleData {
    studentName: string;
    date: string;
    dayOfWeek: string;
    classes: TimetableEntry[];
}

function timeLabel(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`;
}

const BUILDING_LABELS: Record<string, string> = {
    block_a: 'Block A',
    block_b: 'Block B',
    library: 'Library',
    student_centre: 'Student Centre',
};

export default function ScheduleCard() {
    const { isReady, getToolOutput } = useWidgetSDK();
    const theme = useTheme();
    const data = getToolOutput<ScheduleData>();
    const isDark = theme === 'dark';

    const bg = isDark ? '#0f172a' : '#ffffff';
    const surface = isDark ? '#1e293b' : '#f8fafc';
    const border = isDark ? '#334155' : '#e2e8f0';
    const text = isDark ? '#f1f5f9' : '#0f172a';
    const muted = isDark ? '#94a3b8' : '#64748b';
    const accent = '#6366f1'; // indigo

    if (!isReady) {
        return (
            <div style={{ padding: 24, background: bg, color: muted, textAlign: 'center', borderRadius: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Loading schedule…</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: 24, background: bg, color: text, textAlign: 'center', borderRadius: 12 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
                <div style={{ fontWeight: 600 }}>No schedule data</div>
            </div>
        );
    }

    return (
        <div style={{ background: bg, padding: 16, fontFamily: 'system-ui, sans-serif', color: text, borderRadius: 12 }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${border}`
            }}>
                <div>
                    <div style={{ fontSize: 15, fontWeight: 700 }}>{data.studentName}'s Schedule</div>
                    <div style={{ fontSize: 12, color: muted, marginTop: 2 }}>
                        {data.dayOfWeek}, {new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </div>
                </div>
                <div style={{
                    background: accent, color: '#fff', borderRadius: 20,
                    padding: '4px 12px', fontSize: 12, fontWeight: 600
                }}>
                    {data.classes.length} {data.classes.length === 1 ? 'class' : 'classes'}
                </div>
            </div>

            {/* Class list */}
            {data.classes.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '24px 0', color: muted }}>
                    <div style={{ fontSize: 32, marginBottom: 8 }}>🎉</div>
                    <div style={{ fontWeight: 600 }}>No classes today!</div>
                </div>
            ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {data.classes.map((cls, i) => (
                        <div key={cls.courseId} style={{
                            background: surface, borderRadius: 10, padding: '12px 14px',
                            border: `1px solid ${border}`,
                            borderLeft: `4px solid ${accent}`,
                            display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8
                        }}>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {cls.courseName}
                                </div>
                                <div style={{ fontSize: 11, color: muted }}>
                                    {cls.faculty} · {BUILDING_LABELS[cls.building] ?? cls.building}, Floor {cls.floor}, Room {cls.room}
                                </div>
                            </div>
                            <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                <div style={{ fontSize: 13, fontWeight: 700, color: accent }}>
                                    {timeLabel(cls.startTime)}
                                </div>
                                <div style={{ fontSize: 11, color: muted }}>
                                    → {timeLabel(cls.endTime)}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
