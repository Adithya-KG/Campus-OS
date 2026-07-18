import { ToolDecorator as Tool, ExecutionContext, z, Injectable } from '@nitrostack/core';
import { AuthService } from './auth.service.js';

@Injectable({ deps: [AuthService] })
export class AuthTools {
    constructor(private readonly authService: AuthService) {}

    @Tool({
        name: 'authenticate_student',
        description: 'Authenticates a student using their email and password, establishing a session for all student-scoped operations.',
        inputSchema: z.object({
            email: z.string().email().describe("The student's login email (e.g. \"student_001@example.com\")"),
            password: z.string().describe("The student's password"),
        }),
        examples: {
            request: { email: 'student_001@example.com', password: 'password123' },
            response: 'Authenticated as Arjun Mehta.',
        },
    })
    async authenticateStudent(input: any, ctx: ExecutionContext) {
        ctx.logger.info('Authenticating student', { email: input.email });
        try {
            const result = await this.authService.authenticate(input.email, input.password);
            return result;
        } catch (err: any) {
            ctx.logger.error('Authentication failed', { email: input.email, error: err.message });
            return `Error: ${err.message}`;
        }
    }
}
