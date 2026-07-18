import { Injectable } from '@nitrostack/core';
import { DataService, Printer } from './data.service.js';

/**
 * EquipmentRepository — typed wrapper over DataService for printer/equipment data.
 */
@Injectable({ deps: [DataService] })
export class EquipmentRepository {
    constructor(private readonly dataService: DataService) {}

    getAllPrinters(): Printer[] {
        return this.dataService.getPrinters();
    }

    getWorkingPrinters(): Printer[] {
        return this.dataService.getPrinters().filter(p => p.isWorking);
    }

    getPrintersByBuilding(buildingId: string): Printer[] {
        return this.dataService.getPrintersByBuilding(buildingId);
    }
}
