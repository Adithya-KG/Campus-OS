import { McpApp, Module, ConfigModule, OAuthModule } from '@nitrostack/core';
import { AcademicsModule } from './modules/academics/academics.module.js';
import { NavigationModule } from './modules/navigation/navigation.module.js';
import { BriefingModule } from './modules/briefing/briefing.module.js';
import { SystemHealthCheck } from './health/system.health.js';

/**
 * Root Application Module
 *
 * CampusOS — an AI-native campus operating system.
 * Connects timetable, attendance, assignments, and navigation into
 * a single intelligent assistant powered by the Model Context Protocol.
 *
 * Modules:
 * - AcademicsModule: timetable, attendance, assignments
 * - NavigationModule: classroom finder, nearest printer
 * - BriefingModule: morning briefing aggregator (uses Academics + Navigation via DI)
 *
 * OAuth 2.1 is configured but not enforced (OAUTH_REQUIRED defaults to false).
 * No tools require authentication — designed for live hackathon demo.
 */
@McpApp({
    module: AppModule,
    server: {
        name: 'campus-os-server',
        version: '1.0.0',
    },
    logging: {
        level: 'info',
    },
})
@Module({
    name: 'app',
    description: 'CampusOS MCP server — AI-native campus operating system',
    imports: [
        ConfigModule.forRoot(),

        // OAuth 2.1 — configured but not enforced in demo mode
        OAuthModule.forRoot({
            required: process.env.OAUTH_REQUIRED === 'true',
            resourceUri: process.env.RESOURCE_URI || 'https://mcplocal',
            authorizationServers: [
                process.env.AUTH_SERVER_URL || 'https://dev-5dt0utuk31h13tjm.us.auth0.com',
            ],
            scopesSupported: ['read', 'write', 'admin'],
            tokenIntrospectionEndpoint: process.env.INTROSPECTION_ENDPOINT,
            tokenIntrospectionClientId: process.env.INTROSPECTION_CLIENT_ID,
            tokenIntrospectionClientSecret: process.env.INTROSPECTION_CLIENT_SECRET,
            audience: process.env.TOKEN_AUDIENCE,
            issuer: process.env.TOKEN_ISSUER,
            customValidation: async (_tokenPayload) => true,
        }),

        // Campus modules
        AcademicsModule,
        NavigationModule,
        BriefingModule,
    ],
    providers: [
        // Health Checks
        SystemHealthCheck,
    ],
})
export class AppModule {}
