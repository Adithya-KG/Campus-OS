import { Injectable } from '@nitrostack/core';
import { RoomRepository } from '../../data/room.repository.js';
import { EquipmentRepository } from '../../data/equipment.repository.js';

export interface ClassroomResult {
    courseId: string;
    building: string;
    buildingName: string;
    room: string;
    floor: number;
    landmark: string;
    found: boolean;
}

export interface PrinterResult {
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
    otherWorkingPrinters: {
        id: string;
        name: string;
        walkingMinutes: number;
    }[];
    message: string;
}

@Injectable({ deps: [RoomRepository, EquipmentRepository] })
export class NavigationService {
    constructor(
        private readonly roomRepo: RoomRepository,
        private readonly equipmentRepo: EquipmentRepository,
    ) {}

    findClassroom(courseId: string): ClassroomResult {
        const room = this.roomRepo.getRoom(courseId.toUpperCase());
        if (!room) {
            return {
                courseId,
                building: '',
                buildingName: '',
                room: '',
                floor: 0,
                landmark: '',
                found: false,
            };
        }
        return { ...room, found: true };
    }

    nearestPrinter(buildingId: string): PrinterResult {
        const working = this.equipmentRepo.getWorkingPrinters();

        // Sort by walking distance — prefer same building first, then by time
        const sorted = working.slice().sort((a, b) => {
            const aIsLocal = a.building === buildingId ? 0 : 1;
            const bIsLocal = b.building === buildingId ? 0 : 1;
            if (aIsLocal !== bIsLocal) return aIsLocal - bIsLocal;
            return a.walkingMinutes - b.walkingMinutes;
        });

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
