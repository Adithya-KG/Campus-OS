import { Injectable } from '@nitrostack/core';

@Injectable()
export class SessionContext {
    private authenticatedStudentId: string | null = null;

    getAuthenticatedStudentId(): string | null {
        return this.authenticatedStudentId;
    }

    setAuthenticatedStudentId(id: string | null): void {
        this.authenticatedStudentId = id;
    }
}
