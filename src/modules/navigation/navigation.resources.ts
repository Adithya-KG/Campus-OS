import { ResourceDecorator as Resource, ExecutionContext, Injectable } from '@nitrostack/core';
import { RoomRepository } from '../../data/room.repository.js';
import { EquipmentRepository } from '../../data/equipment.repository.js';

/**
 * NavigationResources — exposes campus map and equipment data as MCP Resources.
 */
@Injectable({ deps: [RoomRepository, EquipmentRepository] })
export class NavigationResources {
    constructor(
        private readonly roomRepo: RoomRepository,
        private readonly equipmentRepo: EquipmentRepository,
    ) {}

    // ─── campus://rooms ───────────────────────────────────────────────────────

    @Resource({
        uri: 'campus://rooms',
        name: 'Room Database',
        description:
            'All classroom locations on campus: building name, room number, floor, and a human-readable landmark. Cross-reference with courseId from the timetable to navigate to a class.',
        mimeType: 'application/json',
    })
    async getAllRooms(ctx: ExecutionContext) {
        ctx.logger.info('Resource: campus://rooms requested');
        const rooms = await this.roomRepo.getAllRooms();
        return {
            total: rooms.length,
            rooms,
        };
    }

    // ─── campus://equipment ───────────────────────────────────────────────────

    @Resource({
        uri: 'campus://equipment',
        name: 'Equipment Database',
        description:
            'All campus printers and print stations: location, working status, walking time estimate, colour and A3 support. Use this to find any printer or to understand campus-wide equipment availability.',
        mimeType: 'application/json',
    })
    async getAllEquipment(ctx: ExecutionContext) {
        ctx.logger.info('Resource: campus://equipment requested');
        const all = await this.equipmentRepo.getAllPrinters();
        const working = await this.equipmentRepo.getWorkingPrinters();
        return {
            total: all.length,
            working: working.length,
            outOfService: all.length - working.length,
            equipment: all,
        };
    }
}
