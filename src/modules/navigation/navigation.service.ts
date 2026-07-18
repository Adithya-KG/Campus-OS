import { Injectable } from '@nitrostack/core';
import { Printer, Room } from '../../data/data.service.js';
import { RoomRepository } from '../../data/room.repository.js';
import { EquipmentRepository } from '../../data/equipment.repository.js';

// ─── Return Types ─────────────────────────────────────────────────────────────

export interface ClassroomLocationResult {
    courseId: string;
    found: boolean;
    building?: string;
    buildingName?: string;
    room?: string;
    floor?: number;
    landmark?: string;
    message?: string;
}

export interface NearestPrinterResult {
    buildingId: string;
    found: boolean;
    printer?: {
        id: string;
        name: string;
        room: string;
        floor: number;
        walkingMinutes: number;
        supportsColor: boolean;
        supportsA3: boolean;
        note?: string;
    };
    otherWorkingPrinters: { id: string; name: string; walkingMinutes: number }[];
    message: string;
}

// ─── Service ──────────────────────────────────────────────────────────────────

@Injectable({ deps: [RoomRepository, EquipmentRepository] })
export class NavigationService {
    constructor(
        private readonly roomRepo: RoomRepository,
        private readonly equipmentRepo: EquipmentRepository,
    ) {}

    async findClassroom(courseId: string): Promise<ClassroomLocationResult> {
        const room = await this.roomRepo.getRoom(courseId);

        if (!room) {
            return {
                courseId,
                found: false,
                message: `Location not found for course ${courseId}.`,
            };
        }

        return {
            courseId,
            found: true,
            building: room.building,
            buildingName: room.buildingName,
            room: room.room,
            floor: room.floor,
            landmark: room.landmark,
        };
    }

    async nearestPrinter(buildingId: string): Promise<NearestPrinterResult> {
        // Find all working printers in this building
        const allPrinters = await this.equipmentRepo.getPrintersByBuilding(buildingId);
        const working = allPrinters.filter(p => p.isWorking);

        // Sort by walking distance (slice to avoid mutating repo array)
        const sorted = working.slice().sort((a, b) => a.walkingMinutes - b.walkingMinutes);

        if (sorted.length === 0) {
            return {
                buildingId,
                found: false,
                otherWorkingPrinters: [],
                message: 'No working printers found on campus. Please contact IT support.',
            };
        }

        const nearest = sorted[0];
        const others = sorted.slice(1).map(p => ({
            id: p.id,
            name: p.name,
            walkingMinutes: p.walkingMinutes,
        }));

        const walkDesc =
            nearest.walkingMinutes <= 2 ? 'right around the corner' : `about ${nearest.walkingMinutes} min walk`;

        return {
            buildingId,
            found: true,
            printer: {
                id: nearest.id,
                name: nearest.name,
                room: nearest.room,
                floor: nearest.floor,
                walkingMinutes: nearest.walkingMinutes,
                supportsColor: nearest.supportsColor,
                supportsA3: nearest.supportsA3,
                note: nearest.note,
            },
            otherWorkingPrinters: others,
            message: `Nearest working printer is ${nearest.name} (${walkDesc}).`,
        };
    }
}
