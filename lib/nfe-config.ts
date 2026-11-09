export type NFeEnvironment = "homologation" | "production";

/** Environment is selected only by backend deployment configuration. */
export function getNFeEnvironment(): NFeEnvironment {
  const configured = process.env.NFE_ENVIRONMENT;
  if (configured === "production") return "production";
  if (!configured || configured === "homologation") return "homologation";
  throw new Error("NFE_ENVIRONMENT deve ser 'homologation' ou 'production'.");
}

const servicePaths = {
  authorization: "NfeAutorizacao/NFeAutorizacao4.asmx",
  receipt: "NfeRetAutorizacao/NFeRetAutorizacao4.asmx",
  status: "NfeStatusServico/NfeStatusServico4.asmx",
  protocol: "NfeConsulta/NFeConsulta4.asmx"
} as const;

export function getNFeServiceUrls(environment = getNFeEnvironment()) {
  const origin = environment === "production"
    ? "https://nfe-homologacao.svrs.rs.gov.br/ws/"
    : "https://nfe-homologacao.svrs.rs.gov.br/ws/";

  return {
    authorization: `${origin}${servicePaths.authorization}`,
    receipt: `${origin}${servicePaths.receipt}`,
    status: `${origin}${servicePaths.status}`,
    protocol: `${origin}${servicePaths.protocol}`
  };
}

export function getNFeTpAmb(environment = getNFeEnvironment()): "1" | "2" {
  return environment === "production" ? "1" : "2";
}
