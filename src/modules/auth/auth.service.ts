import { Injectable } from '@nitrostack/core';
import { SupabaseService } from '../../data/supabase.service.js';
import { SessionContext } from '../../auth/session.context.js';

@Injectable({ deps: [SupabaseService, SessionContext] })
export class AuthService {
    constructor(
        private readonly supabaseService: SupabaseService,
        private readonly sessionContext: SessionContext
    ) {}

    async authenticate(email: string, password: string): Promise<string> {
        const { data, error } = await this.supabaseService.getClient().auth.signInWithPassword({
            email,
            password,
        });

        if (error || !data.user) {
            this.sessionContext.setAuthenticatedStudentId(null);
            throw new Error(error?.message || 'Authentication failed');
        }

        const userId = data.user.id;

        // Look up the students table row matching this auth user's id to get their name
        const { data: student, error: dbError } = await this.supabaseService.getClient()
            .from('students')
            .select('name')
            .eq('id', userId)
            .single();

        if (dbError || !student) {
            this.sessionContext.setAuthenticatedStudentId(null);
            throw new Error('Authenticated, but student profile not found in database.');
        }

        this.sessionContext.setAuthenticatedStudentId(userId);
        return `Authenticated as ${student.name}.`;
    }
}
