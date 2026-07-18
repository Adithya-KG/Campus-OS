import { ToolDecorator as Tool, ExecutionContext, z, Injectable } from '@nitrostack/core';
import { NavigationService } from './navigation.service.js';

// Note: Using explicit deps for ESM compatibility
@Injectable({ deps: [NavigationService] })
export class NavigationTools {
    constructor(private readonly navigationService: NavigationService) {}

    // ─── find_classroom ──────────────────────────────────────────────────────

    @Tool({
        name: 'find_classroom',
        description: 'Find the exact location of a classroom for a given course. Returns building name, room number, and floor.',
        inputSchema: z.object({
            courseId: z.string().describe('The course ID to look up (e.g. "CS301")'),
        }),
        examples: {
            request: { courseId: 'CS301' },
            response: {
                courseId: 'CS301',
                building: 'block_a',
                buildingName: 'Block A — Sciences & Computing',
                room: 'A-204',
                floor: 2,
                landmark: 'Near the staircase on the south end',
                found: true,
            },
        },
    })
    async findClassroom(input: any, ctx: ExecutionContext) {
        ctx.logger.info('Finding classroom', { courseId: input.courseId });
        return this.navigationService.findClassroom(input.courseId);
    }

    // ─── nearest_printer ─────────────────────────────────────────────────────

    @Tool({
        name: 'nearest_printer',
        description: 'Find the nearest working printer to a given campus building. Returns the printer location, walking time estimate, and whether it supports colour or A3 printing.',
        inputSchema: z.object({
            buildingId: z.string().describe('Building identifier to search near (e.g. "block_a", "block_b", "library")'),
        }),
        examples: {
            request: { buildingId: 'block_a' },
            response: {
                buildingId: 'block_a',
                found: true,
                printer: {
                    id: 'printer_block_a_1',
                    name: 'Block A — 2F Print Station',
                    room: 'A-210',
                    floor: 2,
                    walkingMinutes: 2,
                    supportsColor: true,
                    supportsA3: false,
                },
                otherWorkingPrinters: [
                    { id: 'printer_library_1', name: 'Library — 1F Print Centre', walkingMinutes: 3 },
                ],
                message: 'Nearest working printer is Block A — 2F Print Station (right around the corner).',
            },
        },
    })
    async nearestPrinter(input: any, ctx: ExecutionContext) {
        ctx.logger.info('Finding nearest printer', { buildingId: input.buildingId });
        return this.navigationService.nearestPrinter(input.buildingId);
    }
}
