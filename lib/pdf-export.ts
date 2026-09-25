import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Quotation } from './quotations';
import { formatCurrency } from './format';

export async function exportQuotationToPDF(quotation: Quotation) {
  const doc = new jsPDF();
  
  // Configurações da empresa
  const companyName = "B.BRASIL PRODUTOS DE LIMPEZA E DESCARTÁVEIS LTDA";
  const companyCNPJ = "83.062.588/0001-35";
  const companyAddress = "RUA SÃO LUDGERO, 1.580 - BARREIROS - SÃO JOSÉ - 88.117-270 - SC";
  const companyPhone = "WhatsApp (48)3240-0074";
  const companyEmail = "comercial@bbrasilprodutosdelimpeza.com.br";
  
  // Número do orçamento e data
  const quotationNumber = quotation.id.toString().padStart(6, '0');
  const currentDate = new Date().toLocaleString('pt-BR');
  
  // Adicionar logotipo
  try {
    // Tenta carregar o logotipo da pasta public
    const logoResponse = await fetch('/logo2.png');
    if (logoResponse.ok) {
      const logoBlob = await logoResponse.blob();
      const logoArrayBuffer = await logoBlob.arrayBuffer();
      const logoBase64 = Buffer.from(logoArrayBuffer).toString('base64');
      const logoDataUrl = `data:image/png;base64,${logoBase64}`;
      
      // Adicionar logotipo no topo esquerdo
      doc.addImage(logoDataUrl, 'PNG', 14, 10, 50, 15);
    }
  } catch (error) {
    console.log('Não foi possível carregar o logotipo, continuando sem ele');
  }
  
  // Configurações de fonte
  doc.setFontSize(10);
  doc.setFont('helvetica');
  
  // Cabeçalho (ajustado para ficar ao lado do logotipo)
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text(`ORCAMENTO: ${quotationNumber}`, 70, 20);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(currentDate, 70, 26);
  
  // Informações da empresa (ajustadas para ficar abaixo do logotipo)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(companyName, 14, 35);
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`CNPJ: ${companyCNPJ}`, 14, 40);
  doc.text(companyAddress, 14, 45);
  doc.text(companyPhone, 14, 50);
  doc.text(`Email: ${companyEmail}`, 14, 55);
  
  // Informações do cliente
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Cliente: ${quotation.client_name}`, 14, 65);
  
  if (quotation.client_salesperson_name) {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.client_salesperson_name, 14, 70);
  }
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text(`CNPJ/CPF: ${quotation.client_cnpj}`, 14, 75);
  
  // Tabela de produtos
  const tableData = quotation.items?.map(item => [
    item.product_code || '',
    item.product_name,
    item.ncm || '',
    'UN', // Unidade padrão, pode ser ajustado
    item.quantity.toString(),
    formatCurrency(item.unit_price),
    formatCurrency(item.total_price)
  ]) || [];
  
  autoTable(doc, {
    startY: 85,
    head: [['Codigo', 'Descricao', 'NCM', 'UN', 'Qtd', 'Unitario', 'Total']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [200, 200, 200],
      textColor: [0, 0, 0],
      fontStyle: 'bold',
      fontSize: 8
    },
    bodyStyles: {
      fontSize: 8,
      cellPadding: 2
    },
    columnStyles: {
      0: { cellWidth: 15 }, // Codigo
      1: { cellWidth: 60 }, // Descricao
      2: { cellWidth: 20 }, // NCM
      3: { cellWidth: 10 }, // UN
      4: { cellWidth: 15 }, // Qtd
      5: { cellWidth: 25 }, // Unitario
      6: { cellWidth: 25 }  // Total
    }
  });
  
  // Total
  const finalY = (doc as any).lastAutoTable.finalY + 10;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Produto`, 140, finalY);
  doc.text(formatCurrency(quotation.total_amount), 170, finalY);
  
  // Informações adicionais
  const infoY = finalY + 15;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  
  if (quotation.consultant) {
    doc.text(`Consultor: ${quotation.consultant}`, 14, infoY);
  }
  
  if (quotation.payment_condition) {
    doc.text(`C.Pagto:`, 14, infoY + 6);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.payment_condition, 30, infoY + 6);
  }
  
  if (quotation.valid_until) {
    doc.setFont('helvetica', 'bold');
    const validDays = Math.ceil((new Date(quotation.valid_until).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
    doc.text(`Validade:`, 14, infoY + 12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${validDays} DIAS`, 30, infoY + 12);
  }
  
  if (quotation.delivery_period) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Prazo Ent.:`, 14, infoY + 18);
    doc.setFont('helvetica', 'normal');
    doc.text(quotation.delivery_period, 35, infoY + 18);
  }
  
  if (quotation.observation) {
    doc.setFont('helvetica', 'bold');
    doc.text(`Observação:`, 14, infoY + 24);
    doc.setFont('helvetica', 'normal');
    const observationLines = doc.splitTextToSize(quotation.observation, 180);
    doc.text(observationLines, 14, infoY + 30);
  }
  
  if (quotation.additional_info) {
    const currentY = infoY + (quotation.observation ? 36 : 24);
    doc.setFont('helvetica', 'bold');
    doc.text(`Informações Complementares:`, 14, currentY);
    doc.setFont('helvetica', 'normal');
    const infoLines = doc.splitTextToSize(quotation.additional_info, 180);
    doc.text(infoLines, 14, currentY + 6);
  }
  
  // Informações padrão da empresa
  const footerY = 250;
  doc.setFont('helvetica', 'bold');
  doc.text(`Informações Complementares:`, 14, footerY);
  doc.setFont('helvetica', 'normal');
  doc.text(`Treinamento: A B. Brasil oferece de forma gratuita, treinamento para sua equipe de limpeza.`, 14, footerY + 6);
  doc.text(`Garantindo a máxima eficiência dos produtos.`, 14, footerY + 11);
  doc.text(`Suporte: Disponibilidade de atendimento personalizado através de consultores técnicos e`, 14, footerY + 16);
  doc.text(`gerência comercial.`, 14, footerY + 21);
  
  // Área de assinatura
  const signatureY = 275;
  doc.setFont('helvetica', 'bold');
  doc.text(`RECEBIMENTO:____/____/______ ASS.CLIENTE:_________________________`, 14, signatureY);
  doc.text(`CONTROLE DE EXPEDIÇÃO`, 14, signatureY + 10);
  doc.setFont('helvetica', 'normal');
  doc.text(`SEPARADO POR: ______________________________`, 14, signatureY + 16);
  doc.text(`CONFERIDO POR: _____________________________`, 14, signatureY + 22);
  
  // Salvar o PDF
  const fileName = `ORCAMENTO-${quotationNumber}-${quotation.client_name.replace(/\s+/g, '-')}.pdf`;
  doc.save(fileName);
  
  return fileName;
}