#!/usr/bin/env node
/**
 * CampusOS MCP Server
 *
 * AI-native campus operating system — connects timetable, attendance,
 * assignments, and navigation into a single intelligent assistant.
 *
 * OAuth 2.1 is configured but not enforced by default (demo mode).
 * Set OAUTH_REQUIRED=true in .env to enforce authentication.
 *
 * Transport Configuration:
 * - Development (NODE_ENV=development): STDIO only
 * - Production (NODE_ENV=production): Dual transport (STDIO + HTTP SSE)
 */

import 'dotenv/config';
import { McpApplicationFactory } from '@nitrostack/core';
import { AppModule } from './app.module.js';

/**
 * Bootstrap the application
 */
async function bootstrap() {
  try {
    console.error('🎓 Starting CampusOS MCP Server...\n');

    // Validate required environment variables for OAuth, set defaults if missing
    if (!process.env.RESOURCE_URI || !process.env.AUTH_SERVER_URL) {
      console.error('⚠️  Warning: Missing RESOURCE_URI or AUTH_SERVER_URL environment variables.');
      console.error('   Defaulting to local test endpoints. Copy .env.example to .env to configure.\n');
      process.env.RESOURCE_URI = process.env.RESOURCE_URI || 'http://localhost:3000';
      process.env.AUTH_SERVER_URL = process.env.AUTH_SERVER_URL || 'http://localhost:8080/auth';
    }

    // Create the MCP application
    const server = await McpApplicationFactory.create(AppModule);

    const authEnforced = process.env.OAUTH_REQUIRED === 'true';
    console.error('✅ CampusOS modules loaded: Academics, Navigation, Briefing');
    console.error(`   OAuth enforcement: ${authEnforced ? 'ON' : 'OFF (demo mode)'}`);

    // Start the server
    await server.start();

  } catch (error) {
    console.error('❌ Failed to start server:', error);
    console.error('\n💡 Check your .env configuration\n');
    process.exit(1);
  }
}

// Start the application
bootstrap();
