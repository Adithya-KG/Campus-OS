import { Injectable } from '@nitrostack/core';
import { SupabaseService } from './supabase.service.js';
import { Printer } from './data.service.js';

@Injectable({ deps: [SupabaseService] })
export class EquipmentRepository {
    constructor(private readonly supabaseService: SupabaseService) {}

    async getAllPrinters(): Promise<Printer[]> {
        const { data, error } = await this.supabaseService.getClient()
            .from('equipment')
            .select('*');

        if (error || !data) return [];
        return data.map(d => ({
            id: d.id,
            name: d.name,
            building: d.building,
            floor: d.floor,
            room: d.room,
            isWorking: d.is_working,
            walkingMinutes: d.walking_minutes,
            supportsColor: d.supports_color,
            supportsA3: d.supports_a3,
            note: d.note,
        }));
    }

    async getWorkingPrinters(): Promise<Printer[]> {
        const printers = await this.getAllPrinters();
        return printers.filter(p => p.isWorking);
    }

    async getPrintersByBuilding(buildingId: string): Promise<Printer[]> {
        const printers = await this.getAllPrinters();
        return printers.filter(p => p.building === buildingId);
    }
}
