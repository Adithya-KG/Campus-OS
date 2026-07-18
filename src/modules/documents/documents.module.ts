import { Module } from '@nitrostack/core';
import { SupabaseService } from '../../data/supabase.service.js';
import { DocumentsService } from './documents.service.js';
import { DocumentsTools } from './documents.tools.js';
import { AuthModule } from '../auth/auth.module.js';

@Module({
    name: 'documents',
    description: 'Document management and extracted content retrieval',
    imports: [AuthModule],
    controllers: [DocumentsTools],
    providers: [SupabaseService, DocumentsService],
    exports: [DocumentsService],
})
export class DocumentsModule {}
