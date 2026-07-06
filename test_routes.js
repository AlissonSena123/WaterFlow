import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
dotenv.config();

const port = process.env.PORT || 8080;
const url = `http://localhost:${port}`;

const token = jwt.sign(
  { id: 1, nome: "Admin Test", role: "admin", tipo: "funcionario" },
  process.env.JWT_SECRET,
  { expiresIn: '1h' }
);

async function testRoute(path, label) {
  console.log(`\n📌 Testando ${label} (${path})...`);
  try {
    const res = await fetch(`${url}${path}`, {
      headers: { 'Cookie': `token=${token}` }
    });
    const json = await res.json();
    console.log(`   Status HTTP: ${res.status}`);
    console.log(`   success: ${json.success}`);
    if (json.data) {
      console.log(`   Total de itens: ${json.data.length}`);
      if (json.data.length > 0) {
        console.log(`   Primeiro item (campos):`, Object.keys(json.data[0]).join(', '));
        console.log(`   Exemplo:`, JSON.stringify(json.data[0]).substring(0, 200));
      }
    } else if (json.erro) {
      console.log(`   Erro: ${json.erro}`);
    }
  } catch (err) {
    console.log(`   ERRO DE CONEXÃO: ${err.message}`);
  }
}

async function testRouteNoAuth(path, label) {
  console.log(`\n📌 Testando ${label} SEM AUTH (deve retornar 401)...`);
  try {
    const res = await fetch(`${url}${path}`);
    const json = await res.json();
    console.log(`   Status HTTP: ${res.status}`);
    console.log(`   Resposta:`, JSON.stringify(json));
  } catch (err) {
    console.log(`   ERRO: ${err.message}`);
  }
}

async function run() {
  // Testar com auth
  await testRoute('/api/usuarios', 'GET /api/usuarios');
  await testRoute('/api/usuarios?nome=test', 'GET /api/usuarios?nome=test');
  await testRoute('/api/relatorios', 'GET /api/relatorios');
  await testRoute('/api/relatorios?status=NORMAL', 'GET /api/relatorios?status=NORMAL');

  // Testar sem auth (deve bloquear)
  await testRouteNoAuth('/api/usuarios', 'GET /api/usuarios');
  await testRouteNoAuth('/api/relatorios', 'GET /api/relatorios');

  console.log('\n✅ Testes concluídos.');
}

run();
