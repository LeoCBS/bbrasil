import { readFileSync, writeFileSync } from "node:fs";

const source = process.argv[2];
const sqlTarget = process.argv[3];

if (!source || !sqlTarget) {
  throw new Error("Uso: node scripts/generate-ceps-import.mjs <entrada.csv> <saida.sql>");
}

function parseCsv(text, delimiter) {
  const rows = [];
  let row = [];
  let value = "";
  let quoted = false;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      value += '"';
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      row.push(value);
      value = "";
    } else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") index += 1;
      row.push(value);
      if (row.some((cell) => cell.length > 0)) rows.push(row);
      row = [];
      value = "";
    } else {
      value += char;
    }
  }

  row.push(value);
  if (row.some((cell) => cell.length > 0)) rows.push(row);

  return rows;
}

function normalizeHeader(header) {
  return header
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const COLUMN_ALIASES = {
  cep: ["cep"],
  logradouro: ["logradouro", "endereco", " rua", "tipo_logradouro"],
  complemento: ["complemento", "compl"],
  bairro: ["bairro"],
  cidade: ["cidade", "localidade", "municipio", "nome_municipio"],
  uf: ["uf", "estado", "sigla_uf"],
  ibge: ["ibge", "codigo_ibge", "cod_municipio", "codigo_municipio", "id_municipio"],
  ddd: ["ddd"]
};

function findColumn(headers, aliases) {
  return headers.findIndex((header) => aliases.includes(normalizeHeader(header)));
}

function quoteSql(value) {
  return `'${String(value ?? "").replace(/'/g, "''")}'`;
}

function onlyDigits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

const text = readFileSync(source, "utf8").replace(/^﻿/, "");
const firstLine = text.slice(0, text.indexOf("\n") === -1 ? text.length : text.indexOf("\n"));
const delimiter = (firstLine.match(/;/g) ?? []).length > (firstLine.match(/,/g) ?? []).length ? ";" : ",";
const rows = parseCsv(text, delimiter);

if (rows.length < 2) {
  throw new Error("CSV vazio ou sem linhas de dados.");
}

const headers = rows[0];
const columns = Object.fromEntries(
  Object.entries(COLUMN_ALIASES).map(([key, aliases]) => [key, findColumn(headers, aliases)])
);

if (columns.cep === -1 || columns.cidade === -1 || columns.uf === -1) {
  throw new Error(`Não foi possível identificar as colunas no cabeçalho: ${headers.join(delimiter)}`);
}

const cell = (row, index) => (index === -1 ? "" : String(row[index] ?? "").trim());

const seen = new Set();
const values = [];

for (const row of rows.slice(1)) {
  const digits = onlyDigits(cell(row, columns.cep)).padStart(8, "0");
  if (digits.length !== 8 || seen.has(digits)) continue;
  seen.add(digits);

  values.push(
    `  (${quoteSql(digits)}, ${quoteSql(cell(row, columns.logradouro))}, ${quoteSql(cell(row, columns.complemento))}, ${quoteSql(cell(row, columns.bairro))}, ${quoteSql(cell(row, columns.cidade))}, ${quoteSql(cell(row, columns.uf).toUpperCase())}, ${quoteSql(onlyDigits(cell(row, columns.ibge)))}, ${quoteSql(onlyDigits(cell(row, columns.ddd)))})`
  );
}

if (values.length === 0) {
  throw new Error("Nenhum CEP válido encontrado no CSV.");
}

const BATCH = 500;
const batches = [];
for (let index = 0; index < values.length; index += BATCH) {
  batches.push(values.slice(index, index + BATCH).join(",\n"));
}

const sql = `-- Gerado por scripts/generate-ceps-import.mjs a partir de ${source}.
-- Executar depois da migration 20261123000000_create_ceps.sql.

${batches
  .map(
    (batch) => `insert into public.ceps (cep, logradouro, complemento, bairro, cidade, uf, ibge, ddd)\nvalues\n${batch}\non conflict (cep) do update set\n  logradouro = excluded.logradouro,\n  complemento = excluded.complemento,\n  bairro = excluded.bairro,\n  cidade = excluded.cidade,\n  uf = excluded.uf,\n  ibge = excluded.ibge,\n  ddd = excluded.ddd;`
  )
  .join("\n\n")}
`;

writeFileSync(sqlTarget, sql);
console.log(`Gerados ${values.length} CEPS em ${sqlTarget}.`);
