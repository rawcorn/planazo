import { createClient } from '@supabase/supabase-js'
import path from 'path'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function registerMVP() {
  const usersToCreate = [
    { email: 'martina@test.com', password: 'password123', username: 'martina99', age: 24, gender: 'F', region: 'Palermo, CABA' },
    { email: 'lucas@test.com', password: 'password123', username: 'lucas_dev', age: 28, gender: 'M', region: 'Caballito, CABA' }
  ];

  for (const u of usersToCreate) {
    const { data, error } = await supabase.auth.signUp({
      email: u.email,
      password: u.password,
      options: {
        data: {
          username: u.username,
          age: u.age,
          gender: u.gender,
          region: u.region,
        }
      }
    });
    
    if (error) {
      console.log(`Failed to create ${u.email}:`, error.message);
    } else {
      console.log(`Created or existing: ${u.email}`);
    }
  }
}

registerMVP();
