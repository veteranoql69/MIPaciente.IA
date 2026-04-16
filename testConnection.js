const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

// Cargar variables simples desde .env.local
const envFile = fs.readFileSync('.env.local', 'utf8');
let supabaseUrl = '';
let supabaseKey = '';

envFile.split('\n').forEach(line => {
  if (line.startsWith('NEXT_PUBLIC_SUPABASE_URL=')) supabaseUrl = line.split('=')[1].trim();
  if (line.startsWith('SUPABASE_SERVICE_ROLE_KEY=')) supabaseKey = line.split('=')[1].trim();
});

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log(`Intentando conectar a: ${supabaseUrl}`);
  
  // Vamos a usar mpaci_servicios que es del modelo
  const { data, error, status } = await supabase
    .from('mpaci_servicios')
    .select('*')
    .limit(5);

  if (error) {
    console.error(`Error HTTP ${status || 'Desconocido'}:`, error.message);
  } else {
    console.log('✅ Conexión exitosa! No hubo errores de red ni de base de datos.');
    console.log('Resultados de mpaci_servicios (probablemente esté vacío aún, pero la tabla existe):');
    console.log(data);
  }
}

testConnection();
