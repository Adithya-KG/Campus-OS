import { Injectable } from '@nitrostack/core';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

@Injectable()
export class SupabaseService {
    private client: SupabaseClient;

    constructor() {
        const url = process.env.SUPABASE_URL;
        const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!url || !key) {
            throw new Error('Missing Supabase credentials in .env');
        }

        this.client = createClient(url, key, {
            auth: {
                autoRefreshToken: false,
                persistSession: false,
            }
        });
    }

    getClient(): SupabaseClient {
        return this.client;
    }

    async resolveStudentId(studentId: string): Promise<string> {
        const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (uuidRegex.test(studentId)) {
            return studentId;
        }

        const { data, error } = await this.client
            .from('students')
            .select('id')
            .eq('student_code', studentId)
            .maybeSingle();

        if (error || !data) {
            return studentId;
        }
        return data.id;
    }
}
