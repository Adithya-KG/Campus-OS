import { Injectable } from '@nitrostack/core';
import { SupabaseService } from './supabase.service.js';
import { Student, TimetableEntry, AttendanceRecord, Assignment, AttendanceCourse } from './data.service.js';

@Injectable({ deps: [SupabaseService] })
export class StudentRepository {
    constructor(private readonly supabaseService: SupabaseService) {}

    async getStudent(studentId: string): Promise<Student | undefined> {
        const resolvedId = await this.supabaseService.resolveStudentId(studentId);
        const { data, error } = await this.supabaseService.getClient()
            .from('students')
            .select('*')
            .eq('id', resolvedId)
            .single();

        if (error || !data) return undefined;
        return {
            id: data.id,
            name: data.name,
            email: data.email,
            year: data.year,
            program: data.program,
            defaultBuilding: data.default_building,
        };
    }

    async getAllStudents(): Promise<Student[]> {
        const { data, error } = await this.supabaseService.getClient()
            .from('students')
            .select('*');

        if (error || !data) return [];
        return data.map(d => ({
            id: d.id,
            name: d.name,
            email: d.email,
            year: d.year,
            program: d.program,
            defaultBuilding: d.default_building,
        }));
    }

    async getTimetable(studentId: string): Promise<TimetableEntry[]> {
        const resolvedId = await this.supabaseService.resolveStudentId(studentId);
        const { data, error } = await this.supabaseService.getClient()
            .from('timetable')
            .select('*')
            .eq('student_id', resolvedId);

        if (error || !data) return [];
        return data.map(d => ({
            courseId: d.course_id,
            courseName: d.course_name,
            faculty: d.faculty,
            room: d.room,
            building: d.building,
            floor: d.floor,
            startTime: d.start_time,
            endTime: d.end_time,
            dayOfWeek: d.day_of_week,
        }));
    }

    async getAttendance(studentId: string): Promise<AttendanceRecord | undefined> {
        const resolvedId = await this.supabaseService.resolveStudentId(studentId);
        const { data, error } = await this.supabaseService.getClient()
            .from('attendance')
            .select('*')
            .eq('student_id', resolvedId);

        if (error || !data || data.length === 0) return undefined;
        
        const courses: AttendanceCourse[] = data.map(d => ({
            courseId: d.course_id,
            courseName: d.course_name,
            attended: d.attended,
            total: d.total,
            percentage: Number(d.percentage),
        }));

        const totalAttended = courses.reduce((sum, c) => sum + c.attended, 0);
        const totalClasses = courses.reduce((sum, c) => sum + c.total, 0);
        const overall = totalClasses > 0 ? Math.round((totalAttended / totalClasses) * 100) : 0;

        return {
            overall,
            courses,
        };
    }

    async getAssignments(studentId: string): Promise<Assignment[]> {
        const resolvedId = await this.supabaseService.resolveStudentId(studentId);
        const { data, error } = await this.supabaseService.getClient()
            .from('assignments')
            .select('*')
            .eq('student_id', resolvedId);

        if (error || !data) return [];
        return data.map(d => ({
            id: d.id,
            studentId: d.student_id,
            courseId: d.course_id,
            courseName: d.course_name,
            title: d.title,
            description: d.description,
            dueDate: d.due_date,
            dueTime: d.due_time,
            status: d.status,
            weight: d.weight,
        }));
    }
}
