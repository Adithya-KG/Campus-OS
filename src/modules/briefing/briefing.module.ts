import { Module } from '@nitrostack/core';
import { AcademicsModule } from '../academics/academics.module.js';
import { NavigationModule } from '../navigation/navigation.module.js';
import { AuthModule } from '../auth/auth.module.js';
import { BriefingTools } from './briefing.tools.js';
import { BriefingPrompts } from './briefing.prompts.js';

@Module({
    name: 'briefing',
    description: 'Morning briefing — aggregates academics and navigation into a single smart summary, plus daily optimisation and reasoning prompts',
    imports: [AcademicsModule, NavigationModule, AuthModule],
    controllers: [BriefingTools, BriefingPrompts],
    providers: [BriefingPrompts],
})
export class BriefingModule {}
