import { NextResponse } from "next/server";
import { getOrder } from "@/lib/orders";
import { generateNFeXml } from "@/lib/nfe-generator";
import { getSupabase } from "@/lib/supabase";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const orderId = parseInt(id, 10);

    const order = await getOrder(orderId);
    if (!order) {
      return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    }

    // Check if order already has NFe XML
    if (order.nfe_xml) {
      // Return existing XML
      return new NextResponse(order.nfe_xml, {
        headers: {
          'Content-Type': 'application/xml',
          'Content-Disposition': `attachment; filename="nfe-pedido-${orderId}.xml"`,
        },
      });
    }

    // Generate new XML
    const nfeXml = await generateNFeXml(orderId);

    // Save to database
    const supabase = getSupabase();
    if (supabase) {
      const { error } = await supabase.from("orders").update({ nfe_xml: nfeXml }).eq("id", orderId);
      if (error) {
        console.error('Erro ao salvar XML da NFe:', error);
        // Continue anyway, just log the error
      }
    }

    // Return the XML
    return new NextResponse(nfeXml, {
      headers: {
        'Content-Type': 'application/xml',
        'Content-Disposition': `attachment; filename="nfe-pedido-${orderId}.xml"`,
      },
    });
  } catch (error) {
    console.error('Erro ao gerar XML da NFe:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Erro ao gerar XML da NFe' },
      { status: 500 }
    );
  }
}
