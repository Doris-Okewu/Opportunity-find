import type { ExperienceLevel } from '../../types/opportunity';
import type { CareerPathSlug, LearningResource } from './types';

export interface CareerLevelContent {
  skills: string[];
  resources: LearningResource[];
}

// One explanation per experience level, parameterized by career label so it
// reads as career-specific without needing 32 hand-written variants.
const LEVEL_EXPLANATIONS: Record<ExperienceLevel, (careerLabel: string) => string> = {
  student: (careerLabel) =>
    `As a student exploring ${careerLabel}, start with foundations and core concepts. Use beginner-friendly tools and guided practice to ship a few small first projects before worrying about production polish.`,
  entry: (careerLabel) =>
    `At the Entry Level stage, focus on turning your ${careerLabel} foundations into production-ready projects and evidence employers can evaluate — common workplace tools and portfolio readiness matter most now.`,
  intermediate: (careerLabel) =>
    `At the Intermediate stage, go deeper into ${careerLabel} architecture, testing, and performance. This is where you take ownership of larger production work and sharpen collaboration workflows.`,
  senior: (careerLabel) =>
    `At the Senior stage, ${careerLabel} is less about individual output and more about system-level thinking, strategy, mentoring, and cross-functional influence — your decisions shape how others work.`,
};

export function getLevelExplanation(careerLabel: string, level: ExperienceLevel): string {
  return LEVEL_EXPLANATIONS[level](careerLabel);
}

// Fully-specified so TypeScript enforces every (career path × experience
// level) combination exists at compile time — the "test" for completeness is
// `tsc -b` rather than a separate test framework. getCareerLevelContent()
// still guards the lookup defensively at runtime, since profiles loaded from
// localStorage aren't type-checked and could carry a stale/unknown value.
const CAREER_LEVEL_CONTENT: Record<CareerPathSlug, Record<ExperienceLevel, CareerLevelContent>> = {
  frontend: {
    student: {
      skills: [
        'HTML & CSS Fundamentals',
        'JavaScript Basics',
        'Git & GitHub Basics',
        'Intro to React',
        'Building Simple Static Pages',
      ],
      resources: [
        { title: 'The Odin Project — Full Stack JavaScript', url: 'https://www.theodinproject.com/', provider: 'The Odin Project' },
        { title: 'freeCodeCamp — Responsive Web Design', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', provider: 'freeCodeCamp' },
        { title: 'JavaScript.info', url: 'https://javascript.info/', provider: 'javascript.info' },
      ],
    },
    entry: {
      skills: [
        'React Component Patterns',
        'TypeScript Fundamentals',
        'Responsive & Accessible UI',
        'Consuming REST APIs',
        'Browser DevTools & Debugging',
        'Shipping a Deployed Portfolio Project',
      ],
      resources: [
        { title: 'React Documentation', url: 'https://react.dev/learn', provider: 'react.dev' },
        { title: 'MDN Web Docs', url: 'https://developer.mozilla.org/', provider: 'MDN' },
        { title: 'freeCodeCamp — Responsive Web Design', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', provider: 'freeCodeCamp' },
      ],
    },
    intermediate: {
      skills: [
        'Frontend Architecture & State Management',
        'Automated Testing (Jest / Testing Library)',
        'Performance Optimization',
        'Build Tooling & Bundlers',
        'Code Review & Git Workflows',
        'Contributing to a Design System',
      ],
      resources: [
        { title: 'Patterns.dev — Modern Web App Patterns', url: 'https://www.patterns.dev/', provider: 'patterns.dev' },
        { title: 'Testing Library Documentation', url: 'https://testing-library.com/docs/', provider: 'Testing Library' },
        { title: 'web.dev — Performance', url: 'https://web.dev/learn/performance', provider: 'web.dev' },
      ],
    },
    senior: {
      skills: [
        'Frontend Architecture & Design System Strategy',
        'Cross-Team Technical Leadership',
        'Performance & Scalability at Organization Scale',
        'Mentoring & Setting Code Standards',
        'Accessibility Governance',
        'Build vs. Buy Technology Decisions',
      ],
      resources: [
        { title: "Martin Fowler's Articles", url: 'https://martinfowler.com/', provider: 'martinfowler.com' },
        { title: 'Patterns.dev — Modern Web App Patterns', url: 'https://www.patterns.dev/', provider: 'patterns.dev' },
        { title: 'StaffEng — Staff+ Engineering Guidance', url: 'https://staffeng.com/', provider: 'StaffEng' },
      ],
    },
  },

  backend: {
    student: {
      skills: [
        'Programming Fundamentals (Python or JavaScript)',
        'Basic SQL',
        'Git & GitHub Basics',
        'Intro to REST APIs',
        'Command Line Basics',
      ],
      resources: [
        { title: 'freeCodeCamp — Back End Development', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/', provider: 'freeCodeCamp' },
        { title: 'Node.js Official Guides', url: 'https://nodejs.org/en/learn', provider: 'nodejs.org' },
        { title: 'Postgres Tutorial', url: 'https://www.postgresqltutorial.com/', provider: 'PostgreSQL Tutorial' },
      ],
    },
    entry: {
      skills: [
        'REST API Design',
        'Relational Databases in Practice',
        'Authentication & Authorization Basics',
        'Error Handling & Logging',
        'Deploying a Simple Service',
        'Writing Unit Tests',
      ],
      resources: [
        { title: 'Node.js Official Guides', url: 'https://nodejs.org/en/learn', provider: 'nodejs.org' },
        { title: 'Postgres Tutorial', url: 'https://www.postgresqltutorial.com/', provider: 'PostgreSQL Tutorial' },
        { title: 'Roadmap.sh — Backend Roadmap', url: 'https://roadmap.sh/backend', provider: 'roadmap.sh' },
      ],
    },
    intermediate: {
      skills: [
        'System Design Fundamentals',
        'Database Performance & Indexing',
        'Caching Strategies',
        'Message Queues & Async Processing',
        'API Versioning & Contracts',
        'CI Pipelines & Automated Testing',
      ],
      resources: [
        { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', provider: 'GitHub' },
        { title: 'Roadmap.sh — Backend Roadmap', url: 'https://roadmap.sh/backend', provider: 'roadmap.sh' },
        { title: "Martin Fowler's Articles", url: 'https://martinfowler.com/', provider: 'martinfowler.com' },
      ],
    },
    senior: {
      skills: [
        'Distributed Systems Architecture',
        'Scalability & Reliability Engineering',
        'Observability & Service-Level Objectives',
        'Technical Leadership & Mentoring',
        'Cross-Team API Governance',
        'Incident Response Leadership',
      ],
      resources: [
        { title: 'System Design Primer', url: 'https://github.com/donnemartin/system-design-primer', provider: 'GitHub' },
        { title: 'Google — Site Reliability Engineering Book', url: 'https://sre.google/sre-book/table-of-contents/', provider: 'Google SRE' },
        { title: 'High Scalability', url: 'http://highscalability.com/', provider: 'High Scalability' },
      ],
    },
  },

  data: {
    student: {
      skills: [
        'Excel / Google Sheets Fundamentals',
        'Intro to SQL',
        'Basic Statistics',
        'Data Visualization Basics',
        'Guided Analysis Exercises',
      ],
      resources: [
        { title: 'Kaggle — Free Micro-Courses', url: 'https://www.kaggle.com/learn', provider: 'Kaggle' },
        { title: 'Mode — SQL Tutorial', url: 'https://mode.com/sql-tutorial/', provider: 'Mode' },
        { title: 'freeCodeCamp — Data Analysis with Python', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', provider: 'freeCodeCamp' },
      ],
    },
    entry: {
      skills: [
        'SQL for Reporting',
        'Python for Data Wrangling (pandas)',
        'Dashboarding (Power BI / Looker Studio)',
        'Data Cleaning',
        'Communicating Insights',
        'First Portfolio Analysis Project',
      ],
      resources: [
        { title: 'Mode — SQL Tutorial', url: 'https://mode.com/sql-tutorial/', provider: 'Mode' },
        { title: 'Google Data Analytics Certificate', url: 'https://grow.google/certificates/data-analytics/', provider: 'Google' },
        { title: 'freeCodeCamp — Data Analysis with Python', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', provider: 'freeCodeCamp' },
      ],
    },
    intermediate: {
      skills: [
        'Statistical Modeling',
        'ETL Pipeline Design',
        'A/B Testing & Experimentation',
        'Data Warehousing Concepts',
        'Query Performance Tuning',
        'Stakeholder Reporting',
      ],
      resources: [
        { title: 'Kaggle — Free Micro-Courses', url: 'https://www.kaggle.com/learn', provider: 'Kaggle' },
        { title: 'Mode — Analytics Blog', url: 'https://mode.com/blog/', provider: 'Mode' },
        { title: 'Google Data Analytics Certificate', url: 'https://grow.google/certificates/data-analytics/', provider: 'Google' },
      ],
    },
    senior: {
      skills: [
        'Data Strategy & Architecture',
        'Advanced Experimentation Design',
        'Data Governance & Quality Standards',
        'Leading Analytics Roadmaps',
        'Mentoring Analysts',
        'Influencing Executive Decisions',
      ],
      resources: [
        { title: 'Mode — Analytics Blog', url: 'https://mode.com/blog/', provider: 'Mode' },
        { title: 'Kaggle — Free Micro-Courses', url: 'https://www.kaggle.com/learn', provider: 'Kaggle' },
        { title: 'Google Data Analytics Certificate', url: 'https://grow.google/certificates/data-analytics/', provider: 'Google' },
      ],
    },
  },

  design: {
    student: {
      skills: [
        'Design Fundamentals (Color, Type, Layout)',
        'Figma Basics',
        'Guided UI Exercises',
        'Basic User Research',
      ],
      resources: [
        { title: 'Figma — Learn Design', url: 'https://www.figma.com/resources/learn-design/', provider: 'Figma' },
        { title: 'Google UX Design Certificate', url: 'https://grow.google/certificates/ux-design/', provider: 'Google' },
        { title: 'Laws of UX', url: 'https://lawsofux.com/', provider: 'Laws of UX' },
      ],
    },
    entry: {
      skills: [
        'Wireframing & Prototyping',
        'Usability Testing Basics',
        'Using Design Systems',
        'Portfolio Case Studies',
        'Developer Handoff Basics',
      ],
      resources: [
        { title: 'Figma — Learn Design', url: 'https://www.figma.com/resources/learn-design/', provider: 'Figma' },
        { title: 'Google UX Design Certificate', url: 'https://grow.google/certificates/ux-design/', provider: 'Google' },
        { title: 'Nielsen Norman Group Articles', url: 'https://www.nngroup.com/articles/', provider: 'NN/g' },
      ],
    },
    intermediate: {
      skills: [
        'End-to-End Product Design Process',
        'Design System Ownership',
        'Advanced User Research Methods',
        'Interaction & Motion Design',
        'Cross-Functional Collaboration',
        'Facilitating Design Critique',
      ],
      resources: [
        { title: 'Nielsen Norman Group Articles', url: 'https://www.nngroup.com/articles/', provider: 'NN/g' },
        { title: 'Interaction Design Foundation', url: 'https://www.interaction-design.org/', provider: 'IxDF' },
        { title: 'Laws of UX', url: 'https://lawsofux.com/', provider: 'Laws of UX' },
      ],
    },
    senior: {
      skills: [
        'Design Strategy & Vision',
        'Design Systems Governance',
        'Leading Research Programs',
        'Mentoring Designers',
        'Influencing Product Roadmaps',
        'Executive Stakeholder Communication',
      ],
      resources: [
        { title: 'Nielsen Norman Group Articles', url: 'https://www.nngroup.com/articles/', provider: 'NN/g' },
        { title: 'Interaction Design Foundation', url: 'https://www.interaction-design.org/', provider: 'IxDF' },
        { title: 'SVPG — Articles on Product & Design Leadership', url: 'https://www.svpg.com/articles/', provider: 'SVPG' },
      ],
    },
  },

  product: {
    student: {
      skills: [
        'Product Thinking Basics',
        'Basic Market & User Research',
        'Writing Simple Feature Specs',
        'Guided Case Studies',
      ],
      resources: [
        { title: 'Product School — Free Resources', url: 'https://productschool.com/free-product-management-resources', provider: 'Product School' },
        { title: "Google's Project Management Certificate", url: 'https://grow.google/certificates/project-management/', provider: 'Google' },
        { title: 'Reforge Blog', url: 'https://www.reforge.com/blog', provider: 'Reforge' },
      ],
    },
    entry: {
      skills: [
        'Writing PRDs',
        'Roadmapping Basics',
        'Stakeholder Communication',
        'Agile / Scrum Fundamentals',
        'Reading Product Metrics',
        'Owning a First Feature',
      ],
      resources: [
        { title: 'Product School — Free Resources', url: 'https://productschool.com/free-product-management-resources', provider: 'Product School' },
        { title: 'Reforge Blog', url: 'https://www.reforge.com/blog', provider: 'Reforge' },
        { title: "Google's Project Management Certificate", url: 'https://grow.google/certificates/project-management/', provider: 'Google' },
      ],
    },
    intermediate: {
      skills: [
        'Prioritization Frameworks',
        'Cross-Functional Leadership',
        'A/B Testing & Experimentation',
        'Go-to-Market Planning',
        'Data-Informed Decision Making',
        'Owning a Product Area',
      ],
      resources: [
        { title: 'Reforge Blog', url: 'https://www.reforge.com/blog', provider: 'Reforge' },
        { title: 'Product Talk — Continuous Discovery', url: 'https://www.producttalk.org/', provider: 'Product Talk' },
        { title: 'SVPG — Articles', url: 'https://www.svpg.com/articles/', provider: 'SVPG' },
      ],
    },
    senior: {
      skills: [
        'Product Vision & Strategy',
        'Portfolio-Level Roadmapping',
        'Organizational Influence',
        'Mentoring Product Managers',
        'Executive Stakeholder Management',
        'Business Case & Outcome Ownership',
      ],
      resources: [
        { title: 'SVPG — Articles', url: 'https://www.svpg.com/articles/', provider: 'SVPG' },
        { title: 'Product Talk — Continuous Discovery', url: 'https://www.producttalk.org/', provider: 'Product Talk' },
        { title: "Lenny's Newsletter", url: 'https://www.lennysnewsletter.com/', provider: "Lenny's Newsletter" },
      ],
    },
  },

  marketing: {
    student: {
      skills: [
        'Marketing Fundamentals',
        'Social Media Basics',
        'Basic Copywriting',
        'Guided Campaign Exercises',
      ],
      resources: [
        { title: 'Google Digital Garage', url: 'https://learndigital.withgoogle.com/digitalgarage', provider: 'Google' },
        { title: 'HubSpot Academy', url: 'https://academy.hubspot.com/', provider: 'HubSpot' },
        { title: 'Moz — SEO Learning Center', url: 'https://moz.com/learn/seo', provider: 'Moz' },
      ],
    },
    entry: {
      skills: [
        'SEO Fundamentals',
        'Content Strategy Execution',
        'Running Basic Paid Campaigns',
        'Email Marketing',
        'Reading Google Analytics Reports',
        'First Campaign Portfolio',
      ],
      resources: [
        { title: 'HubSpot Academy', url: 'https://academy.hubspot.com/', provider: 'HubSpot' },
        { title: 'Moz — SEO Learning Center', url: 'https://moz.com/learn/seo', provider: 'Moz' },
        { title: 'Google Digital Garage', url: 'https://learndigital.withgoogle.com/digitalgarage', provider: 'Google' },
      ],
    },
    intermediate: {
      skills: [
        'Growth Experimentation',
        'Funnel Optimization',
        'Marketing Automation',
        'Multi-Channel Campaign Strategy',
        'Budget & ROI Analysis',
        'Cross-Functional Collaboration',
      ],
      resources: [
        { title: 'CXL — Conversion & Growth Blog', url: 'https://cxl.com/blog/', provider: 'CXL' },
        { title: 'HubSpot Academy', url: 'https://academy.hubspot.com/', provider: 'HubSpot' },
        { title: 'Reforge Blog', url: 'https://www.reforge.com/blog', provider: 'Reforge' },
      ],
    },
    senior: {
      skills: [
        'Growth Strategy & Planning',
        'Brand & Positioning Leadership',
        'Marketing Team Leadership',
        'Budget Ownership & Forecasting',
        'Executive Reporting',
        'Mentoring Marketers',
      ],
      resources: [
        { title: 'CXL — Conversion & Growth Blog', url: 'https://cxl.com/blog/', provider: 'CXL' },
        { title: 'Reforge Blog', url: 'https://www.reforge.com/blog', provider: 'Reforge' },
        { title: "Lenny's Newsletter", url: 'https://www.lennysnewsletter.com/', provider: "Lenny's Newsletter" },
      ],
    },
  },

  cybersecurity: {
    student: {
      skills: [
        'Networking Fundamentals',
        'Security Fundamentals',
        'Linux Basics',
        'Guided CTF Exercises',
      ],
      resources: [
        { title: 'TryHackMe — Intro to Cyber Security', url: 'https://tryhackme.com/path/outline/cybersecurity101', provider: 'TryHackMe' },
        { title: 'Google Cybersecurity Certificate', url: 'https://grow.google/certificates/cybersecurity/', provider: 'Google' },
        { title: 'Cybrary Free Courses', url: 'https://www.cybrary.it/', provider: 'Cybrary' },
      ],
    },
    entry: {
      skills: [
        'Vulnerability Assessment',
        'SIEM & Log Monitoring Basics',
        'Security Incident Handling Basics',
        'Compliance Fundamentals',
        'Hands-On Labs & Certifications',
        'First Security Portfolio Project',
      ],
      resources: [
        { title: 'TryHackMe — Intro to Cyber Security', url: 'https://tryhackme.com/path/outline/cybersecurity101', provider: 'TryHackMe' },
        { title: 'Google Cybersecurity Certificate', url: 'https://grow.google/certificates/cybersecurity/', provider: 'Google' },
        { title: 'OWASP Top Ten', url: 'https://owasp.org/www-project-top-ten/', provider: 'OWASP' },
      ],
    },
    intermediate: {
      skills: [
        'Penetration Testing',
        'Threat Modeling',
        'Security Architecture Review',
        'Incident Response Ownership',
        'Cloud Security Fundamentals',
        'Cross-Team Security Collaboration',
      ],
      resources: [
        { title: 'OWASP Top Ten', url: 'https://owasp.org/www-project-top-ten/', provider: 'OWASP' },
        { title: 'SANS Institute', url: 'https://www.sans.org/', provider: 'SANS' },
        { title: 'Cybrary Free Courses', url: 'https://www.cybrary.it/', provider: 'Cybrary' },
      ],
    },
    senior: {
      skills: [
        'Security Strategy & Risk Management',
        'Security Architecture Leadership',
        'Governance, Risk & Compliance (GRC)',
        'Leading Incident Response',
        'Mentoring Security Engineers',
        'Executive Security Reporting',
      ],
      resources: [
        { title: 'NIST Cybersecurity Framework', url: 'https://www.nist.gov/cyberframework', provider: 'NIST' },
        { title: 'SANS Institute', url: 'https://www.sans.org/', provider: 'SANS' },
        { title: 'OWASP Top Ten', url: 'https://owasp.org/www-project-top-ten/', provider: 'OWASP' },
      ],
    },
  },

  devops: {
    student: {
      skills: [
        'Linux Fundamentals',
        'Command Line & Scripting Basics',
        'Git Basics',
        'Intro to Cloud Concepts',
      ],
      resources: [
        { title: 'AWS Skill Builder — Free Digital Training', url: 'https://skillbuilder.aws/', provider: 'AWS' },
        { title: 'Docker — Getting Started', url: 'https://docs.docker.com/get-started/', provider: 'Docker' },
        { title: 'Roadmap.sh — DevOps Roadmap', url: 'https://roadmap.sh/devops', provider: 'roadmap.sh' },
      ],
    },
    entry: {
      skills: [
        'CI/CD Pipeline Basics',
        'Docker Fundamentals',
        'Cloud Fundamentals (AWS / Azure / GCP)',
        'Infrastructure Basics',
        'Monitoring & Logging Basics',
        'First Deployed Project',
      ],
      resources: [
        { title: 'Docker — Getting Started', url: 'https://docs.docker.com/get-started/', provider: 'Docker' },
        { title: 'AWS Skill Builder — Free Digital Training', url: 'https://skillbuilder.aws/', provider: 'AWS' },
        { title: 'Roadmap.sh — DevOps Roadmap', url: 'https://roadmap.sh/devops', provider: 'roadmap.sh' },
      ],
    },
    intermediate: {
      skills: [
        'Kubernetes in Practice',
        'Infrastructure as Code (Terraform)',
        'Advanced CI/CD Pipelines',
        'Observability & Alerting',
        'Cost Optimization',
        'Cross-Team Release Ownership',
      ],
      resources: [
        { title: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/home/', provider: 'kubernetes.io' },
        { title: 'Terraform Documentation', url: 'https://developer.hashicorp.com/terraform/docs', provider: 'HashiCorp' },
        { title: 'AWS Skill Builder — Free Digital Training', url: 'https://skillbuilder.aws/', provider: 'AWS' },
      ],
    },
    senior: {
      skills: [
        'Cloud & Platform Architecture',
        'Site Reliability Engineering Strategy',
        'Infrastructure Governance',
        'Leading Incident Response & Postmortems',
        'Mentoring Platform Engineers',
        'Cross-Org Platform Standards',
      ],
      resources: [
        { title: 'Google — Site Reliability Engineering Book', url: 'https://sre.google/sre-book/table-of-contents/', provider: 'Google SRE' },
        { title: 'AWS Well-Architected Framework', url: 'https://aws.amazon.com/architecture/well-architected/', provider: 'AWS' },
        { title: 'Kubernetes Documentation', url: 'https://kubernetes.io/docs/home/', provider: 'kubernetes.io' },
      ],
    },
  },
};

/**
 * Returns level-specific content for a career path, or undefined if the
 * combination isn't in the table (e.g. a stale localStorage profile from
 * before this table existed, or an unrecognized slug/level value read from
 * storage). Callers should fall back to the career path's base content.
 */
export function getCareerLevelContent(
  slug: CareerPathSlug,
  level: ExperienceLevel,
): CareerLevelContent | undefined {
  return CAREER_LEVEL_CONTENT[slug]?.[level];
}
