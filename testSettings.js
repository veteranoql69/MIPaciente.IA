const fs = require('fs');

// Cargar variables simples desde .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let anonKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_ANON_KEY=')) anonKey = line.split('=')[1].trim();
});

async function getSettings() {
  try {
    const res = await fetch(`${supabaseUrl}/auth/v1/settings`, {
      headers: {
        'apikey': anonKey
      }
    });
    const data = await res.json();
    console.log("Proveedores externos reconocidos por Supabase en este momento:");
    console.log(JSON.stringify(data.external, null, 2));
  } catch (err) {
    console.error("Error consultando settings:", err);
  }
}

getSettings();
