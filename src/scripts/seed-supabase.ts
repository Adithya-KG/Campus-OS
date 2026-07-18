import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { DataService } from '../data/data.service.js';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
    console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false,
    },
});

async function run() {
    console.log('Starting seed process...');
    const dataService = new DataService();

    // 1. Create a dummy user in Supabase Auth to represent student_001
    console.log('Creating auth user for student_001...');
    const email = 'student_001@example.com';
    const password = 'password123'; // Simple password for demo

    // Check if user exists first
    const { data: existingUsers, error: userListErr } = await supabase.auth.admin.listUsers();
    if (userListErr) {
        console.error('Error listing users:', userListErr);
        return;
    }

    let userId: string;
    const existingUser = existingUsers.users.find(u => u.email === email);

    if (existingUser) {
        console.log(`User already exists with ID: ${existingUser.id}`);
        userId = existingUser.id;
    } else {
        const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
            email,
            password,
            email_confirm: true,
        });

        if (userErr || !newUser.user) {
            console.error('Error creating user:', userErr);
            return;
        }

        userId = newUser.user.id;
        console.log(`Created new auth user with ID: ${userId}`);
    }

    // Use this real UUID for all student_001 data
    const oldStudentId = 'student_001';

    // 2. Insert Student
    console.log('Inserting student profile...');
    const studentData = dataService.getStudent(oldStudentId);
    if (studentData) {
        const { error } = await supabase.from('students').upsert({
            id: userId,
            name: studentData.name,
            email: studentData.email,
            year: studentData.year,
            program: studentData.program,
            default_building: studentData.defaultBuilding,
        });
        if (error) console.error('Error inserting student:', error);
    }

    // 3. Insert Timetable
    console.log('Inserting timetable...');
    const timetable = dataService.getTimetable(oldStudentId);
    if (timetable && timetable.length > 0) {
        // Clear existing for this student to avoid duplicates on re-run
        await supabase.from('timetable').delete().eq('student_id', userId);

        const { error } = await supabase.from('timetable').insert(
            timetable.map(t => ({
                student_id: userId,
                course_id: t.courseId,
                course_name: t.courseName,
                faculty: t.faculty,
                room: t.room,
                building: t.building,
                floor: t.floor,
                start_time: t.startTime,
                end_time: t.endTime,
                day_of_week: t.dayOfWeek,
            }))
        );
        if (error) console.error('Error inserting timetable:', error);
    }

    // 4. Insert Attendance
    console.log('Inserting attendance...');
    const attendance = dataService.getAttendance(oldStudentId);
    if (attendance && attendance.courses) {
        await supabase.from('attendance').delete().eq('student_id', userId);

        const { error } = await supabase.from('attendance').insert(
            attendance.courses.map(c => ({
                student_id: userId,
                course_id: c.courseId,
                course_name: c.courseName,
                attended: c.attended,
                total: c.total,
                percentage: c.percentage,
            }))
        );
        if (error) console.error('Error inserting attendance:', error);
    }

    // 5. Insert Assignments
    console.log('Inserting assignments...');
    const assignments = dataService.getAssignments(oldStudentId);
    if (assignments && assignments.length > 0) {
        await supabase.from('assignments').delete().eq('student_id', userId);

        const { error } = await supabase.from('assignments').insert(
            assignments.map(a => ({
                student_id: userId,
                course_id: a.courseId,
                course_name: a.courseName,
                title: a.title,
                description: a.description,
                due_date: a.dueDate,
                due_time: a.dueTime,
                status: a.status,
                weight: a.weight,
            }))
        );
        if (error) console.error('Error inserting assignments:', error);
    }

    // 6. Insert Rooms
    console.log('Inserting rooms...');
    // For global data, we'll just upsert by building/room, but room id is uuid, 
    // let's clear all first since it's a seed script, or just insert if empty.
    const { data: existingRooms } = await supabase.from('rooms').select('id').limit(1);
    if (!existingRooms || existingRooms.length === 0) {
        const rooms = dataService.getRoom('CS301'); // We know dataService only has limited rooms.
        // Actually DataService doesn't expose getAllRooms easily. I'll read the json directly.
        // But getRoom('CS301') returns a Room. 
        // Wait, dataService constructor reads all. Let's just use the require from the script.
    }
}

// Better yet, I'll read the JSON files directly for global data since DataService doesn't expose getAll methods.
import { createRequire } from 'module';
import * as path from 'path';

const require = createRequire(import.meta.url);

async function runSeed() {
    console.log('Starting seed process...');
    const dir = path.join(process.cwd(), 'src', 'data');

    const students = require(path.join(dir, 'students.json'));
    const timetable = require(path.join(dir, 'timetable.json'));
    const attendance = require(path.join(dir, 'attendance.json'));
    const assignmentsRaw = require(path.join(dir, 'assignments.json'));
    const rooms = require(path.join(dir, 'rooms.json'));
    const printers = require(path.join(dir, 'printers.json'));

    // Resolve dates
    const today = new Date();
    const resolve = (placeholder: string): string => {
        const match = placeholder.match(/^__IN_(\d+)_DAYS__$/);
        if (match) {
            const d = new Date(today);
            d.setDate(d.getDate() + parseInt(match[1], 10));
            return d.toISOString().split('T')[0];
        }
        if (placeholder === '__TOMORROW__') {
            const d = new Date(today);
            d.setDate(d.getDate() + 1);
            return d.toISOString().split('T')[0];
        }
        return placeholder;
    };
    const assignments = assignmentsRaw.map((a: any) => ({ ...a, dueDate: resolve(a.dueDate) }));

    const email = 'student_001@example.com';
    const password = 'password123';

    const { data: existingUsers } = await supabase.auth.admin.listUsers();
    let userId: string;
    const existingUser = existingUsers?.users?.find(u => u.email === email);

    if (existingUser) {
        userId = existingUser.id;
        console.log(`User exists: ${userId}`);
    } else {
        const { data: newUser, error: userErr } = await supabase.auth.admin.createUser({
            email, password, email_confirm: true
        });
        if (userErr || !newUser.user) {
            console.error('User creation failed', userErr);
            return;
        }
        userId = newUser.user.id;
        console.log(`User created: ${userId}`);
    }

    const s = students.find((x: any) => x.id === 'student_001');
    if (s) {
        const { error } = await supabase.from('students').upsert({
            id: userId, name: s.name, email: s.email, year: s.year, program: s.program, default_building: s.defaultBuilding, student_code: s.id
        });
        if (error) console.error('Error seeding student:', error.message);
    }

    const t = timetable['student_001'];
    if (t) {
        await supabase.from('timetable').delete().eq('student_id', userId);
        const { error } = await supabase.from('timetable').insert(t.map((x: any) => ({
            student_id: userId, course_id: x.courseId, course_name: x.courseName, faculty: x.faculty,
            room: x.room, building: x.building, floor: x.floor, start_time: x.startTime, end_time: x.endTime, day_of_week: x.dayOfWeek
        })));
        if (error) console.error('Error seeding timetable:', error.message);
    }

    const a = attendance['student_001'];
    if (a && a.courses) {
        await supabase.from('attendance').delete().eq('student_id', userId);
        const { error } = await supabase.from('attendance').insert(a.courses.map((x: any) => ({
            student_id: userId, course_id: x.courseId, course_name: x.courseName,
            attended: x.attended, total: x.total, percentage: x.percentage
        })));
        if (error) console.error('Error seeding attendance:', error.message);
    }

    const asg = assignments.filter((x: any) => x.studentId === 'student_001');
    if (asg) {
        await supabase.from('assignments').delete().eq('student_id', userId);
        const { error } = await supabase.from('assignments').insert(asg.map((x: any) => ({
            student_id: userId, course_id: x.courseId, course_name: x.courseName,
            title: x.title, description: x.description, due_date: x.dueDate, due_time: x.dueTime,
            status: x.status, weight: x.weight
        })));
        if (error) console.error('Error seeding assignments:', error.message);
    }

    await supabase.from('rooms').delete().neq('id', '00000000-0000-0000-0000-000000000000'); // Delete all
    const { error: roomErr } = await supabase.from('rooms').insert(rooms.map((x: any) => ({
        course_id: x.courseId, building: x.building, building_name: x.buildingName,
        room: x.room, floor: x.floor, landmark: x.landmark
    })));
    if (roomErr) console.error('Error seeding rooms:', roomErr.message);

    await supabase.from('equipment').delete().neq('id', 'dummy'); // Delete all
    const { error: equipErr } = await supabase.from('equipment').insert(printers.map((x: any) => ({
        id: x.id, name: x.name, building: x.building, floor: x.floor, room: x.room,
        is_working: x.isWorking, walking_minutes: x.walkingMinutes, supports_color: x.supportsColor,
        supports_a3: x.supportsA3, note: x.note
    })));
    if (equipErr) console.error('Error seeding equipment:', equipErr.message);

    console.log('Seed completed successfully!');
    console.log(`\n\nIMPORTANT: The new student ID (UUID) is: ${userId}\n\n`);
}

runSeed().catch(console.error);
