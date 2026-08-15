"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronLeft, ChevronRight, MessageCircle } from "lucide-react";
import { useState } from "react";
import type { Unit } from "@/lib/units";

const banners = [
  {
    image: "/hero-specialist.png",
    alt: "Especialista em higiene profissional pronta para atendimento",
    eyebrow: "Fale com um",
    title: "Especialista",
    description: "Conheça nosso portfólio completo de higiene profissional e receba atendimento da sua unidade.",
    showSpecialistContent: true,
  },
  {
    image: "/hero-limpeza-institucional-cropped.png",
    alt: "Linha de limpeza institucional Alto Lim",
    showSpecialistContent: false,
  },
];

export function HeroCarousel({ selectedUnit, units }: { selectedUnit?: Unit; units: Unit[] }) {
  const [activeSlide, setActiveSlide] = useState(0);
  const banner = banners[activeSlide];
  const whatsappUrl = selectedUnit?.whatsapp_number ? `https://wa.me/${selectedUnit.whatsapp_number}` : "#";
  const catalogHref = selectedUnit ? `/produtos?unidade=${encodeURIComponent(selectedUnit.id)}` : "/produtos";

  function move(direction: 1 | -1) {
    setActiveSlide((current) => (current + direction + banners.length) % banners.length);
  }

  return (
    <section aria-label="Destaques" className="border-b bg-slate-50">
      <div className="relative min-h-[280px] overflow-hidden md:min-h-[350px]">
        <Image
          src={banner.image}
          alt={banner.alt}
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        {banner.showSpecialistContent ? (
          <>
            <div className="absolute inset-0 bg-gradient-to-r from-brand-blue/90 via-brand-green/70 to-brand-green/20" />
            <div className="container relative z-10 flex min-h-[280px] flex-col justify-center py-7 text-white md:min-h-[350px] md:py-12">
              <span className="text-2xl font-semibold md:text-4xl">{banner.eyebrow}</span>
              <h1 className="mt-1 text-4xl font-bold leading-none tracking-normal md:text-6xl">{banner.title}</h1>
              <p className="mt-4 max-w-md text-sm leading-6 text-white/90 md:text-base">{banner.description}</p>
              {selectedUnit ? (
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-6 inline-flex w-fit items-center gap-2 rounded-md bg-white px-5 py-3 text-sm font-bold text-brand-green shadow transition hover:bg-slate-100"
                >
                  <MessageCircle className="h-4 w-4" /> Falar com especialista
                </a>
              ) : (
                <span className="mt-6 inline-flex w-fit rounded-md bg-white px-5 py-3 text-sm font-bold text-brand-green shadow">
                  Selecione sua unidade para falar com um especialista
                </span>
              )}
            </div>
          </>
        ) : (
          <Link href={catalogHref} aria-label="Ver produtos de limpeza institucional" className="absolute inset-0 z-10" />
        )}

        {banners.length > 1 ? (
          <>
            <button
              type="button"
              onClick={() => move(-1)}
              aria-label="Banner anterior"
              className="absolute left-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={() => move(1)}
              aria-label="Próximo banner"
              className="absolute right-4 top-1/2 z-20 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-brand-ink shadow transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5" />
            </button>
            <div className="absolute inset-x-0 bottom-5 z-20 flex justify-center gap-2" aria-label="Navegação dos banners">
              {banners.map((item, index) => (
                <button
                  key={item.image}
                  type="button"
                  onClick={() => setActiveSlide(index)}
                  aria-label={`Ir para o banner ${index + 1}`}
                  aria-current={index === activeSlide ? "true" : undefined}
                  className={`h-2.5 rounded-full transition ${index === activeSlide ? "w-7 bg-white" : "w-2.5 bg-white/60 hover:bg-white"}`}
                />
              ))}
            </div>
          </>
        ) : null}
      </div>
    </section>
  );
}
