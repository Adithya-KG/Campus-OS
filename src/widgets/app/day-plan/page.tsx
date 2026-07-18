'use client';

import { useWidgetSDK, useTheme } from '@nitrostack/widgets';

// ─── Types ────────────────────────────────────────────────────────────────────

type PlanStepType = 'class' | 'gap' | 'action' | 'urgent';
type DailyAdviceType = 'gap_time' | 'prioritize' | 'assignment_urgency' | 'equipment';
type Priority = 'high' | 'medium' | 'low';

interface PlanStep {
    step: number;
    time: string;
    type: PlanStepType;
    label: string;
    detail: string;
}

interface PriorityCourse {
    courseId: string;
    courseName: string;
    reason: string;
}

interface UrgentAssignment {
    title: string;
    courseId: string;
    courseName: string;
    dueDate: string;
    dueTime: string;
    hoursUntilDue: number;
    weight: string;
}

interface DailyAdviceItem {
    type: DailyAdviceType;
    priority: Priority;
    message: string;
}

interface DayPlanData {
    studentName: string;
    date: string;
    plan: PlanStep[];
    priorityCourse: PriorityCourse | null;
    urgentAssignments: UrgentAssignment[];
    dailyAdvice: DailyAdviceItem[];
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function timeLabel(time: string): string {
    const [h, m] = time.split(':').map(Number);
    const suffix = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 || 12;
    return `${displayH}:${m.toString().padStart(2, '0')} ${suffix}`;
}

const TYPE_CONFIG: Record<PlanStepType, { icon: string; color: string; label: string }> = {
    class:  { icon: '🎓', color: '#6366f1', label: 'Class' },
    gap:    { icon: '⏱️', color: '#14b8a6', label: 'Study Gap' },
    action: { icon: '✅', color: '#f59e0b', label: 'Action' },
    urgent: { icon: '🔴', color: '#ef4444', label: 'Urgent' },
};

const ADVICE_COLOR: Record<Priority, string> = {
    high:   '#ef4444',
    medium: '#f59e0b',
    low:    '#6366f1',
};

// ─── Component ───────────────────────────────────────────────────────────────

export default function DayPlan() {
    const { isReady, getToolOutput } = useWidgetSDK();
    const theme = useTheme();
    const data = getToolOutput<DayPlanData>();
    const isDark = theme === 'dark';

    const bg      = isDark ? '#0f172a' : '#ffffff';
    const surface = isDark ? '#1e293b' : '#f8fafc';
    const border  = isDark ? '#334155' : '#e2e8f0';
    const text    = isDark ? '#f1f5f9' : '#0f172a';
    const muted   = isDark ? '#94a3b8' : '#64748b';
    const INDIGO  = '#6366f1';
    const AMBER   = '#f59e0b';
    const RED     = '#ef4444';

    if (!isReady) {
        return (
            <div style={{ padding: 24, background: bg, color: muted, textAlign: 'center', borderRadius: 12 }}>
                <div style={{ fontSize: 28, marginBottom: 8 }}>⏳</div>
                <div style={{ fontSize: 13, fontWeight: 600 }}>Loading day plan…</div>
            </div>
        );
    }

    if (!data) {
        return (
            <div style={{ padding: 24, background: bg, color: text, textAlign: 'center', borderRadius: 12 }}>
                <div style={{ fontSize: 40, marginBottom: 8 }}>📅</div>
                <div style={{ fontWeight: 600 }}>No day plan data</div>
            </div>
        );
    }

    const dateDisplay = new Date(data.date + 'T00:00:00').toLocaleDateString('en-US', {
        weekday: 'long', month: 'long', day: 'numeric',
    });

    return (
        <div style={{ background: bg, padding: 16, fontFamily: 'system-ui, sans-serif', color: text, borderRadius: 12, maxWidth: 440 }}>

            {/* Header */}
            <div style={{
                background: `linear-gradient(135deg, #0f172a 0%, ${INDIGO} 100%)`,
                borderRadius: 12, padding: '14px 16px', marginBottom: 14, color: '#fff',
            }}>
                <div style={{ fontSize: 11, opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Optimised Day Plan</div>
                <div style={{ fontSize: 17, fontWeight: 800, marginTop: 4 }}>{data.studentName}</div>
                <div style={{ fontSize: 11, opacity: 0.7, marginTop: 2 }}>{dateDisplay}</div>
            </div>

            {/* Priority course banner */}
            {data.priorityCourse && (
                <div style={{
                    background: isDark ? '#450a0a' : '#fef2f2',
                    border: `1px solid ${RED}`,
                    borderRadius: 10, padding: '10px 14px', marginBottom: 14,
                }}>
                    <div style={{ fontSize: 11, fontWeight: 700, color: RED, marginBottom: 3 }}>
                        🎯 PRIORITY COURSE
                    </div>
                    <div style={{ fontSize: 13, fontWeight: 700, color: text }}>{data.priorityCourse.courseName}</div>
                    <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>{data.priorityCourse.reason}</div>
                </div>
            )}

            {/* Timeline */}
            <div style={{ marginBottom: 14 }}>
                <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: INDIGO, marginBottom: 10 }}>
                    📋 Today's Plan
                </div>
                <div style={{ position: 'relative' }}>
                    {data.plan.map((step, idx) => {
                        const cfg = TYPE_CONFIG[step.type];
                        const isLast = idx === data.plan.length - 1;
                        return (
                            <div key={step.step} style={{ display: 'flex', gap: 10, marginBottom: isLast ? 0 : 8 }}>
                                {/* Step bubble + connector */}
                                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flexShrink: 0 }}>
                                    <div style={{
                                        width: 28, height: 28, borderRadius: '50%',
                                        background: cfg.color, color: '#fff',
                                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                                        fontSize: 11, fontWeight: 800, flexShrink: 0,
                                    }}>
                                        {step.step}
                                    </div>
                                    {!isLast && (
                                        <div style={{ width: 2, flex: 1, background: border, minHeight: 12, marginTop: 4 }} />
                                    )}
                                </div>
                                {/* Content */}
                                <div style={{
                                    background: surface, borderRadius: 10, padding: '10px 12px',
                                    border: `1px solid ${border}`,
                                    borderLeft: `3px solid ${cfg.color}`,
                                    flex: 1, marginBottom: 4,
                                }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 6 }}>
                                        <div style={{ fontSize: 12, fontWeight: 700 }}>
                                            {cfg.icon} {step.label}
                                        </div>
                                        <div style={{
                                            fontSize: 10, fontWeight: 700, color: cfg.color,
                                            background: isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)',
                                            padding: '2px 7px', borderRadius: 8, flexShrink: 0,
                                        }}>
                                            {timeLabel(step.time)}
                                        </div>
                                    </div>
                                    <div style={{ fontSize: 11, color: muted, marginTop: 3 }}>
                                        {step.detail}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* Daily advice */}
            {data.dailyAdvice.length > 0 && (
                <div>
                    <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: AMBER, marginBottom: 10 }}>
                        💡 Daily Advice
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                        {data.dailyAdvice.map((item, i) => (
                            <div key={i} style={{
                                background: surface, borderRadius: 8, padding: '8px 12px',
                                border: `1px solid ${border}`,
                                borderLeft: `3px solid ${ADVICE_COLOR[item.priority]}`,
                                fontSize: 11, color: text, lineHeight: 1.5,
                            }}>
                                {item.message}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
