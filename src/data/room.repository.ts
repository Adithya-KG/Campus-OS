import { Injectable } from '@nitrostack/core';
import { DataService, Room } from './data.service.js';

/**
 * RoomRepository — typed wrapper over DataService for classroom/room data.
 */
@Injectable({ deps: [DataService] })
export class RoomRepository {
    constructor(private readonly dataService: DataService) {}

    getRoom(courseId: string): Room | undefined {
        return this.dataService.getRoom(courseId);
    }

    getAllRooms(): Room[] {
        return (this.dataService as any).rooms as Room[];
    }
}
