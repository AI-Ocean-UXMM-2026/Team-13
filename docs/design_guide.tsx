import React, { useState, useEffect } from 'react';
import { 
  Compass, Lightbulb, GraduationCap, Users, ArrowRight, ArrowLeft, 
  Check, RefreshCw, ChevronRight, Award, BookOpen, Target, 
  Search, Mail, Briefcase, Zap, ShieldAlert, Sparkles, CheckCircle2,
  HelpCircle, Calendar, Play, Lock, ExternalLink, Info, Star, Clock, User, HeartHandshake
} from 'lucide-react';

// ==========================================
// TYPES & DATA STRUCTURES
// ==========================================

type FieldType = 'business' | 'it' | 'design';
type SituationType = 'no_clear_interest' | 'too_many_interests' | null;
type SessionType = '3min' | '5min' | null;

interface InterestCard {
  id: number;
  title: string;
  scenario: string;
  field: FieldType;
  tags: string[];
}

interface KnowledgeCard {
  id: number;
  title: string;
  concept: string;
  explanation: string;
  example: string;
  field: FieldType;
}

interface QuizQuestion {
  id: number;
  field: FieldType;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface ScenarioQuestion {
  id: number;
  field: FieldType;
  question: string;
  options: {
    text: string;
    trait: string;
    description: string;
  }[];
}

interface Career {
  id: string;
  title: string;
  field: FieldType;
  description: string;
  responsibilities: string[];
  skills: string[];
  subjects: string[];
  matchedTraits: string[];
  matchScore?: number;
}

interface Advisor {
  id: string;
  name: string;
  role: string;
  field: FieldType | 'general';
  bio: string;
  avatar: string;
  contactMethod: string;
  contactValue: string;
  experience: string;
}

interface TaskItem {
  id: string;
  week: number;
  day: number;
  title: string;
  description: string;
  completed: boolean;
}

// ==========================================
// CONSTANT DATA SETS
// ==========================================

const INTEREST_CARDS: InterestCard[] = [
  {
    id: 1,
    title: "Analyzing Customer Preferences",
    scenario: "You review consumer survey responses and social media trends to help a local brand figure out what new product features to launch next.",
    field: "business",
    tags: ["marketing", "analytics", "strategy"]
  },
  {
    id: 2,
    title: "Building Mobile Apps",
    scenario: "You write clean code to construct a seamless smartphone application that helps friends split dinner bills instantly.",
    field: "it",
    tags: ["programming", "apps", "logic"]
  },
  {
    id: 3,
    title: "Redesigning Visual Layouts",
    scenario: "You arrange typography, color palettes, and imagery on screens to make a non-profit website visually appealing and easy to navigate.",
    field: "design",
    tags: ["visual", "ui", "aesthetics"]
  },
  {
    id: 4,
    title: "Organizing Team Workflows",
    scenario: "You map out project schedules, assign tasks to team members, and ensure everyone hits deadlines for a large event.",
    field: "business",
    tags: ["management", "organization", "leadership"]
  },
  {
    id: 5,
    title: "Securing Digital Information",
    scenario: "You analyze system logs to detect unauthorized network login attempts and fortify cloud accounts against cybersecurity threats.",
    field: "it",
    tags: ["security", "networks", "protection"]
  },
  {
    id: 6,
    title: "Conducting User Interviews",
    scenario: "You observe real people trying out a prototype app to discover where they get confused and how to improve the user interface.",
    field: "design",
    tags: ["ux", "research", "empathy"]
  },
  {
    id: 7,
    title: "Creating Financial Forecasts",
    scenario: "You calculate projected revenues, expenses, and profit margins for a tech startup planning its next investment round.",
    field: "business",
    tags: ["finance", "data", "planning"]
  },
  {
    id: 8,
    title: "Automating Daily Tasks",
    scenario: "You build a custom Python script that automatically gathers sales data from five websites and creates a daily spreadsheet report.",
    field: "it",
    tags: ["automation", "scripting", "efficiency"]
  },
  {
    id: 9,
    title: "Crafting Brand Storytelling",
    scenario: "You design brand guidelines, logos, and advertising artwork that evoke strong positive emotions for an eco-friendly brand.",
    field: "design",
    tags: ["branding", "creative", "graphics"]
  },
  {
    id: 10,
    title: "Evaluating Business Opportunities",
    scenario: "You compare different market niches and business models to determine if starting a specialized online marketplace is profitable.",
    field: "business",
    tags: ["entrepreneurship", "strategy", "innovation"]
  }
];

const KNOWLEDGE_CARDS: Record<FieldType, KnowledgeCard[]> = {
  business: [
    { id: 101, field: 'business', title: 'Target Audience', concept: 'The specific group of consumers most likely to buy your product or service.', explanation: 'Businesses tailor marketing messages and product features directly to this demographic.', example: 'A gaming headset brand targets teenagers and young adults aged 15–25 who play online games.' },
    { id: 102, field: 'business', title: 'Value Proposition', concept: 'The primary reason a customer should choose your product over competitors.', explanation: 'It clearly articulates the unique problem your business solves better than anyone else.', example: 'Uber offering "Tap a button, get a ride" as a hassle-free alternative to traditional taxis.' },
    { id: 103, field: 'business', title: 'Market Research', concept: 'Gathering data about target markets, competitors, and industry trends.', explanation: 'Reduces risk before launching new products by confirming actual customer demand.', example: 'Sending surveys to 500 coffee drinkers before opening a local specialty cafe.' },
    { id: 104, field: 'business', title: 'Key Performance Indicators (KPIs)', concept: 'Measurable values used to evaluate how effectively a business achieves key goals.', explanation: 'KPIs keep teams aligned on measurable outcomes rather than vague intentions.', example: 'Tracking "Monthly Recurring Revenue (MRR)" or "Customer Acquisition Cost (CAC)".' },
    { id: 105, field: 'business', title: 'Business Model', concept: 'A company\'s plan for making a profit through products, services, and sales.', explanation: 'Defines what you sell, who pays you, and how operating expenses are structured.', example: 'Subscription model (e.g., Netflix charging a monthly recurring fee).' },
    { id: 106, field: 'business', title: 'Customer Segmentation', concept: 'Dividing a customer base into distinct groups based on shared characteristics.', explanation: 'Allows personalized marketing for different ages, income levels, or buying behaviors.', example: 'A clothing company marketing activewear to athletes and luxury wear to professionals.' },
    { id: 107, field: 'business', title: 'Return on Investment (ROI)', concept: 'A metric used to evaluate the profitability of an investment relative to its cost.', explanation: 'Calculated as (Net Profit / Total Investment Cost) * 100.', example: 'Spending $1,000 on ads that generate $3,000 in revenue yields a 200% ROI.' },
    { id: 108, field: 'business', title: 'Profit Margin', concept: 'The percentage of revenue remaining after paying all business costs.', explanation: 'Indicates how efficiently a company turns sales into actual profit.', example: 'A store selling an item for $100 with $70 in expenses has a 30% profit margin.' },
    { id: 109, field: 'business', title: 'Agile Project Management', concept: 'An iterative approach to delivering projects through small, continuous improvements.', explanation: 'Emphasizes adaptability and frequent customer feedback over rigid long-term plans.', example: 'Software teams breaking a 6-month project into two-week "sprints".' },
    { id: 110, field: 'business', title: 'Stakeholder Management', concept: 'Identifying and communicating effectively with anyone impacted by a project.', explanation: 'Ensures investors, employees, and customers remain aligned and supportive.', example: 'Sending weekly progress digests to project sponsors to maintain trust.' }
  ],
  it: [
    { id: 201, field: 'it', title: 'Algorithms', concept: 'A step-by-step set of instructions designed to solve a specific problem.', explanation: 'Form the foundational logic behind every computer software program.', example: 'A GPS navigation algorithm finding the fastest route based on real-time traffic.' },
    { id: 202, field: 'it', title: 'Databases', concept: 'An organized, persistent collection of structured digital information.', explanation: 'Enables quick storage, retrieval, updating, and querying of complex data.', example: 'SQL databases storing user login credentials, order histories, and inventory.' },
    { id: 203, field: 'it', title: 'Debugging', concept: 'The systematic process of identifying and fixing bugs or errors in software code.', explanation: 'Essential for ensuring software runs reliably without crashing or producing wrong output.', example: 'Using log statements to trace why an e-commerce checkout button crashes on mobile.' },
    { id: 204, field: 'it', title: 'Application Programming Interface (API)', concept: 'A set of rules allowing two software applications to communicate with each other.', explanation: 'Enables apps to share services without exposing underlying code implementation.', example: 'A weather app fetching current temperature data from a meteorological server.' },
    { id: 205, field: 'it', title: 'Cybersecurity', concept: 'The practice of protecting systems, networks, and data from digital attacks.', explanation: 'Prevents unauthorized access, data theft, ransomware, and identity fraud.', example: 'Enforcing multi-factor authentication (MFA) across all company accounts.' },
    { id: 206, field: 'it', title: 'Cloud Computing', concept: 'Delivering computing services over the Internet ("the cloud") including servers and storage.', explanation: 'Eliminates the need for companies to buy and maintain physical on-premise servers.', example: 'Hosting websites on Amazon Web Services (AWS) or Google Cloud Platform.' },
    { id: 207, field: 'it', title: 'Front-End vs. Back-End', concept: 'Front-end is what users interact with; back-end handles server logic and databases.', explanation: 'Front-end uses HTML/CSS/JS; back-end relies on Node.js, Python, Java, or SQL.', example: 'The visual buttons on Netflix (Front-end) streaming video from servers (Back-end).' },
    { id: 208, field: 'it', title: 'Version Control (Git)', concept: 'A system that tracks changes to software code over time across teams.', explanation: 'Allows developers to revert to previous code versions and work on features concurrently.', example: 'Creating a GitHub branch to test a new feature without breaking main live code.' },
    { id: 209, field: 'it', title: 'Data Analytics', concept: 'Examining raw datasets to draw conclusions and support decision-making.', explanation: 'Uses statistical tools and machine learning to uncover patterns in big data.', example: 'Analyzing customer churn rates to predict which users might cancel subscriptions.' },
    { id: 210, field: 'it', title: 'Automated Testing', concept: 'Using software scripts to execute test cases automatically before code release.', explanation: 'Catches bugs early without requiring slow manual testing for every change.', example: 'Running unit tests automatically whenever a developer submits new code.' }
  ],
  design: [
    { id: 301, field: 'design', title: 'User Experience (UX)', concept: 'How a user feels when interacting with a digital product, service, or system.', explanation: 'Focuses on ease of use, efficiency, utility, and emotional satisfaction.', example: 'Making a 3-step checkout so simple that users can place orders in under 30 seconds.' },
    { id: 302, field: 'design', title: 'User Interface (UI)', concept: 'The visual design layout and touchable elements of a digital product.', explanation: 'Includes buttons, typography, color harmony, spacing, icons, and micro-animations.', example: 'Choosing clean typography and rounded green buttons for a modern eco app.' },
    { id: 303, field: 'design', title: 'Wireframes', concept: 'Low-fidelity structural blueprints showing layout structure without final graphics.', explanation: 'Helps designers plan visual layout hierarchy before investing time in detailed styling.', example: 'Sketching black-and-white boxes on paper to arrange an app homepage.' },
    { id: 304, field: 'design', title: 'Visual Hierarchy', concept: 'Arranging elements in order of visual importance using scale, color, and contrast.', explanation: 'Guides the viewer\'s eye naturally to the most important actions or information first.', example: 'Making the main CTA headline large and bold while keeping body text smaller.' },
    { id: 305, field: 'design', title: 'Color Contrast', concept: 'The difference in luminance or color that makes text readable against a background.', explanation: 'Crucial for accessibility, ensuring visually impaired users can read content easily.', example: 'Using dark charcoal text on a white background instead of light grey on white.' },
    { id: 306, field: 'design', title: 'Design System', concept: 'A collection of reusable UI components and guidelines driving product consistency.', explanation: 'Ensures multi-platform products look and feel cohesive across all screens.', example: 'Pathfinder\'s design library with defined buttons, spacing rules, and brand colors.' },
    { id: 307, field: 'design', title: 'User Research', concept: 'Systematic study of target users to gather insights that inform product design.', explanation: 'Prevents designers from making assumptions about how real people act or think.', example: 'Conducting 10 user interviews to understand how students study for exams.' },
    { id: 308, field: 'design', title: 'Information Architecture (IA)', concept: 'Organizing and structuring content intuitively so users can navigate easily.', explanation: 'Prevents users from getting lost in deep menus or confusing website subpages.', example: 'Structuring a school website into Clear categories: Admissions, Majors, and Contact.' },
    { id: 309, field: 'design', title: 'Micro-interactions', concept: 'Small functional animations that provide subtle visual feedback for user actions.', explanation: 'Makes interfaces feel responsive, tactile, lively, and rewarding.', example: 'A button changing color and pulsing gently when hovered or clicked.' },
    { id: 310, field: 'design', title: 'Accessibility (a11y)', concept: 'Designing products so people of all abilities and screen readers can use them.', explanation: 'Includes keyboard navigation, screen-reader text, and clear contrast ratios.', example: 'Adding descriptive alternative text (`alt`) to all website images.' }
  ]
};

const QUIZ_QUESTIONS: Record<FieldType, QuizQuestion[]> = {
  business: [
    {
      id: 1,
      field: 'business',
      question: "What is the primary purpose of identifying a business's 'Target Audience'?",
      options: [
        "To reduce taxes owed to local government",
        "To focus marketing efforts on consumers most likely to buy",
        "To automate payroll processes for internal employees",
        "To eliminate all competitors from the industry"
      ],
      correctIndex: 1,
      explanation: "Identifying a target audience allows businesses to spend marketing budgets efficiently by focusing directly on receptive consumers."
    },
    {
      id: 2,
      field: 'business',
      question: "Which metric calculates net profitability relative to the cost of an investment?",
      options: [
        "Customer Lifetime Value (CLV)",
        "Return on Investment (ROI)",
        "Search Engine Optimization (SEO)",
        "Bounce Rate"
      ],
      correctIndex: 1,
      explanation: "ROI measures gain or loss generated on an investment relative to the amount of money invested."
    },
    {
      id: 3,
      field: 'business',
      question: "What does 'Market Research' help a company accomplish before launching a product?",
      options: [
        "Confirm whether actual customer demand exists and reduce project risk",
        "Guarantee a 100% profit margin immediately",
        "Bypass all legal regulations and industry standards",
        "Hire international staff automatically"
      ],
      correctIndex: 0,
      explanation: "Market research validates assumptions and identifies customer needs, preventing costly mistakes."
    },
    {
      id: 4,
      field: 'business',
      question: "A company charges $20/month for software subscription. What business model is this?",
      options: [
        "Freemium with ads",
        "Recurring Subscription model",
        "One-time perpetual license",
        "Auction model"
      ],
      correctIndex: 1,
      explanation: "Charging recurring monthly fees for ongoing access is the classic subscription business model."
    },
    {
      id: 5,
      field: 'business',
      question: "What is the primary benefit of Agile Project Management?",
      options: [
        "Never changing the original plan regardless of results",
        "Iterative progress through small, flexible cycles based on rapid feedback",
        "Eliminating the need for software engineers",
        "Completing 5-year plans without team communication"
      ],
      correctIndex: 1,
      explanation: "Agile breaks large projects into short sprints, adapting quickly to new customer feedback or market shifts."
    },
    {
      id: 6,
      field: 'business',
      question: "What does KPI stand for in business operations?",
      options: [
        "Key Performance Indicator",
        "Known Profit Index",
        "Key Product Inspection",
        "Knowledge Performance Integration"
      ],
      correctIndex: 0,
      explanation: "KPI stands for Key Performance Indicator—a quantifiable measure used to evaluate progress toward targets."
    },
    {
      id: 7,
      field: 'business',
      question: "Customer Segmentation refers to:",
      options: [
        "Dividing customers into distinct groups based on shared traits",
        "Firing customers who ask too many questions",
        "Combining all global products into one single price point",
        "Closing stores on weekends"
      ],
      correctIndex: 0,
      explanation: "Segmentation groups customers by age, behavior, or interests to create tailored experience and offers."
    }
  ],
  it: [
    {
      id: 1,
      field: 'it',
      question: "What is an Algorithm in computer science?",
      options: [
        "A physical computer chip installed on motherboards",
        "A step-by-step procedure or set of rules to solve a problem",
        "A type of internet connection cable",
        "A brand of modern computer monitor"
      ],
      correctIndex: 1,
      explanation: "An algorithm is a clear, logical set of step-by-step instructions executed by computers to solve problems."
    },
    {
      id: 2,
      field: 'it',
      question: "What is the main role of an API (Application Programming Interface)?",
      options: [
        "To clean dust off server hardware",
        "To allow two different software applications to communicate and exchange data",
        "To generate random passwords for wifi routers",
        "To design print flyers"
      ],
      correctIndex: 1,
      explanation: "APIs act as bridges enabling applications to talk to each other safely using defined protocols."
    },
    {
      id: 3,
      field: 'it',
      question: "Which of the following best describes Front-End development?",
      options: [
        "Managing physical data center power supplies",
        "Building user interfaces, visual buttons, and layouts users interact with directly",
        "Writing complex SQL queries for server backups",
        "Securing office wifi routers"
      ],
      correctIndex: 1,
      explanation: "Front-end development focuses on screen elements, interactions, and client-side web application visuals."
    },
    {
      id: 4,
      field: 'it',
      question: "Why do software developers use Git version control systems?",
      options: [
        "To track changes in code over time and collaborate safely across teams",
        "To speed up internet connection latency",
        "To encrypt hard drives permanently",
        "To design mobile phone cases"
      ],
      correctIndex: 0,
      explanation: "Git records changes to code repositories, enabling developers to merge work and revert errors easily."
    },
    {
      id: 5,
      field: 'it',
      question: "What is the primary function of a Database?",
      options: [
        "To calculate screen refresh rates",
        "To store, organize, and manage data so it can be queried efficiently",
        "To compress audio files for streaming",
        "To power computer cooling fans"
      ],
      correctIndex: 1,
      explanation: "Databases organize large sets of structured or unstructured data for fast retrieval and persistence."
    },
    {
      id: 6,
      field: 'it',
      question: "Multi-Factor Authentication (MFA) enhances security by:",
      options: [
        "Requiring two or more verification factors to gain system access",
        "Changing your screen background daily",
        "Deleting old emails automatically every week",
        "Making internet downloads faster"
      ],
      correctIndex: 0,
      explanation: "MFA adds extra protection layers beyond passwords, such as authenticator apps or SMS security codes."
    },
    {
      id: 7,
      field: 'it',
      question: "Debugging refers to:",
      options: [
        "Removing physical insects from server towers",
        "Identifying, isolating, and fixing errors or bugs in software source code",
        "Selling old laptop components online",
        "Writing user manuals for non-technical clients"
      ],
      correctIndex: 1,
      explanation: "Debugging is the systematic process of finding runtime errors or logical defects in code."
    }
  ],
  design: [
    {
      id: 1,
      field: 'design',
      question: "What is the main focus of User Experience (UX) Design?",
      options: [
        "Choosing rainbow color schemes for company logos",
        "How intuitive, smooth, and satisfying a product feels for the user",
        "Writing complex database queries",
        "Managing company bank accounts"
      ],
      correctIndex: 1,
      explanation: "UX design emphasizes human-centered design, usability, workflow efficiency, and user satisfaction."
    },
    {
      id: 2,
      field: 'design',
      question: "What is a Wireframe in digital design?",
      options: [
        "A physical metal frame used to support computer monitors",
        "A simple, low-fidelity layout structural outline of a screen",
        "The final high-resolution animation file",
        "A contract signed by freelance designers"
      ],
      correctIndex: 1,
      explanation: "Wireframes serve as visual structural maps before detailed graphic polish, colors, and content are added."
    },
    {
      id: 3,
      field: 'design',
      question: "Why is high color contrast important in visual interface design?",
      options: [
        "It makes files smaller to download",
        "It ensures text is easily readable for everyone, including low-vision users",
        "It prevents screens from overheating",
        "It reduces website hosting costs"
      ],
      correctIndex: 1,
      explanation: "Strong visual color contrast improves legibility and accessibility across all viewing conditions."
    },
    {
      id: 4,
      field: 'design',
      question: "Visual Hierarchy is used to:",
      options: [
        "Guide the viewer's eye to important elements through size, spacing, and color",
        "Ensure all fonts are exactly the same size",
        "Hide important navigation links from users",
        "Force users to view ads repeatedly"
      ],
      correctIndex: 0,
      explanation: "Visual hierarchy prioritizes content, helping users skim and understand screen structures naturally."
    },
    {
      id: 5,
      field: 'design',
      question: "What is a Design System?",
      options: [
        "A reusable collection of components, standards, and guidelines for product consistency",
        "A computer operating system like Windows or macOS",
        "A paid subscription service for stock photos",
        "A social media network for artists"
      ],
      correctIndex: 0,
      explanation: "Design systems unify product visual language and code components across large teams."
    },
    {
      id: 6,
      field: 'design',
      question: "Micro-interactions in digital interfaces refer to:",
      options: [
        "Tiny visual feedback animations (like button hover states) that enhance touch responsiveness",
        "Very short 3-second online video advertisements",
        "Disagreements between project managers and developers",
        "Small computer memory chips"
      ],
      correctIndex: 0,
      explanation: "Micro-interactions provide subtle visual or sensory feedback, making software feel lively and responsive."
    },
    {
      id: 7,
      field: 'design',
      question: "Information Architecture (IA) focuses on:",
      options: [
        "Structuring and organizing website content intuitively",
        "Building physical office buildings for tech companies",
        "Designing 3D video game characters",
        "Calculating company tax deductions"
      ],
      correctIndex: 0,
      explanation: "IA organizes site content logically so users can locate information seamlessly."
    }
  ]
};

const SCENARIO_QUESTIONS: Record<FieldType, ScenarioQuestion[]> = {
  business: [
    {
      id: 1,
      field: 'business',
      question: "Your team is launching a new school event, but ticket sales are much lower than projected 3 days before the event. What is your first instinct?",
      options: [
        { text: "Analyze social media analytics and survey classmates to pivot marketing messages immediately.", trait: "analytics", description: "Analytical & Data-Driven" },
        { text: "Negotiate with vendors to cut venue costs and protect budget profitability.", trait: "finance", description: "Financial & Strategic" },
        { text: "Rally team members, reassign outreach tasks, and motivate everyone for a push.", trait: "leadership", description: "Leadership & Execution" },
        { text: "Brainstorm a completely new promotional contest or giveaway bundle.", trait: "entrepreneurship", description: "Creative & Innovative" }
      ]
    },
    {
      id: 2,
      field: 'business',
      question: "When working in group projects, which responsibility do you naturally enjoy taking on most?",
      options: [
        { text: "Keeping team deadlines, creating shared timelines, and following up on tasks.", trait: "leadership", description: "Project Coordination" },
        { text: "Researching market trends, gathering references, and synthesizing data reports.", trait: "analytics", description: "Research & Analysis" },
        { text: "Pitching the final presentation slides to stakeholders or teachers eloquently.", trait: "marketing", description: "Communication & Pitching" },
        { text: "Managing budget limits, calculating costs, and allocating resources.", trait: "finance", description: "Resource Allocation" }
      ]
    },
    {
      id: 3,
      field: 'business',
      question: "How do you prefer to approach big decisions when starting a new project?",
      options: [
        { text: "Look at hard numbers, metrics, and competitor benchmarks first.", trait: "analytics", description: "Quantitative Analysis" },
        { text: "Talk to potential customers directly to understand their pain points.", trait: "marketing", description: "Customer Empathy" },
        { text: "Map out risk assessments, contingency plans, and milestone schedules.", trait: "leadership", description: "Risk Management" },
        { text: "Test a quick prototype or small test sample immediately to see what happens.", trait: "entrepreneurship", description: "Agile Experimentation" }
      ]
    },
    {
      id: 4,
      field: 'business',
      question: "If a client provides negative feedback about a project deliverable, how do you handle it?",
      options: [
        { text: "Re-examine initial requirements to identify specifically where expectations diverged.", trait: "analytics", description: "Root Cause Analysis" },
        { text: "Listen empathetically to client concerns and propose a revised action plan immediately.", trait: "marketing", description: "Client Relations" },
        { text: "Re-organize team workflow priorities to fix issues quickly without delaying milestones.", trait: "leadership", description: "Team Management" },
        { text: "Offer a novel alternative solution that turns the client's criticism into a unique advantage.", trait: "entrepreneurship", description: "Creative Problem Solving" }
      ]
    },
    {
      id: 5,
      field: 'business',
      question: "What type of challenge sounds most rewarding to solve?",
      options: [
        { text: "Turning a slow, manual company process into an efficient workflow.", trait: "leadership", description: "Process Optimization" },
        { text: "Growing an audience from 100 people to 10,000 using creative content campaigns.", trait: "marketing", description: "Audience Growth" },
        { text: "Finding hidden patterns in complex sales figures to boost profits.", trait: "finance", description: "Financial Optimization" },
        { text: "Building a brand concept from scratch and launching it into the market.", trait: "entrepreneurship", description: "Venture Creation" }
      ]
    },
    {
      id: 6,
      field: 'business',
      question: "When working under tight budget constraints, what is your strategy?",
      options: [
        { text: "Audit every line item expense and cut non-essential spending systematically.", trait: "finance", description: "Cost Control" },
        { text: "Negotiate partnership swaps or free barter deals with local organizations.", trait: "entrepreneurship", description: "Resourcefulness" },
        { text: "Focus resources purely on high-impact channels with proven high return on investment.", trait: "analytics", description: "ROI Prioritization" },
        { text: "Engage team members to find creative DIY alternatives for high-cost items.", trait: "leadership", description: "Collaborative Solutions" }
      ]
    },
    {
      id: 7,
      field: 'business',
      question: "How do you define success at the end of a project?",
      options: [
        { text: "Hitting all pre-defined performance metrics and quantitative financial goals.", trait: "finance", description: "Objective Metrics" },
        { text: "Creating lasting value and delight for customers or end-users.", trait: "marketing", description: "Customer Value" },
        { text: "Delivering on time, on budget, with a cohesive and energized team.", trait: "leadership", description: "Execution Excellence" },
        { text: "Pioneering a new approach that changes how the problem is approached in the future.", trait: "entrepreneurship", description: "Innovation Impact" }
      ]
    }
  ],
  it: [
    {
      id: 1,
      field: 'it',
      question: "Your website suddenly crashes during peak traffic hours. What is your initial reaction?",
      options: [
        { text: "Check server logs systematically to isolate the error stack trace.", trait: "programming", description: "Systematic Debugging" },
        { text: "Analyze traffic patterns to block potential cyber attack or DDoS traffic.", trait: "security", description: "Threat Mitigation" },
        { text: "Query database connection pools to see if high queries are locking tables.", trait: "data", description: "Database Diagnostics" },
        { text: "Deploy a lightweight emergency backup static page so users aren't left stranded.", trait: "architecture", description: "System Resilience" }
      ]
    },
    {
      id: 2,
      field: 'it',
      question: "Which aspect of software development interests you the most?",
      options: [
        { text: "Writing elegant algorithm logic that runs blisteringly fast.", trait: "programming", description: "Algorithm Design" },
        { text: "Building secure systems that protect user privacy against hackers.", trait: "security", description: "Cyber Defense" },
        { text: "Uncovering actionable insights from huge spreadsheets and datasets.", trait: "data", description: "Data Analytics" },
        { text: "Connecting APIs and building cloud server architectures.", trait: "architecture", description: "Cloud Infrastructure" }
      ]
    },
    {
      id: 3,
      field: 'it',
      question: "When learning a new technology or programming language, how do you learn best?",
      options: [
        { text: "Building a small hands-on project from scratch immediately.", trait: "programming", description: "Project-Based Learning" },
        { text: "Reading documentation, testing code snippets, and understanding underlying logic.", trait: "architecture", description: "Theoretical Depth" },
        { text: "Analyzing code samples and analyzing how existing frameworks handle data.", trait: "data", description: "Pattern Recognition" },
        { text: "Testing security weaknesses and seeing how systems handle unexpected edge cases.", trait: "security", description: "Stress Testing" }
      ]
    },
    {
      id: 4,
      field: 'it',
      question: "You receive an email claiming to be from your cloud provider asking for login re-verification. What do you do?",
      options: [
        { text: "Inspect email headers and URL domain carefully to verify authenticity before clicking.", trait: "security", description: "Security Vigilance" },
        { text: "Report it immediately to IT security and document the phishing pattern.", trait: "security", description: "Incident Reporting" },
        { text: "Log into the official dashboard directly via bookmark rather than email links.", trait: "architecture", description: "Best Practices" },
        { text: "Write a script to filter similar suspicious emails for your whole team.", trait: "programming", description: "Automated Defense" }
      ]
    },
    {
      id: 5,
      field: 'it',
      question: "How do you feel when faced with a cryptic software bug that takes hours to fix?",
      options: [
        { text: "Determined! I enjoy treating bugs like a detective puzzle until solved.", trait: "programming", description: "Persistent Problem Solving" },
        { text: "Methodical: I break down the code into isolated test units to find the bug.", trait: "data", description: "Methodical Isolation" },
        { text: "Cautious: I make sure fixing this bug won't introduce security vulnerabilities.", trait: "security", description: "Risk Awareness" },
        { text: "Strategic: I consider refactoring the code module to prevent future bugs.", trait: "architecture", description: "Refactoring & Architecture" }
      ]
    },
    {
      id: 6,
      field: 'it',
      question: "What kind of data project sounds most exciting to you?",
      options: [
        { text: "Predicting sports match outcomes using historical stats and machine learning.", trait: "data", description: "Predictive Analytics" },
        { text: "Building a secure encrypted messaging app for private student chats.", trait: "security", description: "Cryptographic Apps" },
        { text: "Creating an automated web scraper that tracks ticket prices automatically.", trait: "programming", description: "Web Automation" },
        { text: "Designing high-availability cloud infrastructure for a video streaming app.", trait: "architecture", description: "Scalable Systems" }
      ]
    },
    {
      id: 7,
      field: 'it',
      question: "In technical teamwork, what role do you naturally fill?",
      options: [
        { text: "The core developer who turns features into functional code quickly.", trait: "programming", description: "Feature Developer" },
        { text: "The data specialist who ensures data structures are clean and efficient.", trait: "data", description: "Data Specialist" },
        { text: "The security auditor ensuring data handling meets privacy standards.", trait: "security", description: "Security Auditor" },
        { text: "The system architect designing overall system integration.", trait: "architecture", description: "System Architect" }
      ]
    }
  ],
  design: [
    {
      id: 1,
      field: 'design',
      question: "Users complain that an application menu is confusing to use. How do you respond?",
      options: [
        { text: "Conduct usability tests observing users try navigating the menu to spot confusion.", trait: "research", description: "UX User Research" },
        { text: "Redesign visual hierarchy, typography contrast, and button spacing.", trait: "ui", description: "UI Visual Design" },
        { text: "Restructure menu navigation hierarchy to group items more logically.", trait: "ux", description: "Information Architecture" },
        { text: "Create interactive animated prototypes testing 3 alternative menu concepts.", trait: "prototype", description: "Interactive Prototyping" }
      ]
    },
    {
      id: 2,
      field: 'design',
      question: "Which tool or activity appeals to you most when starting a design project?",
      options: [
        { text: "Sketching quick wireframe wireframes on paper to explore layout ideas.", trait: "ux", description: "Wireframing & UX" },
        { text: "Creating mood boards with color palettes, typography, and visual styles.", trait: "ui", description: "Visual & Brand Styling" },
        { text: "Interviewing real users to map out their emotional pain points and journeys.", trait: "research", description: "User Research" },
        { text: "Building smooth micro-animations and micro-interactions in Figma.", trait: "prototype", description: "Motion & Interaction" }
      ]
    },
    {
      id: 3,
      field: 'design',
      question: "When forced to choose between visual beauty and ease of use, what do you prioritize?",
      options: [
        { text: "Ease of use always! A design must function smoothly above all else.", trait: "ux", description: "Usability First" },
        { text: "I balance both: great design makes functional software enjoyable to use.", trait: "ui", description: "Balanced Aesthetics" },
        { text: "I research user needs to determine the exact balance required.", trait: "research", description: "Evidence-Based Design" },
        { text: "I prototype different options to test ease vs aesthetics directly.", trait: "prototype", description: "Empirical Testing" }
      ]
    },
    {
      id: 4,
      field: 'design',
      question: "How do you evaluate whether a completed design design is successful?",
      options: [
        { text: "By testing whether real users complete key tasks effortlessly without assistance.", trait: "research", description: "Usability Validation" },
        { text: "By ensuring it adheres perfectly to accessibility standards and visual hierarchy.", trait: "ui", description: "Design Systems & A11y" },
        { text: "By seeing if it solves the original user problem identified in initial research.", trait: "ux", description: "Problem-Solving Impact" },
        { text: "By gathering feedback on how delightful and fluid the micro-interactions feel.", trait: "prototype", description: "User Delight" }
      ]
    },
    {
      id: 5,
      field: 'design',
      question: "What design challenge excites you most?",
      options: [
        { text: "Redesigning a confusing school registration form so anyone can fill it in 2 minutes.", trait: "ux", description: "Workflow Simplification" },
        { text: "Designing a striking modern visual identity and logo for a sustainable brand.", trait: "ui", description: "Visual Identity" },
        { text: "Mapping out complex service experiences combining physical and digital touchpoints.", trait: "research", description: "Service Design" },
        { text: "Animating smooth UI transitions that make an app feel like magic.", trait: "prototype", description: "Motion Design" }
      ]
    },
    {
      id: 6,
      field: 'design',
      question: "When receiving critique from a teammate who dislikes your visual layout, how do you react?",
      options: [
        { text: "Ask clarifying questions to understand their specific usability concerns.", trait: "research", description: "Constructive Discovery" },
        { text: "Explain the visual hierarchy principles and color contrast reasons behind my choices.", trait: "ui", description: "Design Rationale" },
        { text: "Quickly produce 2 fast alternative wireframes to compare options objectively.", trait: "ux", description: "Rapid Iteration" },
        { text: "Create a fast clickable prototype to see which option users actually prefer.", trait: "prototype", description: "Prototyping Options" }
      ]
    },
    {
      id: 7,
      field: 'design',
      question: "What is your philosophy on Accessibility (A11y) in design?",
      options: [
        { text: "Accessibility is a core requirement from day one, not an afterthought.", trait: "ui", description: "Inclusive Design" },
        { text: "Designing accessibly makes products easier and clearer for every single user.", trait: "ux", description: "Universal Usability" },
        { text: "I make sure to test designs with diverse user groups to uncover accessibility barriers.", trait: "research", description: "Inclusive Research" },
        { text: "I build responsive components that adapt seamlessly across devices and screen sizes.", trait: "prototype", description: "Adaptive Interaction" }
      ]
    }
  ]
};

const ALL_CAREERS: Career[] = [
  // BUSINESS (5)
  {
    id: "mkt-spec",
    title: "Marketing Specialist",
    field: "business",
    description: "Connect products with audiences by analyzing market trends, developing campaign strategies, and crafting engaging content.",
    responsibilities: [
      "Conduct market and competitor research to identify customer trends",
      "Plan and execute digital marketing campaigns across social media and email",
      "Analyze campaign metrics to optimize return on investment"
    ],
    skills: ["Market Research", "Digital Campaigns", "Content Strategy", "Data Analytics", "Communication"],
    subjects: ["Principles of Marketing", "Consumer Behavior", "Digital Media Strategy", "Business Analytics"],
    matchedTraits: ["marketing", "analytics", "communication"]
  },
  {
    id: "biz-analyst",
    title: "Business Analyst",
    field: "business",
    description: "Bridge the gap between business operations and tech solutions by analyzing data, workflows, and organizational needs.",
    responsibilities: [
      "Gather operational data to identify bottlenecks and cost inefficiencies",
      "Document business requirements for new software or process updates",
      "Present data-driven recommendations to executive leadership"
    ],
    skills: ["Data Analysis", "Process Mapping", "SQL & Excel", "Problem Solving", "Stakeholder Management"],
    subjects: ["Business Analytics", "Information Systems", "Operations Management", "Financial Accounting"],
    matchedTraits: ["analytics", "finance", "strategy"]
  },
  {
    id: "proj-coord",
    title: "Project Coordinator",
    field: "business",
    description: "Ensure initiatives run smoothly by organizing team schedules, tracking project milestones, and managing communications.",
    responsibilities: [
      "Maintain project schedules, task boards, and resource documentation",
      "Facilitate team check-ins and remove operational roadblocks",
      "Track project deliverables against deadlines and budget limits"
    ],
    skills: ["Project Management", "Agile Sprints", "Organization", "Risk Management", "Team Collaboration"],
    subjects: ["Project Management", "Organizational Behavior", "Leadership Studies", "Strategic Planning"],
    matchedTraits: ["leadership", "organization", "management"]
  },
  {
    id: "hr-spec",
    title: "Human Resources Specialist",
    field: "business",
    description: "Cultivate positive workplace cultures, recruit talent, and support employee development and organizational wellness.",
    responsibilities: [
      "Manage recruitment, talent interviews, and onboarding experiences",
      "Develop team training modules and career progression pathways",
      "Handle employee relations and promote workplace diversity initiatives"
    ],
    skills: ["Interpersonal Communication", "Conflict Resolution", "Talent Acquisition", "Employee Relations"],
    subjects: ["Human Resource Management", "Industrial Psychology", "Employment Law", "Ethics"],
    matchedTraits: ["leadership", "communication", "management"]
  },
  {
    id: "entrepreneur",
    title: "Entrepreneur",
    field: "business",
    description: "Identify market gaps, build innovative products or services, and launch scalable business ventures.",
    responsibilities: [
      "Validate product concepts through customer market testing",
      "Build financial models and pitch ventures to investors",
      "Lead cross-functional teams across strategy, sales, and operations"
    ],
    skills: ["Venture Strategy", "Financial Modeling", "Adaptability", "Leadership", "Product Validation"],
    subjects: ["Entrepreneurship & Innovation", "Venture Capital", "Business Strategy", "Product Marketing"],
    matchedTraits: ["entrepreneurship", "strategy", "innovation"]
  },

  // IT (5)
  {
    id: "soft-dev",
    title: "Software Developer",
    field: "it",
    description: "Design, build, and maintain software programs, mobile applications, and system backends using modern code.",
    responsibilities: [
      "Write clean, testable code in languages like Python, TypeScript, or Java",
      "Collaborate with product designers to implement software features",
      "Debug errors and refactor code to optimize application performance"
    ],
    skills: ["Programming Languages", "Algorithms & Data Structures", "Git Version Control", "System Architecture"],
    subjects: ["Computer Science Fundamentals", "Data Structures & Algorithms", "Software Engineering", "Web Development"],
    matchedTraits: ["programming", "logic", "automation"]
  },
  {
    id: "data-analyst",
    title: "Data Analyst",
    field: "it",
    description: "Transform complex raw datasets into actionable insights through statistical analysis, SQL queries, and visual dashboards.",
    responsibilities: [
      "Query databases using SQL to extract and clean analytics datasets",
      "Build interactive data visual dashboards using tools like Tableau or PowerBI",
      "Identify operational trends and present findings to guide strategy"
    ],
    skills: ["SQL Database Querying", "Python / R Data Analysis", "Data Visualization", "Statistics"],
    subjects: ["Applied Statistics", "Database Systems", "Data Science & Mining", "Quantitative Methods"],
    matchedTraits: ["data", "analytics", "logic"]
  },
  {
    id: "cyber-analyst",
    title: "Cybersecurity Analyst",
    field: "it",
    description: "Protect organizational networks, cloud systems, and sensitive user data from cyber attacks and data breaches.",
    responsibilities: [
      "Monitor network traffic for security anomalies or unauthorized breach attempts",
      "Conduct security vulnerability audits and penetration tests",
      "Implement security protocols, encryption, and multi-factor authentication"
    ],
    skills: ["Network Security", "Ethical Hacking", "Threat Analysis", "Security Incident Response"],
    subjects: ["Cybersecurity Principles", "Computer Networks", "Cryptography", "Information Assurance"],
    matchedTraits: ["security", "protection", "networks"]
  },
  {
    id: "web-dev",
    title: "Web Developer",
    field: "it",
    description: "Build interactive, fast, and responsive web applications for browsers using front-end and back-end web frameworks.",
    responsibilities: [
      "Develop web components using HTML, CSS, JavaScript, and React",
      "Integrate RESTful APIs and databases to manage dynamic web content",
      "Ensure cross-browser compatibility, mobile responsiveness, and page speed"
    ],
    skills: ["HTML/CSS/JavaScript", "React / Web Frameworks", "REST APIs", "Responsive Layouts"],
    subjects: ["Web Application Architecture", "Front-End Frameworks", "Internet Protocols", "Database Integration"],
    matchedTraits: ["programming", "apps", "ui"]
  },
  {
    id: "it-support",
    title: "IT Support Specialist",
    field: "it",
    description: "Maintain organization hardware, resolve technical issues for teams, and manage cloud network infrastructures.",
    responsibilities: [
      "Diagnose hardware, operating system, and software network issues",
      "Manage user account permissions, cloud drives, and security credentials",
      "Set up work workstations and document technical support solutions"
    ],
    skills: ["Hardware & OS Diagnostics", "Network Administration", "Troubleshooting", "Customer Service"],
    subjects: ["Computer Hardware & Networking", "Operating Systems", "IT Infrastructure", "System Administration"],
    matchedTraits: ["efficiency", "networks", "logic"]
  },

  // DESIGN (5)
  {
    id: "ux-ui-des",
    title: "UX/UI Designer",
    field: "design",
    description: "Create intuitive, engaging, and beautiful user interfaces and user experiences for apps, websites, and digital products.",
    responsibilities: [
      "Conduct user research interviews and map user journeys",
      "Create low-fidelity wireframes and high-fidelity visual prototypes in Figma",
      "Test digital prototypes with users to refine navigation and visual feedback"
    ],
    skills: ["User Research", "Wireframing & Figma", "UI Visual Hierarchy", "Prototyping", "Usability Testing"],
    subjects: ["Human-Computer Interaction (HCI)", "User Experience Design", "Digital Design Systems", "Visual Communication"],
    matchedTraits: ["ux", "ui", "research"]
  },
  {
    id: "graphic-des",
    title: "Graphic Designer",
    field: "design",
    description: "Craft visual visual branding, marketing artwork, typography, and publication layouts that communicate brand messages.",
    responsibilities: [
      "Design visual brand assets, logos, social media graphics, and print media",
      "Select color harmony palettes, typography pairings, and layout structures",
      "Collaborate with marketing teams to produce campaign visual assets"
    ],
    skills: ["Graphic Design & Layout", "Typography", "Color Theory", "Adobe Creative Suite / Figma", "Branding"],
    subjects: ["Graphic Design Principles", "Typography & Layout", "Brand Identity Systems", "Digital Media Arts"],
    matchedTraits: ["branding", "creative", "graphics"]
  },
  {
    id: "prod-des",
    title: "Product Designer",
    field: "design",
    description: "Take holistic ownership of end-to-end digital product design, linking business goals with user usability and aesthetics.",
    responsibilities: [
      "Align product feature design with user needs and business metrics",
      "Design cohesive design systems and reusable UI component libraries",
      "Work side-by-side with software engineers to deliver ready code designs"
    ],
    skills: ["End-to-End Product Strategy", "Design Systems", "Figma Prototyping", "UX Strategy", "Cross-Functional Leadership"],
    subjects: ["Product Design & Strategy", "Design Thinking Workshop", "Interactive Systems", "Behavioral Design"],
    matchedTraits: ["ux", "creative", "ui"]
  },
  {
    id: "motion-des",
    title: "Motion Designer",
    field: "design",
    description: "Bring digital assets to life with dynamic animations, UI micro-interactions, motion graphics, and video visuals.",
    responsibilities: [
      "Animate UI component transitions and interactive feedback micro-animations",
      "Create motion graphics explainers and visual video assets for brands",
      "Collaborate with developers to export lightweight Lottie/SVG web animations"
    ],
    skills: ["2D/3D Motion Graphics", "UI Animation", "After Effects / Rive", "Visual Storytelling", "Timing & Easing"],
    subjects: ["Animation Principles", "Motion Graphics", "Video Editing & Production", "Interactive Media"],
    matchedTraits: ["creative", "visual", "aesthetics"]
  },
  {
    id: "service-des",
    title: "Service Designer",
    field: "design",
    description: "Design seamless end-to-end service experiences across both online digital screens and physical offline real-world touchpoints.",
    responsibilities: [
      "Map out comprehensive service blueprints and customer experience journeys",
      "Identify operational disconnects between front-stage staff and backend systems",
      "Facilitate co-creation workshops with stakeholders and customer groups"
    ],
    skills: ["Service Blueprinting", "Customer Journey Mapping", "Qualitative Research", "Systemic Problem Solving"],
    subjects: ["Service Design Systems", "Design Anthropology", "Customer Experience Strategy", "Co-Creation Methods"],
    matchedTraits: ["empathy", "research", "ux"]
  }
];

const SAMPLE_ADVISORS: Advisor[] = [
  {
    id: "adv-1",
    name: "Dr. Elena Rostova",
    role: "Senior Business Strategist & University Lecturer",
    field: "business",
    bio: "Passionate about helping students discover entrepreneurship, digital marketing, and business management pathways.",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150&auto=format&fit=crop&q=80",
    contactMethod: "Email Consultation",
    contactValue: "elena.rostova.sample@pathfinder.edu",
    experience: "12+ years in corporate strategy and university mentoring"
  },
  {
    id: "adv-2",
    name: "Marcus Chen",
    role: "Lead Software Architect & Tech Mentor",
    field: "it",
    bio: "Helping aspiring tech students understand programming, cybersecurity, and navigating IT university majors.",
    avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80",
    contactMethod: "Email Mentorship",
    contactValue: "marcus.chen.sample@pathfinder.tech",
    experience: "10+ years software engineering & student coding coach"
  },
  {
    id: "adv-3",
    name: "Aria Thorne",
    role: "Principal Product & UX Designer",
    field: "design",
    bio: "Specializing in guiding creative students into UX/UI design, graphic design portfolios, and creative design careers.",
    avatar: "https://images.unsplash.com/photo-1580489944761-15a19d654956?w=150&auto=format&fit=crop&q=80",
    contactMethod: "Portfolio Feedback Email",
    contactValue: "aria.thorne.sample@pathfinder.design",
    experience: "8+ years product design leader & design workshop facilitator"
  },
  {
    id: "adv-4",
    name: "David Vance",
    role: "Holistic Career Guidance Counselor",
    field: "general",
    bio: "Helping students who feel uncertain or overwhelmed narrow down university majors and career paths with confidence.",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80",
    contactMethod: "Guidance Office Email",
    contactValue: "david.vance.sample@pathfinder.org",
    experience: "15+ years higher education student advising"
  }
];

const INITIAL_ROADMAP_TASKS: TaskItem[] = [
  // Week 1
  { id: "w1t1", week: 1, day: 1, title: "Career Discovery Overview", description: "Read through your top recommended career profile and write down 3 things that excite you.", completed: false },
  { id: "w1t2", week: 1, day: 2, title: "Day-in-the-Life Research", description: "Watch a 10-minute video or read an article showing a typical workday in this role.", completed: false },
  { id: "w1t3", week: 1, day: 3, title: "Identify Key Terminology", description: "Look up and define 5 core terms or tools frequently used in this career field.", completed: false },
  { id: "w1t4", week: 1, day: 4, title: "University Major Exploration", description: "Check 2 university website major descriptions corresponding to your recommended field.", completed: false },
  { id: "w1t5", week: 1, day: 5, title: "Self-Reflection & Journaling", description: "Reflect on how your natural strengths align with this career's core skills.", completed: false },

  // Week 2
  { id: "w2t1", week: 2, day: 1, title: "Free Introductory Tutorial", description: "Complete a free beginner online tutorial (e.g., Codecademy, Coursera, or YouTube crash course).", completed: false },
  { id: "w2t2", week: 2, day: 2, title: "Tool Setup", description: "Download or sign up for 1 fundamental industry tool (e.g., Figma, VS Code, or Notion).", completed: false },
  { id: "w2t3", week: 2, day: 3, title: "Practice Problem", description: "Solve a simple beginner exercises or challenge related to this field.", completed: false },
  { id: "w2t4", week: 2, day: 4, title: "Community Exploration", description: "Find and read 3 discussions on Reddit, Discord, or forums related to this career path.", completed: false },
  { id: "w2t5", week: 2, day: 5, title: "Skill Gap Assessment", description: "Identify 2 specific skills you would like to develop over the next school term.", completed: false },

  // Week 3
  { id: "w3t1", week: 3, day: 1, title: "Mini-Project Brainstorming", description: "Select a tiny starter project (e.g., redesign a app screen, write a 1-page business plan, or code a button).", completed: false },
  { id: "w3t2", week: 3, day: 2, title: "Drafting the Project", description: "Spend 45 minutes drafting your mini-project starter outline.", completed: false },
  { id: "w3t3", week: 3, day: 3, title: "Refining Your Work", description: "Apply learning feedback or best practices to polish your mini-project draft.", completed: false },
  { id: "w3t4", week: 3, day: 4, title: "Peer Review Check-in", description: "Show your project draft to a friend, parent, or teacher for feedback.", completed: false },
  { id: "w3t5", week: 3, day: 5, title: "Project Polish", description: "Finalize your mini-project and save it in a personal exploration folder.", completed: false },

  // Week 4
  { id: "w4t1", week: 4, day: 1, title: "Advisor Outreach", description: "Review advisor profiles in Pathfinder or reach out to a school counselor with questions.", completed: false },
  { id: "w4t2", week: 4, day: 2, title: "Portfolio / Notes Summary", description: "Summarize your 4-week learnings into a 1-page digital note or slide deck.", completed: false },
  { id: "w4t3", week: 4, day: 3, title: "Explore Alternative Majors", description: "Compare your top recommended career with your second-ranked career match in Pathfinder.", completed: false },
  { id: "w4t4", week: 4, day: 4, title: "Action Plan setting", description: "Write down 3 actionable steps for your upcoming semester.", completed: false },
  { id: "w4t5", week: 4, day: 5, title: "30-Day Milestone Celebration", description: "Celebrate completing your 30-day exploration journey with Pathfinder!", completed: false }
];

// ==========================================
// ANIMATED SVG CHARACTER COMPONENT ("PATHY")
// Expressive botanical character responding to 1-5 sentiment ratings
// ==========================================

interface CharacterProps {
  sentiment: number | null; // null or 1 to 5
  isHovered?: number | null;
}

const CharacterPathy: React.FC<CharacterProps> = ({ sentiment, isHovered }) => {
  const activeLevel = isHovered !== null ? isHovered : (sentiment || 3);

  // Expression parameters based on rating 1..5
  const getExpression = () => {
    switch (activeLevel) {
      case 1: // Strongly Dislike
        return {
          eyebrows: "M 28 32 L 40 38 M 72 38 L 84 32", // Frowning angled
          eyes: "M 30 46 A 4 4 0 0 1 38 46 M 74 46 A 4 4 0 0 1 82 46",
          mouth: "M 42 70 Q 56 58 70 70", // Frown
          color: "#E57373", // Soft red tint
          leafRotate: "-12deg",
          animation: "animate-shake"
        };
      case 2: // Dislike
        return {
          eyebrows: "M 30 35 L 42 38 M 70 38 L 82 35",
          eyes: "circle-flat",
          mouth: "M 44 66 L 68 66", // Flat line
          color: "#FFB74D", // Soft orange
          leafRotate: "-5deg",
          animation: ""
        };
      case 3: // Neutral
        return {
          eyebrows: "M 30 36 Q 36 34 42 36 M 70 36 Q 76 34 82 36",
          eyes: "circle-normal",
          mouth: "M 46 65 Q 56 68 66 65", // Small gentle line
          color: "#76A98B", // Sage Green
          leafRotate: "0deg",
          animation: ""
        };
      case 4: // Like
        return {
          eyebrows: "M 30 34 Q 36 30 42 34 M 70 34 Q 76 30 82 34",
          eyes: "happy-arches",
          mouth: "M 42 62 Q 56 74 70 62", // Smile
          color: "#438B68", // Pathfinder Primary Green
          leafRotate: "8deg",
          animation: "animate-bounce-gentle"
        };
      case 5: // Strongly Like
        return {
          eyebrows: "M 28 30 Q 36 24 44 30 M 68 30 Q 76 24 84 30",
          eyes: "sparkle-eyes",
          mouth: "M 40 60 Q 56 82 72 60 Z", // Big open smile
          color: "#326B4F", // Deep Botanical Green
          leafRotate: "15deg",
          animation: "animate-pulse-happy"
        };
      default:
        return {
          eyebrows: "M 30 36 Q 36 34 42 36 M 70 36 Q 76 34 82 36",
          eyes: "circle-normal",
          mouth: "M 46 65 Q 56 68 66 65",
          color: "#76A98B",
          leafRotate: "0deg",
          animation: ""
        };
    }
  };

  const expr = getExpression();

  return (
    <div className="relative flex flex-col items-center justify-center p-2 select-none">
      <style>{`
        @keyframes gentleBounce {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        @keyframes happyPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes subtleShake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-4px); }
          75% { transform: translateX(4px); }
        }
        .animate-bounce-gentle { animation: gentleBounce 2s infinite ease-in-out; }
        .animate-pulse-happy { animation: happyPulse 1.5s infinite ease-in-out; }
        .animate-shake { animation: subtleShake 0.4s ease-in-out; }
      `}</style>

      {/* SVG Character Container */}
      <div className={`w-32 h-32 md:w-40 md:h-40 transition-transform duration-300 ${expr.animation}`}>
        <svg viewBox="0 0 112 112" className="w-full h-full drop-shadow-md">
          {/* Top Sprout Leaves */}
          <g style={{ transform: `rotate(${expr.leafRotate})`, transformOrigin: '56px 28px', transition: 'transform 0.4s ease' }}>
            <path d="M 56 28 Q 42 12 36 22 Q 32 32 56 28 Z" fill="#76A98B" />
            <path d="M 56 28 Q 70 12 76 22 Q 80 32 56 28 Z" fill="#438B68" />
            <circle cx="56" cy="28" r="3" fill="#D9A441" />
          </g>

          {/* Main Body - Botanical Sprout Buddy */}
          <ellipse cx="56" cy="62" rx="38" ry="34" fill={expr.color} className="transition-colors duration-300" />
          
          {/* Subtle Belly Highlight */}
          <ellipse cx="56" cy="68" rx="26" ry="20" fill="#FFFFFF" fillOpacity="0.25" />

          {/* Eyebrows */}
          <path d={expr.eyebrows} stroke="#202B25" strokeWidth="2.5" strokeLinecap="round" fill="none" className="transition-all duration-300" />

          {/* Eyes */}
          {expr.eyes === 'circle-flat' && (
            <g fill="#202B25">
              <line x1="30" y1="46" x2="42" y2="46" stroke="#202B25" strokeWidth="3.5" strokeLinecap="round" />
              <line x1="70" y1="46" x2="82" y2="46" stroke="#202B25" strokeWidth="3.5" strokeLinecap="round" />
            </g>
          )}

          {expr.eyes === 'circle-normal' && (
            <g fill="#202B25">
              <circle cx="36" cy="46" r="4.5" />
              <circle cx="76" cy="46" r="4.5" />
              <circle cx="38" cy="44" r="1.5" fill="#FFFFFF" />
              <circle cx="78" cy="44" r="1.5" fill="#FFFFFF" />
            </g>
          )}

          {expr.eyes === 'happy-arches' && (
            <g stroke="#202B25" strokeWidth="3" strokeLinecap="round" fill="none">
              <path d="M 30 48 Q 36 40 42 48" />
              <path d="M 70 48 Q 76 40 82 48" />
            </g>
          )}

          {expr.eyes === 'sparkle-eyes' && (
            <g fill="#D9A441">
              {/* Star Eyes */}
              <path d="M 36 40 L 38 45 L 43 46 L 39 49 L 40 54 L 36 51 L 32 54 L 33 49 L 29 46 L 34 45 Z" />
              <path d="M 76 40 L 78 45 L 83 46 L 79 49 L 80 54 L 76 51 L 72 54 L 73 49 L 69 46 L 74 45 Z" />
            </g>
          )}

          {/* Mouth */}
          <path d={expr.mouth} stroke="#202B25" strokeWidth="3" strokeLinecap="round" fill={activeLevel === 5 ? "#E57373" : "none"} className="transition-all duration-300" />

          {/* Cheeks */}
          <ellipse cx="28" cy="54" rx="4" ry="2.5" fill="#E57373" opacity="0.6" />
          <ellipse cx="84" cy="54" rx="4" ry="2.5" fill="#E57373" opacity="0.6" />
        </svg>
      </div>

      {/* Floating Sentiment Label */}
      <div className="mt-2 text-xs font-semibold px-3 py-1 rounded-full bg-[#E8F3EC] text-[#326B4F] border border-[#76A98B]/30 shadow-sm transition-all duration-300">
        {activeLevel === 1 && "Strongly Dislike 😞"}
        {activeLevel === 2 && "Dislike 🙁"}
        {activeLevel === 3 && "Neutral 😐"}
        {activeLevel === 4 && "Like 🙂"}
        {activeLevel === 5 && "Strongly Like! 🌟"}
      </div>
    </div>
  );
};

// ==========================================
// MAIN PATHFINDER APP COMPONENT
// ==========================================

export default function App() {
  // Navigation State (Steps 0 to 9)
  // 0: Landing
  // 1: Situation Selection
  // 2: Session Preference
  // 3: Interest Flashcards (10)
  // 4: Select Career Field
  // 5: Knowledge Flashcards (10)
  // 6: Knowledge Quiz (7)
  // 7: Scenario Quiz (7)
  // 8: Career Recommendations & Roadmap
  // 9: Advisor Directory
  const [currentStep, setCurrentStep] = useState<number>(0);

  // User Journey Answers
  const [situation, setSituation] = useState<SituationType>(null);
  const [sessionPref, setSessionPref] = useState<SessionType>(null);
  
  // Flashcard & Quiz States
  const [interestIndex, setInterestIndex] = useState<number>(0);
  const [interestAnswers, setInterestAnswers] = useState<Record<number, number>>({});
  
  const [selectedField, setSelectedField] = useState<FieldType | null>(null);
  const [knowledgeIndex, setKnowledgeIndex] = useState<number>(0);
  const [knowledgeRevealed, setKnowledgeRevealed] = useState<Record<number, boolean>>({});

  const [quizIndex, setQuizIndex] = useState<number>(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const [scenarioIndex, setScenarioIndex] = useState<number>(0);
  const [scenarioAnswers, setScenarioAnswers] = useState<Record<number, number>>({});

  // UI / Modal States
  const [hoveredSentiment, setHoveredSentiment] = useState<number | null>(null);
  const [selectedCareerModal, setSelectedCareerModal] = useState<Career | null>(null);
  const [showRestartConfirm, setShowRestartConfirm] = useState<boolean>(false);
  const [advisorSearch, setAdvisorSearch] = useState<string>('');
  const [advisorFilter, setAdvisorFilter] = useState<string>('all');
  const [contactModalAdvisor, setContactModalAdvisor] = useState<Advisor | null>(null);

  // 30-Day Roadmap Tasks State with localStorage
  const [roadmapTasks, setRoadmapTasks] = useState<TaskItem[]>(() => {
    const saved = localStorage.getItem('pathfinder_roadmap');
    return saved ? JSON.parse(saved) : INITIAL_ROADMAP_TASKS;
  });

  useEffect(() => {
    localStorage.setItem('pathfinder_roadmap', JSON.stringify(roadmapTasks));
  }, [roadmapTasks]);

  // Load / Save State to LocalStorage
  useEffect(() => {
    const savedStep = localStorage.getItem('pathfinder_step');
    if (savedStep) {
      const parsedStep = parseInt(savedStep, 10);
      if (!isNaN(parsedStep) && parsedStep >= 0 && parsedStep <= 9) {
        setCurrentStep(parsedStep);
      }
    }
  }, []);

  const changeStep = (newStep: number) => {
    setCurrentStep(newStep);
    localStorage.setItem('pathfinder_step', newStep.toString());
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleResetProgress = () => {
    setSituation(null);
    setSessionPref(null);
    setInterestAnswers({});
    setInterestIndex(0);
    setSelectedField(null);
    setKnowledgeIndex(0);
    setKnowledgeRevealed({});
    setQuizAnswers({});
    setQuizIndex(0);
    setScenarioAnswers({});
    setScenarioIndex(0);
    setRoadmapTasks(INITIAL_ROADMAP_TASKS);
    localStorage.removeItem('pathfinder_step');
    localStorage.removeItem('pathfinder_roadmap');
    setShowRestartConfirm(false);
    changeStep(0);
  };

  // Toggle Task Completion in 30-Day Roadmap
  const toggleTask = (taskId: string) => {
    setRoadmapTasks(prev => 
      prev.map(t => t.id === taskId ? { ...t, completed: !t.completed } : t)
    );
  };

  const resetRoadmap = () => {
    setRoadmapTasks(INITIAL_ROADMAP_TASKS);
  };

  // ==========================================
  // DETERMINISTIC CAREER MATCHING ALGORITHM
  // Weights: Interest Alignment (50%), Scenario Alignment (35%), Knowledge Quiz (15%)
  // ==========================================
  const calculateRecommendations = (): Career[] => {
    const careerScores: Record<string, number> = {};

    ALL_CAREERS.forEach(career => {
      let score = 0;

      // 1. Interest Flashcard Alignment (50%)
      // Evaluate all 10 interest cards
      INTEREST_CARDS.forEach(card => {
        const rating = interestAnswers[card.id] || 3; // default neutral 3
        const ratingNormalized = (rating - 1) / 4; // 0 to 1

        if (card.field === career.field) {
          score += ratingNormalized * 35; // Direct field match
        }

        // Tag matches
        const hasTagMatch = card.tags.some(t => career.matchedTraits.includes(t));
        if (hasTagMatch) {
          score += ratingNormalized * 15;
        }
      });

      // 2. Scenario Alignment (35%)
      if (selectedField && SCENARIO_QUESTIONS[selectedField]) {
        const fieldScenarios = SCENARIO_QUESTIONS[selectedField];
        fieldScenarios.forEach(scen => {
          const selectedOptionIdx = scenarioAnswers[scen.id];
          if (selectedOptionIdx !== undefined) {
            const chosenOption = scen.options[selectedOptionIdx];
            if (chosenOption && career.matchedTraits.includes(chosenOption.trait)) {
              score += 35 / fieldScenarios.length;
            }
          }
        });
      }

      // 3. Selected Field Alignment (Guide Weight)
      if (career.field === selectedField) {
        score += 15;
      }

      // 4. Knowledge Quiz Secondary Signal (15%)
      if (selectedField && QUIZ_QUESTIONS[selectedField]) {
        const questions = QUIZ_QUESTIONS[selectedField];
        let correctCount = 0;
        questions.forEach(q => {
          if (quizAnswers[q.id] === q.correctIndex) {
            correctCount += 1;
          }
        });
        const quizRatio = correctCount / questions.length;
        if (career.field === selectedField) {
          score += quizRatio * 15;
        }
      }

      careerScores[career.id] = Math.min(Math.round(score), 99);
    });

    // Return sorted careers with scores
    return ALL_CAREERS.map(c => ({
      ...c,
      matchScore: careerScores[c.id] || 60
    })).sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  };

  const rankedCareers = calculateRecommendations();
  const topCareer = rankedCareers[0] || ALL_CAREERS[0];

  // Helper for field accents styling
  const getFieldBadgeStyle = (field: FieldType | 'general') => {
    switch (field) {
      case 'business':
        return 'bg-[#E8F3EC] text-[#326B4F] border-[#76A98B]/40';
      case 'it':
        return 'bg-[#EAF0FB] text-[#345EA8] border-[#345EA8]/30';
      case 'design':
        return 'bg-[#F8EDE4] text-[#A75B31] border-[#A75B31]/30';
      default:
        return 'bg-[#E8F3EC] text-[#202B25] border-[#DFE7E0]';
    }
  };

  return (
    <div className="min-h-screen bg-[#F4F8F5] text-[#202B25] font-sans antialiased flex flex-col selection:bg-[#76A98B] selection:text-white">
      
      {/* ==========================================
          GLOBAL NAVIGATION HEADER
      ========================================== */}
      <header className="sticky top-0 z-40 bg-[#FFFFFF]/90 backdrop-blur-md border-b border-[#DFE7E0] px-4 md:px-8 py-3.5 transition-all">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          
          {/* Brand Logo */}
          <div 
            onClick={() => changeStep(0)} 
            className="flex items-center gap-2.5 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-xl bg-[#438B68] text-white flex items-center justify-center shadow-md shadow-[#438B68]/20 group-hover:bg-[#326B4F] transition-colors">
              <Compass className="w-5 h-5 transition-transform group-hover:rotate-45" />
            </div>
            <div>
              <span className="font-bold text-lg text-[#202B25] tracking-tight block leading-none">Pathfinder</span>
              <span className="text-[11px] text-[#68766D] font-medium tracking-wide">Career Discovery</span>
            </div>
          </div>

          {/* Journey Steps Progress Pill */}
          {currentStep > 0 && currentStep < 9 && (
            <div className="hidden md:flex items-center gap-2 bg-[#E8F3EC] px-3.5 py-1.5 rounded-full border border-[#76A98B]/30 text-xs font-semibold text-[#326B4F]">
              <span className="w-2 h-2 rounded-full bg-[#438B68] animate-pulse"></span>
              Step {currentStep} of 8: {
                currentStep === 1 ? "Current Situation" :
                currentStep === 2 ? "Session Preference" :
                currentStep === 3 ? "Interest Flashcards" :
                currentStep === 4 ? "Select Field" :
                currentStep === 5 ? "Knowledge Cards" :
                currentStep === 6 ? "Knowledge Quiz" :
                currentStep === 7 ? "Work Scenarios" : "Results & Roadmap"
              }
            </div>
          )}

          {/* Action Header Items */}
          <div className="flex items-center gap-2 md:gap-3">
            {currentStep > 0 && (
              <button
                onClick={() => setShowRestartConfirm(true)}
                className="flex items-center gap-1.5 text-xs font-medium text-[#68766D] hover:text-[#202B25] px-3 py-1.5 rounded-lg border border-[#DFE7E0] hover:bg-white transition-all"
                title="Restart Assessment"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Restart</span>
              </button>
            )}

            <button
              onClick={() => changeStep(9)}
              className={`flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-lg border transition-all ${
                currentStep === 9 
                  ? 'bg-[#438B68] text-white border-[#438B68]' 
                  : 'bg-white text-[#326B4F] border-[#DFE7E0] hover:border-[#76A98B]'
              }`}
            >
              <Users className="w-3.5 h-3.5" />
              <span>Advisors</span>
            </button>
          </div>
        </div>

        {/* Global Journey Progress Bar */}
        {currentStep > 0 && currentStep <= 8 && (
          <div className="w-full bg-[#DFE7E0] h-1.5 absolute bottom-0 left-0 right-0 overflow-hidden">
            <div 
              className="bg-[#438B68] h-full transition-all duration-500 ease-out"
              style={{ width: `${(currentStep / 8) * 100}%` }}
            ></div>
          </div>
        )}
      </header>

      {/* ==========================================
          MAIN STEP CONTENT CONTROLLER
      ========================================== */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 md:px-8 py-6 md:py-10">
        
        {/* STEP 0: LANDING PAGE */}
        {currentStep === 0 && (
          <div className="space-y-12 md:space-y-16 animate-fadeIn">
            {/* Hero Banner */}
            <div className="text-center max-w-3xl mx-auto space-y-5 pt-4 md:pt-8">
              <div className="inline-flex items-center gap-2 bg-[#E8F3EC] border border-[#76A98B]/40 px-3.5 py-1.5 rounded-full text-xs font-semibold text-[#326B4F]">
                <Sparkles className="w-3.5 h-3.5 text-[#D9A441]" />
                <span>Find your direction. Explore your future.</span>
              </div>

              <h1 className="text-3xl md:text-5xl font-extrabold text-[#202B25] tracking-tight leading-tight">
                Your future doesn't have to be a <span className="text-[#438B68]">guessing game.</span>
              </h1>

              <p className="text-base md:text-lg text-[#68766D] max-w-2xl mx-auto leading-relaxed">
                Explore your interests, discover career possibilities, and find your next step with Pathfinder.
              </p>

              <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3.5">
                <button
                  onClick={() => changeStep(1)}
                  className="w-full sm:w-auto px-8 py-3.5 rounded-xl bg-[#438B68] hover:bg-[#326B4F] text-white font-semibold text-base shadow-lg shadow-[#438B68]/20 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
                >
                  <span>Discover My Career</span>
                  <ArrowRight className="w-5 h-5" />
                </button>

                <a 
                  href="#how-it-works"
                  className="w-full sm:w-auto px-6 py-3.5 rounded-xl bg-white hover:bg-[#E8F3EC] text-[#326B4F] font-semibold text-base border border-[#DFE7E0] flex items-center justify-center gap-2 transition-colors"
                >
                  <span>How It Works</span>
                </a>
              </div>
            </div>

            {/* How It Works - 3 Step Cards */}
            <div id="how-it-works" className="pt-8 border-t border-[#DFE7E0]/80">
              <div className="text-center mb-8">
                <h2 className="text-xl md:text-2xl font-bold text-[#202B25]">Three steps to clarity</h2>
                <p className="text-sm text-[#68766D] mt-1">A simple, student-friendly career discovery journey</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-[#DFE7E0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F3EC] text-[#326B4F] flex items-center justify-center font-bold text-base mb-4">
                    1
                  </div>
                  <h3 className="font-semibold text-lg text-[#202B25] mb-2">Explore what interests you</h3>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    Swipe through concrete, beginner-friendly flashcards with our interactive animated character.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#DFE7E0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F3EC] text-[#326B4F] flex items-center justify-center font-bold text-base mb-4">
                    2
                  </div>
                  <h3 className="font-semibold text-lg text-[#202B25] mb-2">Discover a field to investigate</h3>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    Choose between Business, IT, or Design to learn core concepts and test workplace scenario styles.
                  </p>
                </div>

                <div className="bg-white p-6 rounded-2xl border border-[#DFE7E0] shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="w-10 h-10 rounded-xl bg-[#E8F3EC] text-[#326B4F] flex items-center justify-center font-bold text-base mb-4">
                    3
                  </div>
                  <h3 className="font-semibold text-lg text-[#202B25] mb-2">Find careers & learning paths</h3>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    Get transparent career matches, university major suggestions, and a hands-on 30-day roadmap.
                  </p>
                </div>
              </div>
            </div>

            {/* Three Main Career Fields Preview */}
            <div className="space-y-6">
              <div className="text-center max-w-xl mx-auto">
                <h2 className="text-xl md:text-2xl font-bold text-[#202B25]">Explore three foundational fields</h2>
                <p className="text-sm text-[#68766D] mt-1">Discover where your unique interests align</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Business */}
                <div className="bg-white p-6 rounded-2xl border border-[#76A98B]/30 bg-gradient-to-b from-[#E8F3EC]/50 to-white shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E8F3EC] text-[#326B4F] flex items-center justify-center border border-[#76A98B]/30">
                    <Briefcase className="w-6 h-6" />
                  </div>
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#E8F3EC] text-[#326B4F]">
                    Business & Leadership
                  </span>
                  <h3 className="font-bold text-lg text-[#202B25]">Business</h3>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    Explore how organizations solve problems, understand customers, manage projects, and create value.
                  </p>
                </div>

                {/* IT */}
                <div className="bg-white p-6 rounded-2xl border border-[#345EA8]/20 bg-gradient-to-b from-[#EAF0FB]/50 to-white shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#EAF0FB] text-[#345EA8] flex items-center justify-center border border-[#345EA8]/20">
                    <Zap className="w-6 h-6" />
                  </div>
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#EAF0FB] text-[#345EA8]">
                    Technology & Logic
                  </span>
                  <h3 className="font-bold text-lg text-[#202B25]">IT</h3>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    Explore how technology, software, data analysis, cybersecurity, and digital systems solve problems.
                  </p>
                </div>

                {/* Design */}
                <div className="bg-white p-6 rounded-2xl border border-[#A75B31]/20 bg-gradient-to-b from-[#F8EDE4]/50 to-white shadow-sm space-y-3">
                  <div className="w-12 h-12 rounded-xl bg-[#F8EDE4] text-[#A75B31] flex items-center justify-center border border-[#A75B31]/20">
                    <Lightbulb className="w-6 h-6" />
                  </div>
                  <span className="inline-block text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F8EDE4] text-[#A75B31]">
                    Creativity & UX
                  </span>
                  <h3 className="font-bold text-lg text-[#202B25]">Design</h3>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    Explore how research, visual hierarchy, and problem-solving improve products and user experiences.
                  </p>
                </div>
              </div>
            </div>

            {/* Bottom Call to Action */}
            <div className="bg-[#326B4F] text-white p-8 md:p-10 rounded-2xl text-center space-y-4 shadow-xl relative overflow-hidden">
              <div className="max-w-2xl mx-auto space-y-3 relative z-10">
                <h2 className="text-2xl md:text-3xl font-bold">Ready to discover your career matches?</h2>
                <p className="text-sm md:text-base text-[#E8F3EC]/90">
                  Take the interactive assessment to explore your activity preferences, test your concepts, and map your future.
                </p>
                <div className="pt-2">
                  <button
                    onClick={() => changeStep(1)}
                    className="px-8 py-3.5 rounded-xl bg-white hover:bg-[#E8F3EC] text-[#326B4F] font-bold text-base transition-all shadow-md hover:scale-105"
                  >
                    Start Free Exploration
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 1: CURRENT CAREER INTEREST SITUATION */}
        {currentStep === 1 && (
          <div className="max-w-xl mx-auto space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#326B4F]">Step 1 of 8</span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#202B25]">Which best describes you right now?</h2>
              <p className="text-sm text-[#68766D]">Select the option that best fits your current career thoughts.</p>
            </div>

            <div className="space-y-4">
              {/* Option 1: No clear interest */}
              <div
                onClick={() => setSituation('no_clear_interest')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  situation === 'no_clear_interest'
                    ? 'border-[#438B68] bg-[#E8F3EC]/80 shadow-sm'
                    : 'border-[#DFE7E0] bg-white hover:border-[#76A98B]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                  situation === 'no_clear_interest' ? 'border-[#438B68] bg-[#438B68] text-white' : 'border-[#68766D]'
                }`}>
                  {situation === 'no_clear_interest' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-[#202B25]">No clear interest</h3>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    "I'm not sure what I enjoy or which career direction to explore."
                  </p>
                </div>
              </div>

              {/* Option 2: Too many interests */}
              <div
                onClick={() => setSituation('too_many_interests')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  situation === 'too_many_interests'
                    ? 'border-[#438B68] bg-[#E8F3EC]/80 shadow-sm'
                    : 'border-[#DFE7E0] bg-white hover:border-[#76A98B]'
                }`}
              >
                <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 mt-1 ${
                  situation === 'too_many_interests' ? 'border-[#438B68] bg-[#438B68] text-white' : 'border-[#68766D]'
                }`}>
                  {situation === 'too_many_interests' && <Check className="w-3.5 h-3.5" />}
                </div>
                <div className="space-y-1">
                  <h3 className="font-bold text-lg text-[#202B25]">Too many interests</h3>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    "I'm curious about many different things and need help narrowing down my options."
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => changeStep(0)}
                className="px-5 py-2.5 rounded-xl bg-white border border-[#DFE7E0] text-[#68766D] font-semibold text-sm hover:bg-[#E8F3EC] transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                disabled={!situation}
                onClick={() => changeStep(2)}
                className={`px-7 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                  situation 
                    ? 'bg-[#438B68] hover:bg-[#326B4F] text-white shadow-md cursor-pointer' 
                    : 'bg-[#DFE7E0] text-[#68766D] cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 2: SESSION PREFERENCE */}
        {currentStep === 2 && (
          <div className="max-w-xl mx-auto space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#326B4F]">Step 2 of 8</span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#202B25]">How much time would you like to spend exploring?</h2>
              <p className="text-sm text-[#68766D]">Choose your preferred session pace and depth.</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* 3 min */}
              <div
                onClick={() => setSessionPref('3min')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all space-y-3 text-center ${
                  sessionPref === '3min'
                    ? 'border-[#438B68] bg-[#E8F3EC]/80 shadow-sm'
                    : 'border-[#DFE7E0] bg-white hover:border-[#76A98B]'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8F3EC] text-[#326B4F] mx-auto flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-[#202B25]">3-Minute Quick Flow</h3>
                <p className="text-xs text-[#68766D] leading-relaxed">
                  Fast-paced session focused on immediate activity instincts.
                </p>
              </div>

              {/* 5 min */}
              <div
                onClick={() => setSessionPref('5min')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all space-y-3 text-center ${
                  sessionPref === '5min'
                    ? 'border-[#438B68] bg-[#E8F3EC]/80 shadow-sm'
                    : 'border-[#DFE7E0] bg-white hover:border-[#76A98B]'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8F3EC] text-[#326B4F] mx-auto flex items-center justify-center font-bold">
                  <Clock className="w-6 h-6" />
                </div>
                <h3 className="font-bold text-lg text-[#202B25]">5-Minute Deep Dive</h3>
                <p className="text-xs text-[#68766D] leading-relaxed">
                  Reflective exploration allowing extra time to review explanations.
                </p>
              </div>
            </div>

            <p className="text-xs text-center text-[#68766D] italic">
              Note: Session preference sets your style and does not change question quality or scoring rules.
            </p>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => changeStep(1)}
                className="px-5 py-2.5 rounded-xl bg-white border border-[#DFE7E0] text-[#68766D] font-semibold text-sm hover:bg-[#E8F3EC] transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                disabled={!sessionPref}
                onClick={() => changeStep(3)}
                className={`px-7 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                  sessionPref 
                    ? 'bg-[#438B68] hover:bg-[#326B4F] text-white shadow-md cursor-pointer' 
                    : 'bg-[#DFE7E0] text-[#68766D] cursor-not-allowed'
                }`}
              >
                <span>Start Flashcards</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: 10 INTEREST FLASHCARDS */}
        {currentStep === 3 && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
            {/* Header progress */}
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#326B4F]">Step 3 of 8</span>
                <h2 className="text-xl md:text-2xl font-bold text-[#202B25]">Interest Flashcards</h2>
              </div>
              <span className="text-sm font-bold bg-[#E8F3EC] text-[#326B4F] px-3 py-1 rounded-full border border-[#76A98B]/30">
                {interestIndex + 1} of 10
              </span>
            </div>

            {/* Current Flashcard Box */}
            {(() => {
              const card = INTEREST_CARDS[interestIndex];
              const currentAnswer = interestAnswers[card.id] || null;

              return (
                <div className="bg-white rounded-2xl border border-[#DFE7E0] p-6 md:p-8 shadow-sm space-y-6 relative overflow-hidden">
                  {/* Activity Title & Scenario */}
                  <div className="space-y-2 text-center">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-md bg-[#F4F8F5] text-[#68766D] border border-[#DFE7E0]">
                      Concrete Activity Scenario
                    </span>
                    <h3 className="text-xl font-bold text-[#202B25] pt-1">{card.title}</h3>
                    <p className="text-sm text-[#68766D] leading-relaxed min-h-[60px] flex items-center justify-center">
                      "{card.scenario}"
                    </p>
                  </div>

                  {/* Animated Interactive SVG Character ("Pathy") */}
                  <div className="py-2 bg-[#F4F8F5] rounded-xl border border-[#DFE7E0]/60 flex items-center justify-center">
                    <CharacterPathy 
                      sentiment={currentAnswer} 
                      isHovered={hoveredSentiment} 
                    />
                  </div>

                  {/* 5 Response Ratings */}
                  <div className="space-y-2">
                    <label className="block text-xs font-semibold text-center text-[#68766D]">
                      How much would you enjoy this activity?
                    </label>
                    
                    <div className="grid grid-cols-5 gap-1.5 md:gap-2">
                      {[1, 2, 3, 4, 5].map((level) => {
                        const isSelected = currentAnswer === level;
                        return (
                          <button
                            key={level}
                            type="button"
                            onMouseEnter={() => setHoveredSentiment(level)}
                            onMouseLeave={() => setHoveredSentiment(null)}
                            onClick={() => {
                              setInterestAnswers(prev => ({ ...prev, [card.id]: level }));
                            }}
                            className={`py-3 px-1 rounded-xl border text-center transition-all flex flex-col items-center justify-center gap-1 ${
                              isSelected
                                ? 'bg-[#438B68] text-white border-[#326B4F] shadow-md scale-105 font-bold'
                                : 'bg-white text-[#202B25] border-[#DFE7E0] hover:border-[#76A98B] hover:bg-[#E8F3EC]'
                            }`}
                          >
                            <span className="text-base font-bold">{level}</span>
                            <span className="text-[10px] hidden sm:block opacity-90 leading-none">
                              {level === 1 && "Dislike"}
                              {level === 2 && "Slight"}
                              {level === 3 && "Neutral"}
                              {level === 4 && "Like"}
                              {level === 5 && "Love!"}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Navigation controls within cards */}
                  <div className="flex items-center justify-between pt-4 border-t border-[#DFE7E0]">
                    <button
                      onClick={() => {
                        if (interestIndex > 0) {
                          setInterestIndex(prev => prev - 1);
                        } else {
                          changeStep(2);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-[#DFE7E0] text-[#68766D] font-semibold text-sm hover:bg-[#E8F3EC] transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      disabled={!currentAnswer}
                      onClick={() => {
                        if (interestIndex < INTEREST_CARDS.length - 1) {
                          setInterestIndex(prev => prev + 1);
                        } else {
                          changeStep(4);
                        }
                      }}
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                        currentAnswer
                          ? 'bg-[#438B68] hover:bg-[#326B4F] text-white shadow-md cursor-pointer'
                          : 'bg-[#DFE7E0] text-[#68766D] cursor-not-allowed'
                      }`}
                    >
                      <span>{interestIndex === INTEREST_CARDS.length - 1 ? "Choose Field" : "Next Card"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* STEP 4: SELECT CAREER FIELD */}
        {currentStep === 4 && (
          <div className="max-w-2xl mx-auto space-y-8 animate-fadeIn">
            <div className="text-center space-y-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#326B4F]">Step 4 of 8</span>
              <h2 className="text-2xl md:text-3xl font-bold text-[#202B25]">Which field would you like to explore deeply?</h2>
              <p className="text-sm text-[#68766D]">
                Choose one field to continue with its knowledge cards and workplace scenarios.
              </p>
            </div>

            <div className="space-y-4">
              {/* Business */}
              <div
                onClick={() => setSelectedField('business')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  selectedField === 'business'
                    ? 'border-[#438B68] bg-[#E8F3EC] shadow-sm'
                    : 'border-[#DFE7E0] bg-white hover:border-[#76A98B]'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#E8F3EC] text-[#326B4F] flex items-center justify-center shrink-0 border border-[#76A98B]/30">
                  <Briefcase className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[#202B25]">Business</h3>
                    {selectedField === 'business' && <Check className="w-5 h-5 text-[#438B68]" />}
                  </div>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    Explore how organizations solve problems, understand customers, manage projects, and create value.
                  </p>
                </div>
              </div>

              {/* IT */}
              <div
                onClick={() => setSelectedField('it')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  selectedField === 'it'
                    ? 'border-[#345EA8] bg-[#EAF0FB] shadow-sm'
                    : 'border-[#DFE7E0] bg-white hover:border-[#345EA8]/50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#EAF0FB] text-[#345EA8] flex items-center justify-center shrink-0 border border-[#345EA8]/20">
                  <Zap className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[#202B25]">IT & Computer Science</h3>
                    {selectedField === 'it' && <Check className="w-5 h-5 text-[#345EA8]" />}
                  </div>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    Explore how technology, software code, data analysis, cybersecurity, and digital systems solve problems.
                  </p>
                </div>
              </div>

              {/* Design */}
              <div
                onClick={() => setSelectedField('design')}
                className={`p-6 rounded-2xl border-2 cursor-pointer transition-all flex items-start gap-4 ${
                  selectedField === 'design'
                    ? 'border-[#A75B31] bg-[#F8EDE4] shadow-sm'
                    : 'border-[#DFE7E0] bg-white hover:border-[#A75B31]/50'
                }`}
              >
                <div className="w-12 h-12 rounded-xl bg-[#F8EDE4] text-[#A75B31] flex items-center justify-center shrink-0 border border-[#A75B31]/20">
                  <Lightbulb className="w-6 h-6" />
                </div>
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <h3 className="font-bold text-lg text-[#202B25]">Design & UX</h3>
                    {selectedField === 'design' && <Check className="w-5 h-5 text-[#A75B31]" />}
                  </div>
                  <p className="text-sm text-[#68766D] leading-relaxed">
                    Explore how user research, visual hierarchy, and creative problem-solving improve products and user experiences.
                  </p>
                </div>
              </div>
            </div>

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between pt-4">
              <button
                onClick={() => changeStep(3)}
                className="px-5 py-2.5 rounded-xl bg-white border border-[#DFE7E0] text-[#68766D] font-semibold text-sm hover:bg-[#E8F3EC] transition-colors flex items-center gap-1.5"
              >
                <ArrowLeft className="w-4 h-4" />
                <span>Back</span>
              </button>

              <button
                disabled={!selectedField}
                onClick={() => changeStep(5)}
                className={`px-7 py-3 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                  selectedField 
                    ? 'bg-[#438B68] hover:bg-[#326B4F] text-white shadow-md cursor-pointer' 
                    : 'bg-[#DFE7E0] text-[#68766D] cursor-not-allowed'
                }`}
              >
                <span>Continue</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* STEP 5: 10 KNOWLEDGE FLASHCARDS */}
        {currentStep === 5 && selectedField && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#326B4F]">Step 5 of 8</span>
                <h2 className="text-xl md:text-2xl font-bold text-[#202B25]">Knowledge Flashcards</h2>
              </div>
              <span className="text-sm font-bold bg-[#E8F3EC] text-[#326B4F] px-3 py-1 rounded-full border border-[#76A98B]/30">
                {knowledgeIndex + 1} of 10
              </span>
            </div>

            {(() => {
              const cards = KNOWLEDGE_CARDS[selectedField];
              const card = cards[knowledgeIndex];
              const isRevealed = knowledgeRevealed[card.id] || false;

              return (
                <div className="bg-white rounded-2xl border border-[#DFE7E0] p-6 md:p-8 shadow-sm space-y-6">
                  {/* Card Badge */}
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getFieldBadgeStyle(selectedField)} uppercase tracking-wider`}>
                      {selectedField} Concept
                    </span>
                    <span className="text-xs text-[#68766D]">Click card to reveal explanation</span>
                  </div>

                  {/* Concept Front / Back Box */}
                  <div 
                    onClick={() => setKnowledgeRevealed(prev => ({ ...prev, [card.id]: !isRevealed }))}
                    className="p-6 rounded-2xl bg-[#F4F8F5] border border-[#DFE7E0] hover:border-[#76A98B] cursor-pointer transition-all space-y-4 text-center min-h-[220px] flex flex-col justify-center items-center"
                  >
                    <BookOpen className="w-8 h-8 text-[#438B68] mx-auto" />
                    
                    <h3 className="text-2xl font-bold text-[#202B25]">{card.title}</h3>
                    
                    <p className="text-sm font-medium text-[#326B4F] bg-white px-4 py-2 rounded-xl border border-[#DFE7E0] inline-block">
                      "{card.concept}"
                    </p>

                    {isRevealed ? (
                      <div className="pt-3 border-t border-[#DFE7E0] w-full text-left space-y-2 animate-fadeIn">
                        <p className="text-sm text-[#202B25] leading-relaxed">
                          <strong>Explanation:</strong> {card.explanation}
                        </p>
                        <p className="text-xs text-[#68766D] bg-[#E8F3EC] p-3 rounded-lg border border-[#76A98B]/30">
                          💡 <strong>Real-World Example:</strong> {card.example}
                        </p>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-[#438B68] flex items-center gap-1 pt-2">
                        <Sparkles className="w-3.5 h-3.5" /> Tap to reveal breakdown & example
                      </span>
                    )}
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between pt-2">
                    <button
                      onClick={() => {
                        if (knowledgeIndex > 0) {
                          setKnowledgeIndex(prev => prev - 1);
                        } else {
                          changeStep(4);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-[#DFE7E0] text-[#68766D] font-semibold text-sm hover:bg-[#E8F3EC] transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      onClick={() => {
                        if (knowledgeIndex < cards.length - 1) {
                          setKnowledgeIndex(prev => prev + 1);
                        } else {
                          changeStep(6);
                        }
                      }}
                      className="px-6 py-2.5 rounded-xl bg-[#438B68] hover:bg-[#326B4F] text-white font-semibold text-sm shadow-md flex items-center gap-2 transition-all"
                    >
                      <span>{knowledgeIndex === cards.length - 1 ? "Take Knowledge Quiz" : "Next Card"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* STEP 6: 7-QUESTION KNOWLEDGE QUIZ */}
        {currentStep === 6 && selectedField && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#326B4F]">Step 6 of 8</span>
                <h2 className="text-xl md:text-2xl font-bold text-[#202B25]">Knowledge Quiz</h2>
              </div>
              <span className="text-sm font-bold bg-[#E8F3EC] text-[#326B4F] px-3 py-1 rounded-full border border-[#76A98B]/30">
                Question {quizIndex + 1} of 7
              </span>
            </div>

            {(() => {
              const questions = QUIZ_QUESTIONS[selectedField];
              const q = questions[quizIndex];
              const selectedOpt = quizAnswers[q.id];
              const isAnswered = selectedOpt !== undefined;

              return (
                <div className="bg-white rounded-2xl border border-[#DFE7E0] p-6 md:p-8 shadow-sm space-y-6">
                  <h3 className="text-lg md:text-xl font-bold text-[#202B25] leading-snug">
                    {q.question}
                  </h3>

                  {/* Options */}
                  <div className="space-y-2.5">
                    {q.options.map((optionText, idx) => {
                      const isChosen = selectedOpt === idx;
                      const isCorrect = idx === q.correctIndex;

                      let optStyle = "bg-white border-[#DFE7E0] hover:border-[#76A98B]";
                      if (isAnswered) {
                        if (isChosen && isCorrect) optStyle = "bg-[#E8F3EC] border-[#438B68] font-semibold text-[#326B4F]";
                        else if (isChosen && !isCorrect) optStyle = "bg-red-50 border-red-300 text-red-800";
                        else if (isCorrect) optStyle = "bg-[#E8F3EC]/60 border-[#76A98B] text-[#326B4F]";
                      }

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setQuizAnswers(prev => ({ ...prev, [q.id]: idx }));
                          }}
                          className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-start gap-3 ${optStyle}`}
                        >
                          <span className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold ${
                            isChosen ? 'bg-[#438B68] text-white border-[#438B68]' : 'border-[#68766D]'
                          }`}>
                            {String.fromCharCode(65 + idx)}
                          </span>
                          <span className="flex-1">{optionText}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Immediate Feedback Box */}
                  {isAnswered && (
                    <div className={`p-4 rounded-xl border text-xs leading-relaxed space-y-1 animate-fadeIn ${
                      selectedOpt === q.correctIndex ? 'bg-[#E8F3EC] border-[#76A98B] text-[#326B4F]' : 'bg-amber-50 border-amber-200 text-amber-900'
                    }`}>
                      <div className="font-bold flex items-center gap-1.5">
                        {selectedOpt === q.correctIndex ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-[#438B68]" />
                            <span>Correct answer!</span>
                          </>
                        ) : (
                          <>
                            <Info className="w-4 h-4 text-amber-600" />
                            <span>Concept explanation:</span>
                          </>
                        )}
                      </div>
                      <p>{q.explanation}</p>
                    </div>
                  )}

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#DFE7E0]">
                    <button
                      onClick={() => {
                        if (quizIndex > 0) {
                          setQuizIndex(prev => prev - 1);
                        } else {
                          changeStep(5);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-[#DFE7E0] text-[#68766D] font-semibold text-sm hover:bg-[#E8F3EC] transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      disabled={!isAnswered}
                      onClick={() => {
                        if (quizIndex < questions.length - 1) {
                          setQuizIndex(prev => prev + 1);
                        } else {
                          changeStep(7);
                        }
                      }}
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                        isAnswered
                          ? 'bg-[#438B68] hover:bg-[#326B4F] text-white shadow-md cursor-pointer'
                          : 'bg-[#DFE7E0] text-[#68766D] cursor-not-allowed'
                      }`}
                    >
                      <span>{quizIndex === questions.length - 1 ? "Start Scenario Quiz" : "Next Question"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* STEP 7: 7-QUESTION SCENARIO QUIZ */}
        {currentStep === 7 && selectedField && (
          <div className="max-w-xl mx-auto space-y-6 animate-fadeIn">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#326B4F]">Step 7 of 8</span>
                <h2 className="text-xl md:text-2xl font-bold text-[#202B25]">Work Scenario Styles</h2>
              </div>
              <span className="text-sm font-bold bg-[#E8F3EC] text-[#326B4F] px-3 py-1 rounded-full border border-[#76A98B]/30">
                Scenario {scenarioIndex + 1} of 7
              </span>
            </div>

            {(() => {
              const scenarios = SCENARIO_QUESTIONS[selectedField];
              const sc = scenarios[scenarioIndex];
              const selectedOpt = scenarioAnswers[sc.id];

              return (
                <div className="bg-white rounded-2xl border border-[#DFE7E0] p-6 md:p-8 shadow-sm space-y-6">
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-[#326B4F] uppercase tracking-wide">
                      Practical Workplace Challenge
                    </span>
                    <h3 className="text-lg md:text-xl font-bold text-[#202B25] leading-snug">
                      "{sc.question}"
                    </h3>
                  </div>

                  <div className="space-y-2.5">
                    {sc.options.map((opt, idx) => {
                      const isChosen = selectedOpt === idx;

                      return (
                        <button
                          key={idx}
                          type="button"
                          onClick={() => {
                            setScenarioAnswers(prev => ({ ...prev, [sc.id]: idx }));
                          }}
                          className={`w-full p-4 rounded-xl border text-left text-sm transition-all flex items-start gap-3 ${
                            isChosen
                              ? 'bg-[#E8F3EC] border-[#438B68] font-medium text-[#202B25] shadow-sm'
                              : 'bg-white border-[#DFE7E0] hover:border-[#76A98B]'
                          }`}
                        >
                          <div className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 mt-0.5 ${
                            isChosen ? 'border-[#438B68] bg-[#438B68] text-white' : 'border-[#68766D]'
                          }`}>
                            {isChosen && <Check className="w-3 h-3" />}
                          </div>
                          <div className="space-y-0.5">
                            <span className="block text-sm text-[#202B25]">{opt.text}</span>
                            <span className="block text-[11px] text-[#68766D] font-semibold">{opt.description}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>

                  {/* Navigation controls */}
                  <div className="flex items-center justify-between pt-2 border-t border-[#DFE7E0]">
                    <button
                      onClick={() => {
                        if (scenarioIndex > 0) {
                          setScenarioIndex(prev => prev - 1);
                        } else {
                          changeStep(6);
                        }
                      }}
                      className="px-4 py-2 rounded-xl bg-white border border-[#DFE7E0] text-[#68766D] font-semibold text-sm hover:bg-[#E8F3EC] transition-colors flex items-center gap-1"
                    >
                      <ArrowLeft className="w-4 h-4" />
                      <span>Back</span>
                    </button>

                    <button
                      disabled={selectedOpt === undefined}
                      onClick={() => {
                        if (scenarioIndex < scenarios.length - 1) {
                          setScenarioIndex(prev => prev + 1);
                        } else {
                          changeStep(8);
                        }
                      }}
                      className={`px-6 py-2.5 rounded-xl font-semibold text-sm flex items-center gap-2 transition-all ${
                        selectedOpt !== undefined
                          ? 'bg-[#438B68] hover:bg-[#326B4F] text-white shadow-md cursor-pointer'
                          : 'bg-[#DFE7E0] text-[#68766D] cursor-not-allowed'
                      }`}
                    >
                      <span>{scenarioIndex === scenarios.length - 1 ? "View My Results" : "Next Scenario"}</span>
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {/* STEP 8: PERSONALIZED CAREER RECOMMENDATIONS & 30-DAY ROADMAP */}
        {currentStep === 8 && (
          <div className="space-y-10 animate-fadeIn">
            {/* Results Personalization Header */}
            <div className="bg-white rounded-2xl border border-[#DFE7E0] p-6 md:p-8 shadow-sm space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DFE7E0] pb-6">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-[#326B4F]">Personalized Assessment Results</span>
                  <h2 className="text-2xl md:text-3xl font-extrabold text-[#202B25] mt-1">
                    Here are some careers worth exploring
                  </h2>
                  <p className="text-sm text-[#68766D] mt-1">
                    {situation === 'no_clear_interest'
                      ? "Based on your responses, we've highlighted careers that offer strong alignment with your preferred activities."
                      : "We've analyzed your multiple interests to help prioritize and compare your strongest matches."
                    }
                  </p>
                </div>

                <div className="bg-[#E8F3EC] p-4 rounded-xl border border-[#76A98B]/30 flex items-center gap-3 shrink-0">
                  <Award className="w-8 h-8 text-[#438B68]" />
                  <div>
                    <span className="text-xs text-[#68766D] font-medium block">Top Match Result</span>
                    <span className="text-base font-bold text-[#326B4F]">{topCareer.title}</span>
                  </div>
                </div>
              </div>

              {/* Transparent Score Breakdown Explainer */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs text-[#68766D] pt-2">
                <div className="bg-[#F4F8F5] p-3 rounded-xl border border-[#DFE7E0]">
                  <strong className="text-[#202B25] block mb-0.5">1. Interest Flashcards (50%)</strong>
                  Mapped against your activity sentiment ratings.
                </div>
                <div className="bg-[#F4F8F5] p-3 rounded-xl border border-[#DFE7E0]">
                  <strong className="text-[#202B25] block mb-0.5">2. Work Scenarios (35%)</strong>
                  Evaluated your problem-solving style.
                </div>
                <div className="bg-[#F4F8F5] p-3 rounded-xl border border-[#DFE7E0]">
                  <strong className="text-[#202B25] block mb-0.5">3. Knowledge Quiz (15%)</strong>
                  Included concept learning readiness.
                </div>
              </div>
            </div>

            {/* 15 Career Matches Library */}
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold text-[#202B25]">All 15 Recommended Careers</h3>
                <span className="text-xs text-[#68766D]">Sorted by match score alignment</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {rankedCareers.map((career, idx) => {
                  const score = career.matchScore || 65;

                  return (
                    <div
                      key={career.id}
                      className="bg-white rounded-2xl border border-[#DFE7E0] p-6 shadow-sm hover:shadow-md transition-all flex flex-col justify-between space-y-4 relative overflow-hidden"
                    >
                      {/* Top Rank Badge */}
                      <div className="flex items-center justify-between">
                        <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getFieldBadgeStyle(career.field)}`}>
                          {career.field.toUpperCase()}
                        </span>
                        <span className="text-xs font-bold text-[#326B4F] bg-[#E8F3EC] px-2.5 py-1 rounded-full border border-[#76A98B]/30">
                          {score}% Match
                        </span>
                      </div>

                      <div className="space-y-2">
                        <h4 className="text-lg font-bold text-[#202B25]">{career.title}</h4>
                        <p className="text-xs text-[#68766D] leading-relaxed line-clamp-3">
                          {career.description}
                        </p>
                      </div>

                      {/* Skills tags preview */}
                      <div className="space-y-2 pt-2">
                        <span className="text-[11px] font-semibold text-[#68766D] block">Key Skills:</span>
                        <div className="flex flex-wrap gap-1">
                          {career.skills.slice(0, 3).map((sk, sIdx) => (
                            <span key={sIdx} className="text-[10px] bg-[#F4F8F5] text-[#202B25] px-2 py-0.5 rounded border border-[#DFE7E0]">
                              {sk}
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedCareerModal(career)}
                        className="w-full py-2.5 rounded-xl bg-white hover:bg-[#E8F3EC] text-[#326B4F] font-semibold text-xs border border-[#DFE7E0] hover:border-[#76A98B] transition-colors flex items-center justify-center gap-1 mt-2"
                      >
                        <span>View Full Career Profile</span>
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* INTERACTIVE 30-DAY CAREER EXPLORATION ROADMAP */}
            <div className="bg-white rounded-2xl border border-[#DFE7E0] p-6 md:p-8 shadow-sm space-y-8">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-[#DFE7E0] pb-6">
                <div>
                  <div className="inline-flex items-center gap-1.5 bg-[#E8F3EC] text-[#326B4F] px-3 py-1 rounded-full text-xs font-semibold mb-2">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Personalized 30-Day Action Plan</span>
                  </div>
                  <h3 className="text-2xl font-bold text-[#202B25]">
                    30-Day Exploration Roadmap: {topCareer.title}
                  </h3>
                  <p className="text-sm text-[#68766D] mt-1">
                    Test your interest with manageable daily tasks over 4 structured weekly milestones.
                  </p>
                </div>

                {/* Progress Circle & Reset */}
                <div className="flex items-center gap-4">
                  {(() => {
                    const completedCount = roadmapTasks.filter(t => t.completed).length;
                    const percent = Math.round((completedCount / roadmapTasks.length) * 100);

                    return (
                      <div className="flex items-center gap-3 bg-[#F4F8F5] px-4 py-3 rounded-2xl border border-[#DFE7E0]">
                        <div className="text-right">
                          <span className="text-xs text-[#68766D] font-medium block">Roadmap Progress</span>
                          <span className="text-lg font-extrabold text-[#326B4F]">{percent}% Complete</span>
                        </div>
                        <button
                          onClick={resetRoadmap}
                          className="p-2 text-[#68766D] hover:text-[#202B25] hover:bg-white rounded-lg transition-colors"
                          title="Reset Roadmap Progress"
                        >
                          <RefreshCw className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* Weekly Milestones Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[1, 2, 3, 4].map((weekNum) => {
                  const weekTasks = roadmapTasks.filter(t => t.week === weekNum);
                  const weekTitle = 
                    weekNum === 1 ? "Week 1: Explore" :
                    weekNum === 2 ? "Week 2: Learn" :
                    weekNum === 3 ? "Week 3: Practice" : "Week 4: Build & Reflect";

                  return (
                    <div key={weekNum} className="bg-[#F4F8F5] p-5 rounded-2xl border border-[#DFE7E0] space-y-4">
                      <div className="flex items-center justify-between border-b border-[#DFE7E0] pb-3">
                        <h4 className="font-bold text-base text-[#202B25]">{weekTitle}</h4>
                        <span className="text-xs text-[#68766D] font-medium">5 Tasks</span>
                      </div>

                      <div className="space-y-2.5">
                        {weekTasks.map((task) => (
                          <div
                            key={task.id}
                            onClick={() => toggleTask(task.id)}
                            className={`p-3 rounded-xl border text-xs cursor-pointer transition-all flex items-start gap-3 ${
                              task.completed 
                                ? 'bg-[#E8F3EC] border-[#76A98B] text-[#326B4F] line-through opacity-80' 
                                : 'bg-white border-[#DFE7E0] hover:border-[#76A98B] text-[#202B25]'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={task.completed}
                              onChange={() => {}}
                              className="mt-0.5 rounded text-[#438B68] focus:ring-[#438B68] cursor-pointer"
                            />
                            <div className="space-y-0.5 flex-1">
                              <span className="font-bold block">{task.title}</span>
                              <span className="text-[#68766D] block leading-snug">{task.description}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Next Action Footer */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-[#DFE7E0]">
              <div className="space-y-1 text-center sm:text-left">
                <h4 className="font-bold text-base text-[#202B25]">Need guidance on your next step?</h4>
                <p className="text-xs text-[#68766D]">Browse verified and sample academic advisors to discuss your major choices.</p>
              </div>

              <button
                onClick={() => changeStep(9)}
                className="px-6 py-3 rounded-xl bg-[#438B68] hover:bg-[#326B4F] text-white font-semibold text-sm flex items-center gap-2 transition-all shrink-0"
              >
                <Users className="w-4 h-4" />
                <span>Explore Advisor Directory</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 9: ADVISOR DIRECTORY */}
        {currentStep === 9 && (
          <div className="space-y-8 animate-fadeIn">
            {/* Directory Intro Header */}
            <div className="bg-white rounded-2xl border border-[#DFE7E0] p-6 md:p-8 shadow-sm space-y-4">
              <div>
                <span className="text-xs font-semibold uppercase tracking-wider text-[#326B4F]">Guidance Directory</span>
                <h2 className="text-2xl md:text-3xl font-extrabold text-[#202B25] mt-1">
                  Find someone who can guide your next step
                </h2>
                <p className="text-sm text-[#68766D] mt-1">
                  Explore advisors by area of expertise and contact them directly through listed contact methods.
                </p>
              </div>

              {/* Filters & Search controls */}
              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <div className="relative flex-1 w-full">
                  <Search className="w-4 h-4 text-[#68766D] absolute left-3.5 top-3" />
                  <input
                    type="text"
                    value={advisorSearch}
                    onChange={(e) => setAdvisorSearch(e.target.value)}
                    placeholder="Search advisor name or expertise..."
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-[#DFE7E0] text-sm focus:outline-none focus:border-[#438B68] bg-[#F4F8F5]"
                  />
                </div>

                <div className="flex items-center gap-1.5 w-full sm:w-auto overflow-x-auto pb-1 sm:pb-0">
                  {['all', 'business', 'it', 'design', 'general'].map((flt) => (
                    <button
                      key={flt}
                      onClick={() => setAdvisorFilter(flt)}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold capitalize whitespace-nowrap transition-all border ${
                        advisorFilter === flt
                          ? 'bg-[#438B68] text-white border-[#438B68]'
                          : 'bg-white text-[#68766D] border-[#DFE7E0] hover:bg-[#E8F3EC]'
                      }`}
                    >
                      {flt}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Advisor Profiles List */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {SAMPLE_ADVISORS
                .filter(adv => {
                  const matchesFilter = advisorFilter === 'all' || adv.field === advisorFilter;
                  const matchesSearch = adv.name.toLowerCase().includes(advisorSearch.toLowerCase()) || 
                                        adv.role.toLowerCase().includes(advisorSearch.toLowerCase()) ||
                                        adv.bio.toLowerCase().includes(advisorSearch.toLowerCase());
                  return matchesFilter && matchesSearch;
                })
                .map((adv) => (
                  <div 
                    key={adv.id}
                    className="bg-white rounded-2xl border border-[#DFE7E0] p-6 shadow-sm flex flex-col justify-between space-y-4"
                  >
                    <div className="flex items-start gap-4">
                      <img 
                        src={adv.avatar} 
                        alt={adv.name}
                        className="w-16 h-16 rounded-2xl object-cover border border-[#DFE7E0] shrink-0"
                      />
                      <div className="space-y-1">
                        <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded border ${getFieldBadgeStyle(adv.field)} uppercase`}>
                          {adv.field} Expertise
                        </span>
                        <h3 className="text-lg font-bold text-[#202B25]">{adv.name}</h3>
                        <p className="text-xs text-[#326B4F] font-semibold">{adv.role}</p>
                      </div>
                    </div>

                    <p className="text-xs text-[#68766D] leading-relaxed">
                      "{adv.bio}"
                    </p>

                    <div className="text-xs bg-[#F4F8F5] p-3 rounded-xl border border-[#DFE7E0] space-y-1">
                      <span className="font-semibold text-[#202B25] block">Qualifications & Experience:</span>
                      <span className="text-[#68766D] block">{adv.experience}</span>
                    </div>

                    <button
                      onClick={() => setContactModalAdvisor(adv)}
                      className="w-full py-2.5 rounded-xl bg-[#E8F3EC] hover:bg-[#438B68] text-[#326B4F] hover:text-white font-semibold text-xs border border-[#76A98B]/30 transition-all flex items-center justify-center gap-2"
                    >
                      <Mail className="w-4 h-4" />
                      <span>Contact Advisor ({adv.contactMethod})</span>
                    </button>
                  </div>
                ))}
            </div>
          </div>
        )}

      </main>

      {/* ==========================================
          CAREER DETAIL MODAL
      ========================================== */}
      {selectedCareerModal && (
        <div className="fixed inset-0 z-50 bg-[#202B25]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto animate-fadeIn border border-[#DFE7E0] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#DFE7E0] pb-4">
              <div>
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-md border ${getFieldBadgeStyle(selectedCareerModal.field)} uppercase`}>
                  {selectedCareerModal.field}
                </span>
                <h3 className="text-2xl font-bold text-[#202B25] mt-2">{selectedCareerModal.title}</h3>
              </div>
              <button
                onClick={() => setSelectedCareerModal(null)}
                className="text-[#68766D] hover:text-[#202B25] p-1.5 rounded-lg hover:bg-[#F4F8F5]"
              >
                ✕
              </button>
            </div>

            <p className="text-sm text-[#202B25] leading-relaxed">{selectedCareerModal.description}</p>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#202B25]">Typical Responsibilities</h4>
              <ul className="space-y-2 text-xs text-[#68766D]">
                {selectedCareerModal.responsibilities.map((resp, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <Check className="w-4 h-4 text-[#438B68] shrink-0 mt-0.5" />
                    <span>{resp}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#202B25]">Useful Skills to Develop</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCareerModal.skills.map((sk, idx) => (
                  <span key={idx} className="text-xs bg-[#E8F3EC] text-[#326B4F] px-3 py-1 rounded-lg border border-[#76A98B]/30 font-medium">
                    {sk}
                  </span>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <h4 className="font-bold text-sm text-[#202B25]">Suggested University Subjects</h4>
              <div className="flex flex-wrap gap-2">
                {selectedCareerModal.subjects.map((sub, idx) => (
                  <span key={idx} className="text-xs bg-[#F4F8F5] text-[#202B25] px-3 py-1 rounded-lg border border-[#DFE7E0]">
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#DFE7E0] flex justify-end">
              <button
                onClick={() => setSelectedCareerModal(null)}
                className="px-6 py-2.5 rounded-xl bg-[#438B68] hover:bg-[#326B4F] text-white font-semibold text-sm shadow-md"
              >
                Close Profile
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          CONTACT ADVISOR MODAL
      ========================================== */}
      {contactModalAdvisor && (
        <div className="fixed inset-0 z-50 bg-[#202B25]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-5 animate-fadeIn border border-[#DFE7E0] shadow-2xl">
            <div className="flex items-start justify-between border-b border-[#DFE7E0] pb-3">
              <h3 className="text-lg font-bold text-[#202B25]">Contact Guidance Advisor</h3>
              <button onClick={() => setContactModalAdvisor(null)} className="text-[#68766D]">✕</button>
            </div>

            <div className="space-y-2 text-center">
              <img src={contactModalAdvisor.avatar} alt={contactModalAdvisor.name} className="w-16 h-16 rounded-full mx-auto object-cover border" />
              <h4 className="font-bold text-base text-[#202B25]">{contactModalAdvisor.name}</h4>
              <p className="text-xs text-[#68766D]">{contactModalAdvisor.role}</p>
            </div>

            <div className="bg-[#E8F3EC] p-4 rounded-xl border border-[#76A98B]/30 text-xs space-y-1">
              <span className="font-semibold text-[#326B4F] block">Verified Direct Contact:</span>
              <span className="font-mono text-[#202B25] block select-all bg-white p-2 rounded border border-[#DFE7E0]">
                {contactModalAdvisor.contactValue}
              </span>
            </div>

            <p className="text-[11px] text-[#68766D] text-center">
              Note: Pathfinder direct contact connects you via standard email client. Appointments are handled directly with advisors.
            </p>

            <div className="flex items-center gap-2 pt-2">
              <a
                href={`mailto:${contactModalAdvisor.contactValue}`}
                className="w-full py-2.5 rounded-xl bg-[#438B68] text-white font-semibold text-xs text-center block shadow-md hover:bg-[#326B4F]"
              >
                Open Email Client
              </a>
              <button
                onClick={() => setContactModalAdvisor(null)}
                className="px-4 py-2.5 rounded-xl bg-white border border-[#DFE7E0] text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          RESTART CONFIRMATION MODAL
      ========================================== */}
      {showRestartConfirm && (
        <div className="fixed inset-0 z-50 bg-[#202B25]/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 space-y-4 animate-fadeIn border border-[#DFE7E0] shadow-xl text-center">
            <ShieldAlert className="w-10 h-10 text-[#D9A441] mx-auto" />
            <h3 className="text-lg font-bold text-[#202B25]">Restart Assessment?</h3>
            <p className="text-xs text-[#68766D] leading-relaxed">
              This will clear your current answers and return you to the beginning of Pathfinder.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setShowRestartConfirm(false)}
                className="w-1/2 py-2.5 rounded-xl bg-white border border-[#DFE7E0] text-xs font-semibold text-[#68766D] hover:bg-[#F4F8F5]"
              >
                Cancel
              </button>
              <button
                onClick={handleResetProgress}
                className="w-1/2 py-2.5 rounded-xl bg-[#438B68] text-white text-xs font-semibold hover:bg-[#326B4F] shadow-md"
              >
                Yes, Restart
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==========================================
          FOOTER
      ========================================== */}
      <footer className="mt-auto border-t border-[#DFE7E0] bg-white py-6 px-4 md:px-8 text-center text-xs text-[#68766D]">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Compass className="w-4 h-4 text-[#438B68]" />
            <span className="font-bold text-[#202B25]">Pathfinder</span>
            <span>— Find your direction. Explore your future.</span>
          </div>

          <p>© 2026 Pathfinder. Designed for student career discovery.</p>
        </div>
      </footer>

    </div>
  );
}