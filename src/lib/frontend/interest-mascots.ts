import type { PublicQuestion } from "./contracts";

const interestScale = [
  { value: "0", text: "Not interested", file: "not-interested.svg" },
  { value: "1", text: "A little interested", file: "a-little-interested.svg" },
  { value: "2", text: "Interested", file: "neutral.svg" },
  { value: "3", text: "Very interested", file: "very-interested.svg" },
] as const;

export function interestMascots(question: PublicQuestion) {
  if (
    question.maxSelections !== 1 ||
    question.options.length !== interestScale.length ||
    new Set(question.options.map((option) => option.value)).size !==
      interestScale.length
  )
    return undefined;

  const mascots = new Map<string, string>();
  for (const option of question.options) {
    const match = interestScale.find(
      (item) => item.value === option.value && item.text === option.text,
    );
    if (!match) return undefined;
    mascots.set(option.id, `/mascots/quiz/${match.file}`);
  }
  return mascots;
}
