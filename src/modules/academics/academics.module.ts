import { Module } from '@nitrostack/core';
import { DataService } from '../../data/data.service.js';
import { StudentRepository } from '../../data/student.repository.js';
import { AcademicsService } from './academics.service.js';
import { AcademicsTools } from './academics.tools.js';
import { AcademicsResources } from './academics.resources.js';

@Module({
    name: 'academics',
    description: 'Campus academic data — timetable, attendance, and assignments',
    controllers: [AcademicsTools, AcademicsResources],
    providers: [DataService, StudentRepository, AcademicsService],
    exports: [AcademicsService, StudentRepository],
})
export class AcademicsModule {}
