// Deliberate local-demo content keyed by deterministic seeded role IDs. Never used in scoring.
export const activities: Record<
  string,
  { title: string; minutes: number; steps: string[] }
> = {
  "8e7af5e6-5f79-5855-9a30-10c5f3362502": {
    title: "Think like a maker",
    minutes: 20,
    steps: [
      "Choose a household object you use often.",
      "Sketch how its parts fit together without taking it apart.",
      "List a small improvement and the tools it might need.",
    ],
  },
  "145e4e50-0bd5-5d46-b745-dbada46dd9c2": {
    title: "Follow your curiosity",
    minutes: 20,
    steps: [
      "Write an everyday question, such as why a room feels warmer.",
      "List two explanations and what evidence could distinguish them.",
      "Plan a safe observation, then record what you notice.",
    ],
  },
  "8a44d176-5457-5aaa-b350-86422de76d06": {
    title: "Make an idea visible",
    minutes: 25,
    steps: [
      "Choose a cause or event you care about.",
      "Sketch a poster with one message and a clear next action.",
      "Ask someone what message they understood and revise it.",
    ],
  },
  "ab5a9130-1876-5cc0-b33f-5d9e51af8284": {
    title: "Teach something small",
    minutes: 20,
    steps: [
      "Choose a skill you know, such as folding a paper shape.",
      "Plan a five-minute lesson with three simple steps.",
      "Try teaching a willing friend and ask which step was clearest.",
    ],
  },
  "e2957dad-6353-5622-8c89-99ce3a0f3b75": {
    title: "Bring a project to life",
    minutes: 25,
    steps: [
      "Imagine a small community event.",
      "Outline its purpose, three tasks, and a sample budget.",
      "Write a short invitation explaining why someone might join.",
    ],
  },
  "4dac014b-e541-5dc5-ae16-593a4d0f5339": {
    title: "Organize a simple plan",
    minutes: 20,
    steps: [
      "Make a fictional weekly budget with five spending categories.",
      "Check the totals and sort costs into essential and optional groups.",
      "Write one rule that would help someone keep the records accurate.",
    ],
  },
};
