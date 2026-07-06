import dotenv from 'dotenv';
dotenv.config();

import { supabase } from './config/supabase.js';

console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? `"${process.env.SUPABASE_URL}"` : '❌ NÃO DEFINIDA');
console.log('SUPABASE_KEY:', process.env.SUPABASE_KEY ? `definida (${process.env.SUPABASE_KEY.length} chars)` : '❌ NÃO DEFINIDA');
console.log('JWT_SECRET:', process.env.JWT_SECRET ? `definida (${process.env.JWT_SECRET.length} chars)` : '❌ NÃO DEFINIDA');

console.log('\nTestando conexão Supabase com tabela Users...');
const { data, error } = await supabase.from('Users').select('id, email').limit(2);
if (error) {
  console.log('❌ Erro Supabase:', error.message, '| Code:', error.code);
} else {
  console.log('✅ Supabase conectado! Registros encontrados:', data.length);
  if (data.length > 0) console.log('   Exemplo:', JSON.stringify(data[0]));
}

console.log('\nTestando tabela Funcionarios...');
const { data: funcs, error: errFuncs } = await supabase.from('Funcionarios').select('id, email').limit(2);
if (errFuncs) {
  console.log('❌ Erro tabela Funcionarios:', errFuncs.message);
} else {
  console.log('✅ Funcionarios OK! Registros:', funcs.length);
}

console.log('\nTestando tabela abastecimento...');
const { data: abast, error: errAbast } = await supabase.from('abastecimento').select('id, bairro, status').limit(2);
if (errAbast) {
  console.log('❌ Erro tabela abastecimento:', errAbast.message);
} else {
  console.log('✅ abastecimento OK! Registros:', abast.length);
  if (abast.length > 0) console.log('   Exemplo:', JSON.stringify(abast[0]));
}
