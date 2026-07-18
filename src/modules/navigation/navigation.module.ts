import { Module } from '@nitrostack/core';
import { SupabaseService } from '../../data/supabase.service.js';
import { RoomRepository } from '../../data/room.repository.js';
import { EquipmentRepository } from '../../data/equipment.repository.js';
import { NavigationService } from './navigation.service.js';
import { NavigationTools } from './navigation.tools.js';
import { NavigationResources } from './navigation.resources.js';

@Module({
    name: 'navigation',
    description: 'Campus navigation — classroom locations and nearest printer finder',
    controllers: [NavigationTools, NavigationResources],
    providers: [SupabaseService, RoomRepository, EquipmentRepository, NavigationService],
    exports: [NavigationService, RoomRepository, EquipmentRepository],
})
export class NavigationModule {}
