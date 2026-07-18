'use client';

import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

interface CourseAdvice {
    courseId: string;
    level: 'critical' | 'warning' | 'healthy';
    classesNeeded: number;
    message: string;
}

interface AttendanceCourse {
    courseId: string;
    courseName: string;
    attended: number;
    total: number;
    percentage: number;
    isLow: boolean;
}

interface AttendanceData {
    studentId: string;
    overall: number;
    isLow: boolean;
    courses: AttendanceCourse[];
    advice?: {
        summary: string;
        courses: CourseAdvice[];
    };
}

function getStatusColor(pct: number): { bar: string; label: string } {
    if (pct >= 85) return { bar: '#22c55e', label: '#16a34a' }; // green
    if (pct >= 75) return { bar: '#f59e0b', label: '#d97706' }; // amber
    return { bar: '#ef4444', label: '#dc2626' };                 // red
}

function StatusBadge({ isLow }: { isLow: boolean }) {
    const style = {
        display: 'inline-flex', alignItems: 'center', gap: 4,
        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 20,
        background: isLow ? '#fef2f2' : '#f0fdf4',
        color: isLow ? '#dc2626' : '#16a34a',
    };
    return <span style={style}>{isLow ? '⚠️ Below Threshold' : '✅ On Track'}</span>;
}

export default function AttendanceGauge() {
    const { isReady, getToolOutput } = useWidgetSDK();
    const theme = useTheme();
    const data = getToolOutput<AttendanceData>();
    const isDark = theme === 'dark';

    const bg = isDark ? '#0f172a' : '#ffffff';
    const surface = isDark ? '#1e293b' : '#f8fafc';
    const border = isDark ? '#334155' : '#e2e8f0';
    const text = isDark ? '#f1f5f9' : '#0f172a';
    const muted = isDark ? '#94a3b8' : '#64748b';
    const trackBg = isDark ? '#334155' : '#e2e8f0';

    if (!isReady) {
        return (
            <div style={{ padding: 24, background: bg, color: muted, textAlign: 'center', borderRadius: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Loading attendance…</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: 24, background: bg, color: text, textAlign: 'center', borderRadius: 12 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📊</div>
                <div style={{ fontWeight: 600 }}>No attendance data</div>
            </div>
        );
    }

    const overallColors = getStatusColor(data.overall);

    return (
        <div style={{ background: bg, padding: 16, fontFamily: 'system-ui, sans-serif', color: text, borderRadius: 12 }}>
            {/* Header */}
            <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                marginBottom: 14, paddingBottom: 12, borderBottom: `1px solid ${border}`
            }}>
                <div style={{ fontSize: 15, fontWeight: 700 }}>Attendance Overview</div>
                <StatusBadge isLow={data.isLow} />
            </div>

            {/* Overall gauge */}
            <div style={{
                background: surface, borderRadius: 10, padding: 14,
                border: `1px solid ${border}`, marginBottom: 14
            }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <div style={{ fontSize: 13, fontWeight: 600 }}>Overall Attendance</div>
                    <div style={{ fontSize: 20, fontWeight: 800, color: overallColors.label }}>
                        {data.overall}%
                    </div>
                </div>
                <div style={{ height: 10, background: trackBg, borderRadius: 5, overflow: 'hidden' }}>
                    <div style={{
                        height: '100%',
                        width: `${data.overall}%`,
                        background: overallColors.bar,
                        borderRadius: 5,
                        transition: 'width 0.4s ease',
                    }} />
                </div>
                <div style={{ fontSize: 10, color: muted, marginTop: 6, textAlign: 'right' }}>
                    Minimum required: 75%
                </div>
            </div>

            {/* Per-course breakdown */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {data.courses.map(course => {
                    const colors = getStatusColor(course.percentage);
                    return (
                        <div key={course.courseId} style={{
                            background: surface, borderRadius: 10, padding: '10px 14px',
                            border: `1px solid ${border}`,
                            borderLeft: `4px solid ${colors.bar}`,
                        }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                                <div>
                                    <div style={{ fontSize: 12, fontWeight: 700 }}>{course.courseName}</div>
                                    <div style={{ fontSize: 10, color: muted, marginTop: 1 }}>
                                        {course.attended}/{course.total} classes attended
                                    </div>
                                </div>
                                <div style={{ fontSize: 16, fontWeight: 800, color: colors.label }}>
                                    {course.percentage}%
                                </div>
                            </div>
                            <div style={{ height: 6, background: trackBg, borderRadius: 3, overflow: 'hidden' }}>
                                <div style={{
                                    height: '100%',
                                    width: `${course.percentage}%`,
                                    background: colors.bar,
                                    borderRadius: 3,
                                }} />
                            </div>
                            {course.isLow && (
                                <div style={{ fontSize: 10, color: '#dc2626', marginTop: 5, fontWeight: 600 }}>
                                    ⚠️ Need {Math.ceil(0.75 * course.total - course.attended)} more classes to reach 75%
                                </div>
                            )}
                            {(() => {
                                const courseAdvice = data.advice?.courses.find(a => a.courseId === course.courseId);
                                if (!courseAdvice) return null;
                                const adviceColor = courseAdvice.level === 'critical'
                                    ? '#dc2626'
                                    : courseAdvice.level === 'warning'
                                    ? '#d97706'
                                    : '#16a34a';
                                return (
                                    <div style={{
                                        fontSize: 10, color: adviceColor,
                                        marginTop: 6, lineHeight: 1.5,
                                        borderTop: `1px dashed ${border}`,
                                        paddingTop: 5,
                                    }}>
                                        {courseAdvice.message}
                                    </div>
                                );
                            })()}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
