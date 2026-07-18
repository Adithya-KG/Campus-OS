import { ToolDecorator as Tool, Widget, ExecutionContext, z, Injectable } from '@nitrostack/core';
import { SessionContext } from '../../auth/session.context.js';
import { DocumentsService } from './documents.service.js';

@Injectable({ deps: [DocumentsService, SessionContext] })
export class DocumentsTools {
    constructor(
        private readonly documentsService: DocumentsService,
        private readonly sessionContext: SessionContext
    ) {}

    @Tool({
        name: 'list_documents',
        description: 'List all documents uploaded by a student, including syllabi, assignments, and study materials.',
        inputSchema: z.object({}),
        examples: {
            request: { studentId: 'uuid-1234' },
            response: {
                studentId: 'uuid-1234',
                documents: [
                    {
                        id: 'doc-uuid-1',
                        type: 'study_material',
                        filename: 'CS301_Notes.pdf',
                        status: 'processed',
                        uploadedAt: '2026-07-18T10:00:00Z'
                    }
                ]
            }
        }
    })
    @Widget('document-list')
    async listDocuments(input: any, ctx: ExecutionContext) {
        const studentId = this.sessionContext.getAuthenticatedStudentId();
        if (!studentId) {
            throw new Error("Please authenticate first using your email and password.");
        }
        ctx.logger.info('Listing documents', { studentId });
        const docs = await this.documentsService.listDocuments(studentId);
        return { studentId, documents: docs };
    }

    @Tool({
        name: 'get_document_content',
        description: 'Retrieve the extracted text content of a specific document (e.g. for answering questions about a syllabus).',
        inputSchema: z.object({
            documentId: z.string().describe("The unique ID of the document"),
        }),
        examples: {
            request: { studentId: 'uuid-1234', documentId: 'doc-uuid-1' },
            response: { content: "This course covers Dijkstra's algorithm..." }
        }
    })
    async getDocumentContent(input: any, ctx: ExecutionContext) {
        const studentId = this.sessionContext.getAuthenticatedStudentId();
        if (!studentId) {
            throw new Error("Please authenticate first using your email and password.");
        }
        ctx.logger.info('Fetching document content', { studentId, documentId: input.documentId });
        const content = await this.documentsService.getDocumentContent(studentId, input.documentId);
        if (!content) {
            return { error: 'Document not found or content not yet extracted.' };
        }
        return { content };
    }

    @Tool({
        name: 'update_assignment_status',
        description: 'Update the status of a specific assignment (e.g., from "Pending" to "Completed").',
        inputSchema: z.object({
            courseId: z.string().describe("The course ID (e.g., CS301)"),
            title: z.string().describe("A keyword or full title of the assignment"),
            status: z.string().describe("The new status, e.g., 'Completed', 'In Progress', 'Pending'")
        }),
        examples: {
            request: { studentId: 'uuid-1234', courseId: 'CS301', title: 'Dijkstra', status: 'Completed' },
            response: { success: true, message: 'Assignment status updated successfully.' }
        }
    })
    async updateAssignmentStatus(input: any, ctx: ExecutionContext) {
        const studentId = this.sessionContext.getAuthenticatedStudentId();
        if (!studentId) {
            throw new Error("Please authenticate first using your email and password.");
        }
        ctx.logger.info('Updating assignment status', { studentId, courseId: input.courseId, title: input.title, status: input.status });
        const success = await this.documentsService.updateAssignmentStatus(studentId, input.courseId, input.title, input.status);
        if (success) {
            return { success: true, message: 'Assignment status updated successfully.' };
        } else {
            return { success: false, message: 'Failed to update assignment. Assignment might not exist.' };
        }
    }
}
