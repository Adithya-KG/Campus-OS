import { Injectable } from '@nitrostack/core';
import { SupabaseService } from './supabase.service.js';
import { Room } from './data.service.js';

@Injectable({ deps: [SupabaseService] })
export class RoomRepository {
    constructor(private readonly supabaseService: SupabaseService) {}

    async getRoom(courseId: string): Promise<Room | undefined> {
        const { data, error } = await this.supabaseService.getClient()
            .from('rooms')
            .select('*')
            .eq('course_id', courseId)
            .limit(1)
            .single();

        if (error || !data) return undefined;
        return {
            courseId: data.course_id,
            building: data.building,
            buildingName: data.building_name,
            room: data.room,
            floor: data.floor,
            landmark: data.landmark,
        };
    }

    async getAllRooms(): Promise<Room[]> {
        const { data, error } = await this.supabaseService.getClient()
            .from('rooms')
            .select('*');

        if (error || !data) return [];
        return data.map(d => ({
            courseId: d.course_id,
            building: d.building,
            buildingName: d.building_name,
            room: d.room,
            floor: d.floor,
            landmark: d.landmark,
        }));
    }
}
