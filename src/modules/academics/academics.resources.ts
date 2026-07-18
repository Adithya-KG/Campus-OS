import { ResourceDecorator as Resource, ExecutionContext, Injectable } from '@nitrostack/core';
import { StudentRepository } from '../../data/student.repository.js';

/**
 * AcademicsResources — exposes student data as MCP Resources.
 * Resources are distinct from Tools: they are directly readable data URIs
 * that an AI client can inspect without invoking a Tool.
 */
@Injectable({ deps: [StudentRepository] })
export class AcademicsResources {
    constructor(private readonly studentRepo: StudentRepository) {}

    // ─── campus://students ────────────────────────────────────────────────────

    @Resource({
        uri: 'campus://students',
        name: 'Student Database',
        description:
            'Full list of all registered students including ID, name, program, year, email, and default building. Use this to discover valid studentId values before calling academic tools.',
        mimeType: 'application/json',
    })
    async getAllStudents(ctx: ExecutionContext) {
        ctx.logger.info('Resource: campus://students requested');
        const students = await this.studentRepo.getAllStudents();
        return {
            total: students.length,
            students,
        };
    }

    // ─── campus://students/{studentId} ────────────────────────────────────────

    @Resource({
        uri: 'campus://students/{studentId}',
        name: 'Student Profile',
        description:
            'Profile for a specific student by ID. Returns name, program, year, email, and default building.',
        mimeType: 'application/json',
    })
    async getStudentProfile(ctx: ExecutionContext) {
        const studentId = (ctx as any).params?.studentId as string | undefined;
        if (!studentId) {
            return { error: 'Missing studentId in URI', usage: 'campus://students/{studentId}' };
        }
        ctx.logger.info('Resource: campus://students/{studentId}', { studentId });
        const student = await this.studentRepo.getStudent(studentId);
        if (!student) {
            return { error: `Student '${studentId}' not found`, validIds: (await this.studentRepo.getAllStudents()).map(s => s.id) };
        }
        return student;
    }
}
