import type { Code } from "../types";
import type { ResultView } from "./contracts";

export const mascotCatalog = [
  {
    id: "chinthe",
    code: "R",
    interest: "Realistic",
    name: "Chinthe",
    burmeseName: "ခြင်္သေ့",
    title: "The Hands-on Builder",
    tagline: "Bring ideas to life",
    description:
      "You can explore by making, fixing, and trying things with your own hands.",
    alt: "A cream and jade Chinthe lion with a small toolkit and a wrench.",
    color: "#28552b",
    tint: "#edf7e7",
  },
  {
    id: "naga",
    code: "I",
    interest: "Investigative",
    name: "Naga",
    burmeseName: "နဂါး",
    title: "The Curious Investigator",
    tagline: "Follow your curiosity",
    description:
      "A good question can be your starting point. Explore by looking closer and testing ideas.",
    alt: "A turquoise coiled Naga serpent looking through a magnifying glass.",
    color: "#24577b",
    tint: "#eaf5fc",
  },
  {
    id: "karaweik",
    code: "A",
    interest: "Artistic",
    name: "Karaweik",
    burmeseName: "ကရဝိတ်",
    title: "The Creative Storyteller",
    tagline: "Make your ideas visible",
    description:
      "Explore ways to express your ideas through stories, images, design, and imagination.",
    alt: "A coral and jade Karaweik bird with a golden crest, feathered wings, curled tail, and sketchbook.",
    color: "#873c32",
    tint: "#fff0e9",
  },
  {
    id: "hintha",
    code: "S",
    interest: "Social",
    name: "Hintha",
    burmeseName: "ဟင်္သာ",
    title: "The Caring Connector",
    tagline: "Grow by helping others",
    description:
      "Explore through teaching, listening, sharing what you know, and learning alongside other people.",
    alt: "A lilac and cream Hintha bird holding an open book with one wing extended in welcome.",
    color: "#634584",
    tint: "#f4eefa",
  },
  {
    id: "galon",
    code: "E",
    interest: "Enterprising",
    name: "Galon",
    burmeseName: "ဂဠုန်",
    title: "The Bold Initiator",
    tagline: "Turn possibility into action",
    description:
      "Explore by bringing people and ideas together, starting a project, or trying a new direction.",
    alt: "An amber Galon bird character with teal wings holding a compass.",
    color: "#79500c",
    tint: "#fff6df",
  },
  {
    id: "pyinsayupa",
    code: "C",
    interest: "Conventional",
    name: "Pyinsayupa",
    burmeseName: "ပဉ္စရူပ",
    title: "The Thoughtful Organizer",
    tagline: "Make room for a clear next step",
    description:
      "Explore by finding patterns, organizing information, and turning a busy idea into a useful plan.",
    alt: "A mint Pyinsayupa with an elephant trunk, deer antlers and feet, feathered wings, a fish tail, and a planning notebook.",
    color: "#246057",
    tint: "#e9f7f2",
  },
] as const satisfies readonly {
  id: string;
  code: Code;
  interest: string;
  name: string;
  burmeseName: string;
  title: string;
  tagline: string;
  description: string;
  alt: string;
  color: string;
  tint: string;
}[];

export type ResultMascot = (typeof mascotCatalog)[number];
export const mascotArt = (mascot: ResultMascot) =>
  `/mascots/results/${mascot.id}.webp`;
export const mascotCard = (mascot: ResultMascot) =>
  `/mascots/results/cards/${mascot.id}.png`;
export const mascotChoiceKey = (session: string, attempt: string) =>
  `career.mascot.v1.${session}.${attempt}`;

export function mascotOptions(
  result: Pick<ResultView, "rankedCategories" | "recommendationMode">,
): {
  mode: "matched" | "tied" | "choice";
  options: readonly ResultMascot[];
} {
  if (result.recommendationMode === "browse")
    return { mode: "choice", options: mascotCatalog };
  const categories = result.rankedCategories;
  if (
    !categories.length ||
    categories.some(
      (c) => c.score === undefined || !Number.isFinite(c.score) || c.score < 0,
    )
  )
    return { mode: "choice", options: mascotCatalog };
  // Core themes have unequal question counts (maxima 3, 6, or 9). Compare
  // relative interest for companions without changing backend career ranking.
  const hasMaxima = categories.every(
    (c) =>
      c.maxScore !== undefined &&
      Number.isFinite(c.maxScore) &&
      c.maxScore > 0 &&
      c.score! <= c.maxScore,
  );
  const hasPercentages = categories.every(
    (c) =>
      c.percentage !== undefined &&
      Number.isFinite(c.percentage) &&
      c.percentage >= 0 &&
      c.percentage <= 100,
  );
  if (!hasMaxima && !hasPercentages)
    return { mode: "choice", options: mascotCatalog };
  const relative = categories.map((c) => ({
    code: c.code,
    strength: hasMaxima ? c.score! / c.maxScore! : c.percentage! / 100,
  }));
  const highest = Math.max(...relative.map((c) => c.strength));
  if (highest === 0) return { mode: "choice", options: mascotCatalog };
  const codes = new Set(
    relative
      .filter((c) => Math.abs(c.strength - highest) < 1e-9)
      .map((c) => c.code),
  );
  const options = mascotCatalog.filter((m) => codes.has(m.code));
  return { mode: options.length === 1 ? "matched" : "tied", options };
}

export function selectedMascot(
  options: readonly ResultMascot[],
  saved: string | null,
) {
  return options.length === 1
    ? options[0]
    : options.find((m) => m.id === (saved === "kinnari" ? "karaweik" : saved));
}
