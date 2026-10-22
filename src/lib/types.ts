export type Code = "R" | "I" | "A" | "S" | "E" | "C";
export interface Category {
  id: string;
  code: Code;
  name: string;
  description: string;
}
export interface Option {
  id: string;
  question_id: string;
  position: number;
  text: string;
  value: string;
}
export interface Question {
  id: string;
  position: number;
  text: string;
  max_selections: number;
  options: Option[];
}
export interface Weight {
  option_id: string;
  category_id: string;
  score: number;
}
export interface Answer {
  questionId: string;
  optionIds: string[];
}
export interface Activity {
  title: string;
  minutes: number;
  steps: string[];
}
export interface Role {
  display_order?: number;
  activity?: Activity | null;
  suggested_next_step?: string | null;
  id: string;
  category_id: string;
  title: string;
  description: string;
  is_demo: boolean;
}
export interface Course {
  id: string;
  category_id: string;
  title: string;
  summary: string;
  provider: string;
  price_label: string;
  url: string | null;
  study_option: string;
  affordable: boolean;
  flexible: boolean;
  is_demo: boolean;
}
export interface Advisor {
  summary?: string;
  id: string;
  category_id: string;
  name: string;
  specialty: string;
  contact: string | null;
  support_types: string[];
  is_demo: boolean;
}
export interface Ad {
  summary?: string;
  provider_name?: string;
  id: string;
  category_ids: string[];
  title: string;
  url: string | null;
  placement_key: string;
  is_sponsored: boolean;
  is_demo: boolean;
  starts_at: string | null;
  ends_at: string | null;
}
export interface Catalog {
  categories: Category[];
  questions: Question[];
  weights: Weight[];
  roles: Role[];
  courses: Course[];
  advisors: Advisor[];
}
export interface Profile {
  careerClarity: string;
  explorationPreference: string;
  coursePriorities: string[];
  learningActivity: string;
  studyOptions: string[];
  readiness: string;
  desiredSupport: string;
  nextAction: string;
}
export type PublicAdvisor = Omit<Advisor, "contact">;
export interface InterestArea extends Category {
  score: number;
  maxScore: number;
  percentage: number;
  recommended: boolean;
  reason: string;
  careers: Result["recommendations"];
  courses: Course[];
  advisors: PublicAdvisor[];
}
export interface Result {
  areas: InterestArea[];
  recommendationMode: "recommended" | "browse";
  profileLabel: string;
  riasec: Record<Code, number>;
  maxima: Record<Code, number>;
  percentages: Record<Code, number>;
  rankedCategories: (Category & {
    score: number;
    maxScore: number;
    percentage: number;
  })[];
  topCategories: Code[];
  recommendations: (Role & {
    category: Code;
    reason: string;
  })[];
  profile: Profile;
  courses: Course[];
  advisors: PublicAdvisor[];
  explanation: string;
  nextAction: {
    code: string;
    text: string;
    guidance: string[];
  };
  scoringVersion: string;
}
