import { Injectable } from '@nitrostack/core';
import { SupabaseService } from '../../data/supabase.service.js';

export interface DocumentRecord {
    id: string;
    studentId: string;
    type: 'syllabus' | 'assignment' | 'study_material';
    filename: string;
    storagePath: string;
    extractedText: string | null;
    status: string;
    uploadedAt: string;
}

@Injectable({ deps: [SupabaseService] })
export class DocumentsService {
    constructor(private readonly supabaseService: SupabaseService) {}

    async listDocuments(studentId: string): Promise<DocumentRecord[]> {
        const resolvedId = await this.supabaseService.resolveStudentId(studentId);
        const { data, error } = await this.supabaseService.getClient()
            .from('documents')
            .select('*')
            .eq('student_id', resolvedId)
            .order('uploaded_at', { ascending: false });

        if (error || !data) {
            return [];
        }

        return data.map(d => ({
            id: d.id,
            studentId: d.student_id,
            type: d.type,
            filename: d.filename,
            storagePath: d.storage_path,
            extractedText: null, // Don't return full text in list for performance
            status: d.status,
            uploadedAt: d.uploaded_at,
        }));
    }

    async getDocumentContent(studentId: string, documentId: string): Promise<string | null> {
        const resolvedId = await this.supabaseService.resolveStudentId(studentId);
        const { data, error } = await this.supabaseService.getClient()
            .from('documents')
            .select('extracted_text')
            .eq('id', documentId)
            .eq('student_id', resolvedId)
            .single();

        if (error || !data) return null;
        return data.extracted_text;
    }

    async updateAssignmentStatus(studentId: string, courseId: string, title: string, status: string): Promise<boolean> {
        const resolvedId = await this.supabaseService.resolveStudentId(studentId);
        // Need to find the exact assignment and update its status
        const { data, error: findError } = await this.supabaseService.getClient()
            .from('assignments')
            .select('id')
            .eq('student_id', resolvedId)
            .eq('course_id', courseId)
            .ilike('title', `%${title}%`)
            .single();

        if (findError || !data) return false;

        const { error: updateError } = await this.supabaseService.getClient()
            .from('assignments')
            .update({ status })
            .eq('id', data.id)
            .eq('student_id', resolvedId);

        return !updateError;
    }
}
