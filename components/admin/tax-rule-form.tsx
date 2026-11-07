import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { SubmitButton } from "@/components/ui/submit-button";
import { Textarea } from "@/components/ui/textarea";
import { TaxRule } from "@/lib/tax-rules";

export default function TaxRuleForm({ taxRule }: { taxRule?: TaxRule }) {
  return (
    <>
      {taxRule ? <input type="hidden" name="id" value={taxRule.id} /> : null}

      <div className="grid gap-2">
        <Label htmlFor={`tax-rule-name-${taxRule?.id ?? "new"}`}>Nome da Regra *</Label>
        <Input
          id={`tax-rule-name-${taxRule?.id ?? "new"}`}
          name="name"
          defaultValue={taxRule?.name}
          placeholder="Ex: Regra Padrão Simples Nacional"
          required
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`tax-rule-description-${taxRule?.id ?? "new"}`}>Descrição</Label>
        <Textarea
          id={`tax-rule-description-${taxRule?.id ?? "new"}`}
          name="description"
          defaultValue={taxRule?.description ?? ""}
          placeholder="Descreva o objetivo desta regra fiscal"
        />
      </div>

      <div className="grid gap-2">
        <Label htmlFor={`tax-rule-ncm-${taxRule?.id ?? "new"}`}>NCM (opcional)</Label>
        <Input
          id={`tax-rule-ncm-${taxRule?.id ?? "new"}`}
          name="ncm"
          defaultValue={taxRule?.ncm ?? ""}
          placeholder="Ex: 3401 (deixe vazio para regra geral)"
        />
        <p className="text-xs text-slate-500">Deixe vazio para criar uma regra geral que se aplica a todos os produtos</p>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold text-sm mb-3">ICMS (Imposto sobre Circulação de Mercadorias)</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`icms-orig-${taxRule?.id ?? "new"}`}>Origem</Label>
            <select
              id={`icms-orig-${taxRule?.id ?? "new"}`}
              name="icms_orig"
              defaultValue={taxRule?.icms_orig ?? 0}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="0">0 - Nacional</option>
              <option value="1">1 - Importada</option>
              <option value="2">2 - Estrangeira - Importação Direta</option>
              <option value="3">3 - Estrangeira - Adquirida no Brasil</option>
              <option value="4">4 - Nacional - Conteúdo Importado &gt; 40%</option>
              <option value="5">5 - Nacional - Conteúdo Importado ≤ 40%</option>
              <option value="6">6 - Estrangeira - Importação Direta sem Similar</option>
              <option value="7">7 - Estrangeira - Adquirida no Brasil sem Similar</option>
              <option value="8">8 - Nacional - Conteúdo Importado &gt; 70%</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`icms-csosn-${taxRule?.id ?? "new"}`}>CSOSN</Label>
            <select
              id={`icms-csosn-${taxRule?.id ?? "new"}`}
              name="icms_csosn"
              defaultValue={taxRule?.icms_csosn ?? 101}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="101">101 - Tributada pelo Simples Nacional</option>
              <option value="102">102 - Tributada pelo Simples Nacional - ST</option>
              <option value="103">103 - Isenção do ICMS no Simples Nacional</option>
              <option value="201">201 - Tributada pelo Simples Nacional - Substituição</option>
              <option value="202">202 - Tributada pelo Simples Nacional - ST com retenção</option>
              <option value="203">203 - Isenção do ICMS no Simples Nacional - Substituição</option>
              <option value="300">300 - Imune</option>
              <option value="400">400 - Não tributada pelo Simples Nacional</option>
              <option value="500">500 - ICMS cobrado ant. por substituição</option>
              <option value="900">900 - Outros</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`icms-p-cred-sn-${taxRule?.id ?? "new"}`}>Alíquota Crédito ICMS (%)</Label>
            <Input
              id={`icms-p-cred-sn-${taxRule?.id ?? "new"}`}
              name="icms_p_cred_sn"
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={taxRule?.icms_p_cred_sn ?? 0}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold text-sm mb-3">PIS (Programa de Integração Social)</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`pis-cst-${taxRule?.id ?? "new"}`}>CST</Label>
            <select
              id={`pis-cst-${taxRule?.id ?? "new"}`}
              name="pis_cst"
              defaultValue={taxRule?.pis_cst ?? 99}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="01">01 - Operação Tributável</option>
              <option value="02">02 - Operação Tributável - Base de Cálculo = Valor</option>
              <option value="49">49 - Outras Operações de Saída</option>
              <option value="50">50 - Operação com Direito a Crédito</option>
              <option value="51">51 - Operação com Direito a Crédito - Vinculada</option>
              <option value="52">52 - Operação com Direito a Crédito - Vinculada Exclusivamente</option>
              <option value="53">53 - Operação com Direito a Crédito - Vinculada a Exportação</option>
              <option value="54">54 - Operação com Direito a Crédito - Vinculada a Exportação e Consumo</option>
              <option value="55">55 - Operação com Direito a Crédito - Vinculada a Exportação e Investimento</option>
              <option value="56">56 - Operação com Direito a Crédito - Vinculada a Exportação e Não Cumulativo</option>
              <option value="60">60 - Crédito Presumido</option>
              <option value="61">61 - Crédito Presumido - Vinculada</option>
              <option value="62">62 - Crédito Presumido - Vinculada Exclusivamente</option>
              <option value="63">63 - Crédito Presumido - Vinculada a Exportação</option>
              <option value="64">64 - Crédito Presumido - Vinculada a Exportação e Consumo</option>
              <option value="65">65 - Crédito Presumido - Vinculada a Exportação e Investimento</option>
              <option value="66">66 - Crédito Presumido - Vinculada a Exportação e Não Cumulativo</option>
              <option value="67">67 - Crédito Presumido - Outras</option>
              <option value="70">70 - Operação com Apropriação de Crédito</option>
              <option value="71">71 - Operação com Apropriação de Crédito - Vinculada</option>
              <option value="72">72 - Operação com Apropriação de Crédito - Vinculada Exclusivamente</option>
              <option value="73">73 - Operação com Apropriação de Crédito - Vinculada a Exportação</option>
              <option value="74">74 - Operação com Apropriação de Crédito - Vinculada a Exportação e Consumo</option>
              <option value="75">75 - Operação com Apropriação de Crédito - Vinculada a Exportação e Investimento</option>
              <option value="98">98 - Outras Operações de Entrada</option>
              <option value="99">99 - Outras Operações</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`pis-p-${taxRule?.id ?? "new"}`}>Alíquota PIS (%)</Label>
            <Input
              id={`pis-p-${taxRule?.id ?? "new"}`}
              name="pis_p"
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={taxRule?.pis_p ?? 0}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <div className="border-t pt-4 mt-4">
        <h3 className="font-semibold text-sm mb-3">COFINS (Contribuição para Financiamento da Seguridade Social)</h3>
        
        <div className="grid gap-4 md:grid-cols-2">
          <div className="grid gap-2">
            <Label htmlFor={`cofins-cst-${taxRule?.id ?? "new"}`}>CST</Label>
            <select
              id={`cofins-cst-${taxRule?.id ?? "new"}`}
              name="cofins_cst"
              defaultValue={taxRule?.cofins_cst ?? 99}
              className="h-11 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <option value="01">01 - Operação Tributável</option>
              <option value="02">02 - Operação Tributável - Base de Cálculo = Valor</option>
              <option value="49">49 - Outras Operações de Saída</option>
              <option value="50">50 - Operação com Direito a Crédito</option>
              <option value="51">51 - Operação com Direito a Crédito - Vinculada</option>
              <option value="52">52 - Operação com Direito a Crédito - Vinculada Exclusivamente</option>
              <option value="53">53 - Operação com Direito a Crédito - Vinculada a Exportação</option>
              <option value="54">54 - Operação com Direito a Crédito - Vinculada a Exportação e Consumo</option>
              <option value="55">55 - Operação com Direito a Crédito - Vinculada a Exportação e Investimento</option>
              <option value="56">56 - Operação com Direito a Crédito - Vinculada a Exportação e Não Cumulativo</option>
              <option value="60">60 - Crédito Presumido</option>
              <option value="61">61 - Crédito Presumido - Vinculada</option>
              <option value="62">62 - Crédito Presumido - Vinculada Exclusivamente</option>
              <option value="63">63 - Crédito Presumido - Vinculada a Exportação</option>
              <option value="64">64 - Crédito Presumido - Vinculada a Exportação e Consumo</option>
              <option value="65">65 - Crédito Presumido - Vinculada a Exportação e Investimento</option>
              <option value="66">66 - Crédito Presumido - Vinculada a Exportação e Não Cumulativo</option>
              <option value="67">67 - Crédito Presumido - Outras</option>
              <option value="70">70 - Operação com Apropriação de Crédito</option>
              <option value="71">71 - Operação com Apropriação de Crédito - Vinculada</option>
              <option value="72">72 - Operação com Apropriação de Crédito - Vinculada Exclusivamente</option>
              <option value="73">73 - Operação com Apropriação de Crédito - Vinculada a Exportação</option>
              <option value="74">74 - Operação com Apropriação de Crédito - Vinculada a Exportação e Consumo</option>
              <option value="75">75 - Operação com Apropriação de Crédito - Vinculada a Exportação e Investimento</option>
              <option value="98">98 - Outras Operações de Entrada</option>
              <option value="99">99 - Outras Operações</option>
            </select>
          </div>

          <div className="grid gap-2">
            <Label htmlFor={`cofins-p-${taxRule?.id ?? "new"}`}>Alíquota COFINS (%)</Label>
            <Input
              id={`cofins-p-${taxRule?.id ?? "new"}`}
              name="cofins_p"
              type="number"
              step="0.01"
              min="0"
              max="100"
              defaultValue={taxRule?.cofins_p ?? 0}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      <label className="flex items-center gap-3 text-sm font-medium mt-4">
        <input
          type="checkbox"
          name="active"
          defaultChecked={taxRule?.active ?? true}
          className="h-4 w-4 rounded border-input accent-brand-green"
        />
        Regra ativa
      </label>

      <SubmitButton className="w-full mt-4" pendingLabel={taxRule ? "Salvando..." : "Criando..."}>
        {taxRule ? "Salvar" : "Criar"}
      </SubmitButton>
    </>
  );
}
