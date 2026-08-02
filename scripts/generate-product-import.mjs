import { readFileSync, writeFileSync } from "node:fs";

const source = process.argv[2];
const sqlTarget = process.argv[3];
const categoriesTarget = process.argv[4];

if (!source || !sqlTarget || !categoriesTarget) {
  throw new Error("Uso: node scripts/generate-product-import.mjs <entrada.csv> <produtos.sql> <categorias.csv>");
}

function parseCsv(text) {
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
    } else if (char === "," && !quoted) {
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

function quoteSql(value) {
  return `'${value.replaceAll("'", "''")}'`;
}

function quoteCsv(value) {
  return `"${value.replaceAll('"', '""')}"`;
}

const rows = parseCsv(readFileSync(source, "utf8"));
const [header, ...data] = rows;
const descriptionIndex = header.indexOf("Descricao");
const categoryIndex = header.indexOf("CATEGORIA");

if (descriptionIndex < 0 || categoryIndex < 0) {
  throw new Error("A planilha precisa conter as colunas Descricao e CATEGORIA.");
}

const products = data.map((row) => ({
  name: row[descriptionIndex].trim(),
  category: row[categoryIndex].trim()
})).filter((product) => product.name && product.category);

const categories = [...new Set(products.map((product) => product.category))].sort((a, b) => a.localeCompare(b, "pt-BR"));
const icons = {
  "COPA/COZINHA": "sparkles",
  "DESCARTÁVEIS": "trash",
  "DIVERSOS": "package",
  "EPI": "shield",
  "EQUIPAMENTOS, ACESSÓRIOS E DISPENSERS": "package",
  "GERENCIMENTO DE RESÍDUOS": "trash",
  "HIGIENE PESSOAL": "shield",
  "LIMPEZA E HIGIENE": "spray",
  "PANOS": "waves",
  "PERFUMARIA": "sparkles"
};

const productValues = products.map(({ name, category }) =>
  `  (${quoteSql(name)}, (select id from public.categories where name = ${quoteSql(category)}), ${quoteSql(name)}, '', true)`
);

const sql = `-- Gerado a partir de LISTA-DE-PRODUTOS-com-categoria.xlsx.\n-- Executar depois da migration 20260802000000_products_category_fk.sql.\n-- A planilha nao informa detalhes nem volume; o nome foi usado como descricao inicial e size recebe ''.\n\ninsert into public.products (name, category_id, description, size, active)\nvalues\n${productValues.join(",\n")}\non conflict do nothing;\n`;

const categoryCsv = [
  "name,description,icon,active,sort_order",
  ...categories.map((name, index) => [name, `Categoria ${name}.`, icons[name] ?? "package", "TRUE", String((index + 1) * 10)].map(quoteCsv).join(","))
].join("\n") + "\n";

writeFileSync(sqlTarget, sql);
writeFileSync(categoriesTarget, categoryCsv);
console.log(`Gerados ${products.length} produtos e ${categories.length} categorias.`);
