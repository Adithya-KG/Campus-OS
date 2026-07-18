import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const tables = ['students', 'timetable', 'attendance', 'assignments', 'rooms', 'equipment', 'documents'];
for (const table of tables) {
  const { data, error } = await supabase.from(table).select('*').limit(1);
  console.log(`Table: ${table}`);
  console.log(`- Data:`, data);
  console.log(`- Error:`, error?.message || 'None');
}
