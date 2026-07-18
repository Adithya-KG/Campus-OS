import { Module } from '@nitrostack/core';
import { SupabaseService } from '../../data/supabase.service.js';
import { StudentRepository } from '../../data/student.repository.js';
import { AcademicsService } from './academics.service.js';
import { AcademicsTools } from './academics.tools.js';
import { AcademicsResources } from './academics.resources.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    name: 'academics',
    description: 'Campus academic data — timetable, attendance, and assignments',
    imports: [AuthModule],
    controllers: [AcademicsTools, AcademicsResources],
    providers: [SupabaseService, StudentRepository, AcademicsService],
    exports: [AcademicsService, StudentRepository],
})
export class AcademicsModule {}
