"use client";

import Image from "next/image";
import { Sparkles } from "lucide-react";
import { useState, type CSSProperties } from "react";
import {
  mascotArt,
  mascotCatalog,
  type ResultMascot,
} from "@/lib/frontend/result-mascots";

function CompanionTile({ mascot }: { mascot: ResultMascot }) {
  const [failed, setFailed] = useState(false);
  return (
    <li
      className="gallery-companion"
      style={
        {
          "--gallery-color": mascot.color,
          "--gallery-tint": mascot.tint,
        } as CSSProperties
      }
    >
      <div className="gallery-companion-art">
        {failed ? (
          <span className="gallery-art-fallback">
            <Sparkles size={28} aria-hidden="true" />
            Illustration unavailable
          </span>
        ) : (
          <Image
            src={mascotArt(mascot)}
            alt={mascot.alt}
            width={768}
            height={768}
            loading="lazy"
            unoptimized
            onError={() => setFailed(true)}
          />
        )}
      </div>
      <span className="gallery-companion-interest">{mascot.interest}</span>
      <h3>
        {mascot.name}{" "}
        <span className="gallery-companion-burmese" lang="my">
          {mascot.burmeseName}
        </span>
      </h3>
      <p className="gallery-companion-personality">{mascot.title}</p>
      <p className="gallery-companion-tagline">{mascot.tagline}</p>
    </li>
  );
}

export function CompanionGallery() {
  return (
    <section className="companion-gallery" aria-labelledby="companions-title">
      <div className="section-intro">
        <h2 id="companions-title">Meet your exploration companions</h2>
        <p className="muted">
          Six Myanmar-inspired characters, six ways to explore. Take the quiz to
          discover your companion.
        </p>
      </div>
      <ul className="companion-gallery-grid" role="list">
        {mascotCatalog.map((mascot) => (
          <CompanionTile key={mascot.id} mascot={mascot} />
        ))}
      </ul>
    </section>
  );
}
