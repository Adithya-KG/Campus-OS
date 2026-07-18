import { Module } from '@nitrostack/core';
import { SupabaseService } from '../../data/supabase.service.js';
import { SessionContext } from '../../auth/session.context.js';
import { AuthService } from './auth.service.js';
import { AuthTools } from './auth.tools.js';

@Module({
    name: 'auth',
    description: 'Student session authentication module',
    controllers: [AuthTools],
    providers: [SupabaseService, SessionContext, AuthService],
    exports: [AuthService, SessionContext],
})
export class AuthModule {}
