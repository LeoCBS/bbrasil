export const units = [
  {
    name: "FLORIANOPOLIS SC",
    address: ["Rua Sao Ludgero, 1580 - CEP 88117-270", "Barreiros - Sao Jose - SC"],
    phones: [{ label: "(48) 3240 0074", href: "https://wa.me/554832400074" }],
    email: "comercial@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "JOINVILLE SC",
    address: ["Rua Rocha Pombo, 252 - CEP 89222-060", "Iririu - Joinville - SC"],
    phones: [{ label: "(47) 3026 6607", href: "https://wa.me/554730266607" }],
    email: "joinville@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "ITAJAI SC",
    address: ["Rua Blumenau, 1520 - Bl. 05 - CEP 88305-104", "Barra do Rio - Itajai - SC"],
    phones: [{ label: "(47) 3246 0868", href: "https://wa.me/554732460868" }],
    email: "itajai@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "BLUMENAU SC",
    address: ["Rua Fritz Spernau, 912 - CEP 89052-015", "Fortaleza - Blumenau - SC"],
    phones: [{ label: "(47) 3338 5555", href: "https://wa.me/554733385555" }],
    email: "blumenau@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "CRICIUMA SC",
    address: ["Rua Gonçalves Ledo, 92 sala 02 - Centro - Criciúma SC. Cep: 88802-120"],
    phones: [{ label: "(48) 3413 5005", href: "https://wa.me/554834135005" }],
    email: "criciuma@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "CURITIBA PR",
    address: ["Rua Des. Westphalen, 1642 A - CEP 80230-100", "Reboucas - Curitiba - PR"],
    phones: [{ label: "(41) 3278 7008", href: "https://wa.me/554132787008" }, { label: "(41) 3278 3301", href: "https://wa.me/554132783301" }],
    email: "curitiba@bbrasilprodutosdelimpeza.com.br"
  },
  {
    name: "SAO PAULO SP",
    address: ["Rua Cel. Mario de Azevedo, 153 - CEP 02710-020", "Jardim Pereira Leite - Sao Paulo - SP"],
    phones: [{ label: "(11) 2679 5559", href: "https://wa.me/551126795559" }],
    email: "sp@bbrasilprodutosdelimpeza.com.br"
  }
];

export const productCompanies = units.map((unit) => unit.name);
export const productCompanyContacts = units.map((unit) => ({
  name: unit.name,
  phoneLabel: unit.phones[0].label,
  whatsappNumber: unit.phones[0].href.replace("https://wa.me/", "")
}));
