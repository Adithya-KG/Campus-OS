import { PromptDecorator as Prompt, ExecutionContext, Injectable } from '@nitrostack/core';

/**
 * BriefingPrompts — exposes MCP Prompt primitives for the briefing module.
 *
 * The "prepare-morning-briefing" prompt is DISTINCT from the get_morning_briefing
 * tool. The tool is the fast, reliable pre-computed path. The Prompt is the
 * reasoning path — it guides the model to call individual tools in sequence
 * and synthesise the result itself, demonstrating the Prompt MCP primitive.
 */
import { SessionContext } from '../../auth/session.context.js';

@Injectable({ deps: [SessionContext] })
export class BriefingPrompts {
    constructor(private readonly sessionContext: SessionContext) {}

    @Prompt({
        name: 'prepare-morning-briefing',
        description:
            'Guides the model to sequentially call get_timetable, get_attendance, get_assignments, and nearest_printer for a student, then synthesise a complete, personalised morning briefing from those tool results. Use this prompt when you want the model to reason through the briefing step-by-step rather than using the pre-computed get_morning_briefing tool.',
        arguments: [
            {
                name: 'buildingId',
                description: 'The building to check nearest printer for (default: "block_a")',
                required: false,
            },
        ],
    })
    async prepareMorningBriefing(
        args: { buildingId?: string },
        ctx: ExecutionContext,
    ) {
        const studentId = this.sessionContext.getAuthenticatedStudentId();
        if (!studentId) {
            return {
                messages: [
                    {
                        role: 'user',
                        content: {
                            type: 'text',
                            text: 'Please authenticate first using your email and password.'
                        }
                    }
                ]
            };
        }
        ctx.logger.info('Prompt: prepare-morning-briefing invoked', { studentId });

        const buildingId = args.buildingId ?? 'block_a';

        return {
            messages: [
                {
                    role: 'user',
                    content: {
                        type: 'text',
                        text: `You are CampusOS, an AI-native campus assistant. Your task is to prepare a complete, personalised morning briefing for student "${studentId}".

Follow these steps IN ORDER — call each tool and wait for its result before the next:

1. Call \`get_timetable\` with \`{ "studentId": "${studentId}" }\` to get today's class schedule.
2. Call \`get_attendance\` with \`{ "studentId": "${studentId}" }\` to get attendance status and advice.
3. Call \`get_assignments\` with \`{ "studentId": "${studentId}", "dueWithinHours": 48 }\` to get upcoming deadlines.
4. Call \`nearest_printer\` with \`{ "buildingId": "${buildingId}" }\` to get the closest working printer.

Once you have all four results, synthesise a briefing that includes:
- A warm greeting with the student's name and today's date
- Today's class schedule (first class highlighted with room + landmark)
- An attendance alert if any course is below 75% — include the exact number of classes needed to recover
- All assignments due within 48 hours, sorted by urgency (hours remaining)
- A printer location tip relevant to their first class building
- 2–3 specific, actionable recommendations for how to best use their time today (gaps between classes, what to prioritise, what to print)

Keep the tone friendly, direct, and practical. Use the tool results exactly — do not invent data.`
                    }
                },
            ],
        };
    }
}
