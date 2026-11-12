import { CAREER_CATEGORY_LABELS } from './types';
import type { CareerCategory, CareerPath, CareerPathSlug } from './types';

const UNORDERED_PATHS: CareerPath[] = [
  {
    slug: 'frontend',
    category: 'software',
    label: 'Frontend Development',
    description: 'Build the interfaces people use every day — web apps, dashboards, and websites.',
    skills: ['HTML & CSS', 'JavaScript', 'React', 'TypeScript', 'Responsive Design', 'Git & GitHub'],
    resources: [
      { title: 'The Odin Project — Full Stack JavaScript', url: 'https://www.theodinproject.com/', provider: 'The Odin Project' },
      { title: 'React Documentation', url: 'https://react.dev/learn', provider: 'react.dev' },
      { title: 'freeCodeCamp — Responsive Web Design', url: 'https://www.freecodecamp.org/learn/2022/responsive-web-design/', provider: 'freeCodeCamp' },
      { title: 'JavaScript.info', url: 'https://javascript.info/', provider: 'javascript.info' },
    ],
  },
  {
    slug: 'backend',
    category: 'software',
    label: 'Backend Development',
    description: 'Design the servers, APIs, and databases that power applications behind the scenes.',
    skills: ['Node.js or Python', 'SQL & Databases', 'REST APIs', 'Authentication', 'System Design Basics', 'Git & GitHub'],
    resources: [
      { title: 'freeCodeCamp — Back End Development', url: 'https://www.freecodecamp.org/learn/back-end-development-and-apis/', provider: 'freeCodeCamp' },
      { title: 'Node.js Official Guides', url: 'https://nodejs.org/en/learn', provider: 'nodejs.org' },
      { title: 'Postgres Tutorial', url: 'https://www.postgresqltutorial.com/', provider: 'PostgreSQL Tutorial' },
      { title: 'Roadmap.sh — Backend Roadmap', url: 'https://roadmap.sh/backend', provider: 'roadmap.sh' },
    ],
  },
  {
    slug: 'data',
    category: 'data',
    label: 'Data Analysis',
    description: 'Turn raw data into insight using SQL, Python, and visualization tools.',
    skills: ['SQL', 'Excel / Google Sheets', 'Python for Data', 'Data Visualization', 'Statistics Basics'],
    resources: [
      { title: 'Kaggle — Free Micro-Courses', url: 'https://www.kaggle.com/learn', provider: 'Kaggle' },
      { title: 'Mode — SQL Tutorial', url: 'https://mode.com/sql-tutorial/', provider: 'Mode' },
      { title: 'freeCodeCamp — Data Analysis with Python', url: 'https://www.freecodecamp.org/learn/data-analysis-with-python/', provider: 'freeCodeCamp' },
      { title: 'Google Data Analytics Certificate', url: 'https://grow.google/certificates/data-analytics/', provider: 'Google' },
    ],
  },
  {
    slug: 'design',
    category: 'design-product',
    label: 'UI/UX Design',
    description: 'Research users, wireframe and design usable, accessible interfaces for apps and websites.',
    skills: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Design Systems'],
    resources: [
      { title: 'Figma — Learn Design', url: 'https://www.figma.com/resources/learn-design/', provider: 'Figma' },
      { title: 'Google UX Design Certificate', url: 'https://grow.google/certificates/ux-design/', provider: 'Google' },
      { title: 'Laws of UX', url: 'https://lawsofux.com/', provider: 'Laws of UX' },
      { title: 'Nielsen Norman Group Articles', url: 'https://www.nngroup.com/articles/', provider: 'NN/g' },
    ],
  },
  {
    slug: 'product',
    category: 'design-product',
    label: 'Product Management',
    description: 'Define what gets built and why — bridging users, design, and engineering.',
    skills: ['Product Strategy', 'Roadmapping', 'User Research', 'Analytics', 'Stakeholder Communication'],
    resources: [
      { title: 'Product School — Free Resources', url: 'https://productschool.com/free-product-management-resources', provider: 'Product School' },
      { title: 'Reforge Blog', url: 'https://www.reforge.com/blog', provider: 'Reforge' },
      { title: "Google's Foundations of Product Management", url: 'https://grow.google/certificates/project-management/', provider: 'Google' },
    ],
  },
  {
    slug: 'marketing',
    category: 'other',
    label: 'Digital Marketing',
    description: 'Grow audiences and revenue through content, SEO, and data-driven campaigns.',
    skills: ['SEO', 'Content Strategy', 'Social Media Marketing', 'Google Analytics', 'Copywriting'],
    resources: [
      { title: 'Google Digital Garage', url: 'https://learndigital.withgoogle.com/digitalgarage', provider: 'Google' },
      { title: 'HubSpot Academy', url: 'https://academy.hubspot.com/', provider: 'HubSpot' },
      { title: 'Moz — SEO Learning Center', url: 'https://moz.com/learn/seo', provider: 'Moz' },
    ],
  },
  {
    slug: 'cybersecurity',
    category: 'infrastructure',
    label: 'Cybersecurity',
    description: 'Protect systems and data through security fundamentals and ethical hacking.',
    skills: ['Networking Fundamentals', 'Security Fundamentals', 'Linux', 'Ethical Hacking Basics', 'SIEM Tools'],
    resources: [
      { title: 'TryHackMe — Intro to Cyber Security', url: 'https://tryhackme.com/path/outline/cybersecurity101', provider: 'TryHackMe' },
      { title: 'Google Cybersecurity Certificate', url: 'https://grow.google/certificates/cybersecurity/', provider: 'Google' },
      { title: 'Cybrary Free Courses', url: 'https://www.cybrary.it/', provider: 'Cybrary' },
    ],
  },
  {
    slug: 'devops',
    category: 'infrastructure',
    label: 'DevOps / Site Reliability Engineering',
    description: 'Automate deployments and keep production systems reliable with CI/CD, containers and monitoring.',
    skills: ['Linux', 'Docker', 'CI/CD', 'Cloud Fundamentals (AWS/Azure)', 'Kubernetes Basics'],
    resources: [
      { title: 'AWS Skill Builder — Free Digital Training', url: 'https://skillbuilder.aws/', provider: 'AWS' },
      { title: 'Docker — Getting Started', url: 'https://docs.docker.com/get-started/', provider: 'Docker' },
      { title: 'Roadmap.sh — DevOps Roadmap', url: 'https://roadmap.sh/devops', provider: 'roadmap.sh' },
    ],
  },
  // ── Software development ──────────────────────────────────────────────
  {
    slug: 'fullstack',
    category: 'software',
    label: 'Full-stack Development',
    description: 'Build complete web applications — user interface, server, database and deployment.',
    skills: ['JavaScript / TypeScript', 'React or similar', 'Node.js or Python', 'SQL & Databases', 'REST APIs', 'Git & GitHub'],
    resources: [
      { title: 'Full Stack Open', url: 'https://fullstackopen.com/en/', provider: 'University of Helsinki' },
      { title: 'The Odin Project — Full Stack JavaScript', url: 'https://www.theodinproject.com/', provider: 'The Odin Project' },
    ],
  },
  {
    slug: 'software-engineering',
    category: 'software',
    label: 'Software Engineering',
    description: 'Apply computer-science fundamentals to design, build, test and maintain software systems.',
    skills: ['Data Structures & Algorithms', 'A General-purpose Language', 'Testing', 'Version Control (Git)', 'System Design Basics'],
    resources: [
      { title: 'CS50x — Introduction to Computer Science', url: 'https://cs50.harvard.edu/x/', provider: 'Harvard' },
      { title: 'Teach Yourself Computer Science', url: 'https://teachyourselfcs.com/', provider: 'teachyourselfcs.com' },
    ],
  },
  {
    slug: 'mobile',
    category: 'software',
    label: 'Mobile App Development',
    description: 'Build Android and iOS apps, natively or with cross-platform frameworks.',
    skills: ['Kotlin or Swift', 'Flutter or React Native', 'Mobile UI Patterns', 'REST APIs', 'App Store Publishing'],
    resources: [
      { title: 'Android Basics with Compose', url: 'https://developer.android.com/courses/android-basics-compose/course', provider: 'Google' },
      { title: 'Flutter Documentation', url: 'https://docs.flutter.dev/', provider: 'flutter.dev' },
      { title: 'React Native — Get Started', url: 'https://reactnative.dev/docs/getting-started', provider: 'reactnative.dev' },
    ],
  },
  {
    slug: 'golang',
    category: 'software',
    label: 'Go/Golang Development',
    description: 'Build fast, concurrent backend services and tooling with the Go language.',
    skills: ['Go', 'Concurrency (goroutines, channels)', 'REST/gRPC APIs', 'SQL & Databases', 'Testing in Go'],
    resources: [
      { title: 'A Tour of Go', url: 'https://go.dev/tour/', provider: 'go.dev' },
      { title: 'Go by Example', url: 'https://gobyexample.com/', provider: 'gobyexample.com' },
    ],
  },
  // ── Data and AI ───────────────────────────────────────────────────────
  {
    slug: 'data-science',
    category: 'data',
    label: 'Data Science',
    description: 'Use statistics, Python and machine learning to model data and answer questions.',
    skills: ['Python (pandas, NumPy)', 'Statistics', 'Machine Learning Basics', 'SQL', 'Data Visualization'],
    resources: [
      { title: 'Kaggle — Free Micro-Courses', url: 'https://www.kaggle.com/learn', provider: 'Kaggle' },
      { title: 'freeCodeCamp — Machine Learning with Python', url: 'https://www.freecodecamp.org/learn/machine-learning-with-python/', provider: 'freeCodeCamp' },
    ],
  },
  {
    slug: 'ai-ml',
    category: 'data',
    label: 'Artificial Intelligence / Machine Learning',
    description: 'Build, train and deploy machine-learning and AI models.',
    skills: ['Python', 'Linear Algebra & Probability', 'scikit-learn', 'Deep Learning (PyTorch/TensorFlow)', 'Model Evaluation'],
    resources: [
      { title: 'Machine Learning Crash Course', url: 'https://developers.google.com/machine-learning/crash-course', provider: 'Google' },
      { title: 'Practical Deep Learning for Coders', url: 'https://course.fast.ai/', provider: 'fast.ai' },
    ],
  },
  {
    slug: 'data-engineering',
    category: 'data',
    label: 'Data Engineering',
    description: 'Design the pipelines and warehouses that move and prepare data for analysis.',
    skills: ['SQL', 'Python', 'ETL / ELT Pipelines', 'Data Warehousing', 'Workflow Orchestration'],
    resources: [
      { title: 'Data Engineering Zoomcamp', url: 'https://github.com/DataTalksClub/data-engineering-zoomcamp', provider: 'DataTalksClub' },
      { title: 'Postgres Tutorial', url: 'https://www.postgresqltutorial.com/', provider: 'PostgreSQL Tutorial' },
    ],
  },
  // ── Cybersecurity and infrastructure ──────────────────────────────────
  {
    slug: 'cloud',
    category: 'infrastructure',
    label: 'Cloud Computing',
    description: 'Design and run applications on cloud platforms such as AWS, Azure and Google Cloud.',
    skills: ['Cloud Fundamentals (AWS/Azure/GCP)', 'Linux', 'Networking Basics', 'Identity & Access Management', 'Infrastructure as Code'],
    resources: [
      { title: 'AWS Skill Builder — Free Digital Training', url: 'https://skillbuilder.aws/', provider: 'AWS' },
      { title: 'Microsoft Learn — Azure Training', url: 'https://learn.microsoft.com/en-us/training/azure/', provider: 'Microsoft' },
      { title: 'Google Cloud Skills Boost', url: 'https://www.cloudskillsboost.google/', provider: 'Google Cloud' },
    ],
  },
  {
    slug: 'it-support',
    category: 'infrastructure',
    label: 'IT Support',
    description: 'Help people and organisations keep their devices, accounts and systems working.',
    skills: ['Troubleshooting', 'Operating Systems (Windows, macOS, Linux)', 'Networking Basics', 'Customer Service', 'Ticketing Systems'],
    resources: [
      { title: 'Google IT Support Certificate', url: 'https://grow.google/certificates/it-support/', provider: 'Google' },
      { title: 'Professor Messer — CompTIA Training', url: 'https://www.professormesser.com/', provider: 'Professor Messer' },
    ],
  },
  {
    slug: 'sysadmin',
    category: 'infrastructure',
    label: 'Systems Administration',
    description: 'Install, configure and maintain servers, users and core infrastructure.',
    skills: ['Linux Administration', 'Windows Server', 'Shell Scripting', 'Backups & Monitoring', 'Networking Basics'],
    resources: [
      { title: 'Linux Upskill Challenge', url: 'https://linuxupskillchallenge.org/', provider: 'linuxupskillchallenge.org' },
      { title: 'Linux Journey', url: 'https://linuxjourney.com/', provider: 'linuxjourney.com' },
    ],
  },
  {
    slug: 'networking',
    category: 'infrastructure',
    label: 'Networking',
    description: 'Design, configure and troubleshoot the networks that connect organisations.',
    skills: ['TCP/IP & OSI Model', 'Routing & Switching', 'Subnetting', 'Network Security Basics', 'Troubleshooting'],
    resources: [
      { title: 'Cisco Networking Academy', url: 'https://www.netacad.com/', provider: 'Cisco' },
      { title: 'Professor Messer — CompTIA Network+', url: 'https://www.professormesser.com/', provider: 'Professor Messer' },
    ],
  },
  // ── Design and product ────────────────────────────────────────────────
  {
    slug: 'product-design',
    category: 'design-product',
    label: 'Product Design',
    description: 'Shape whole products end to end — problem framing, user flows, interaction and visual design.',
    skills: ['Figma', 'Product Thinking', 'User Flows & Interaction Design', 'Prototyping & Testing', 'Design Systems'],
    resources: [
      { title: 'Figma — Learn Design', url: 'https://www.figma.com/resources/learn-design/', provider: 'Figma' },
      { title: 'Nielsen Norman Group Articles', url: 'https://www.nngroup.com/articles/', provider: 'NN/g' },
    ],
  },
  {
    slug: 'qa',
    category: 'design-product',
    label: 'Quality Assurance / Software Testing',
    description: 'Make sure software works as intended through manual and automated testing.',
    skills: ['Test Case Design', 'Manual Testing', 'Test Automation (Playwright/Selenium)', 'Bug Reporting', 'API Testing'],
    resources: [
      { title: 'Ministry of Testing', url: 'https://www.ministryoftesting.com/', provider: 'Ministry of Testing' },
      { title: 'Playwright — Getting Started', url: 'https://playwright.dev/docs/intro', provider: 'playwright.dev' },
    ],
  },
  // ── Other technology fields ───────────────────────────────────────────
  {
    slug: 'blockchain',
    category: 'other',
    label: 'Blockchain Development',
    description: 'Build smart contracts and decentralised applications.',
    skills: ['Solidity', 'Ethereum Fundamentals', 'JavaScript / TypeScript', 'Smart-contract Security', 'Web3 Libraries'],
    resources: [
      { title: 'Ethereum Developer Docs', url: 'https://ethereum.org/en/developers/docs/', provider: 'ethereum.org' },
      { title: 'Solidity Documentation', url: 'https://docs.soliditylang.org/', provider: 'soliditylang.org' },
    ],
  },
  {
    slug: 'dba',
    category: 'other',
    label: 'Database Administration',
    description: 'Keep databases secure, backed up, performant and available.',
    skills: ['SQL', 'PostgreSQL or MySQL', 'Backup & Recovery', 'Performance Tuning', 'Access Control'],
    resources: [
      { title: 'PostgreSQL Documentation', url: 'https://www.postgresql.org/docs/current/', provider: 'postgresql.org' },
      { title: 'Postgres Tutorial', url: 'https://www.postgresqltutorial.com/', provider: 'PostgreSQL Tutorial' },
    ],
  },
  {
    slug: 'technical-writing',
    category: 'other',
    label: 'Technical Writing',
    description: 'Explain technical products clearly through documentation, guides and API references.',
    skills: ['Clear Writing', 'Docs-as-code (Markdown, Git)', 'API Documentation', 'Information Architecture', 'Editing'],
    resources: [
      { title: 'Google Technical Writing Courses', url: 'https://developers.google.com/tech-writing', provider: 'Google' },
      { title: 'Write the Docs — Guide', url: 'https://www.writethedocs.org/guide/', provider: 'Write the Docs' },
    ],
  },
];

// Display order: grouped by category, matching the onboarding layout.
const CATEGORY_ORDER: CareerCategory[] = ['software', 'data', 'infrastructure', 'design-product', 'other'];
const SLUG_ORDER: CareerPathSlug[] = [
  'frontend', 'backend', 'fullstack', 'software-engineering', 'mobile', 'golang',
  'data', 'data-science', 'ai-ml', 'data-engineering',
  'cybersecurity', 'cloud', 'devops', 'it-support', 'sysadmin', 'networking',
  'design', 'product-design', 'product', 'qa',
  'blockchain', 'dba', 'technical-writing', 'marketing',
];

export const CAREER_PATHS: CareerPath[] = SLUG_ORDER.map((slug) => {
  const path = UNORDERED_PATHS.find((p) => p.slug === slug);
  if (!path) throw new Error(`Missing career path definition: ${slug}`);
  return path;
});

export const CAREER_PATH_GROUPS: { category: CareerCategory; label: string; paths: CareerPath[] }[] = CATEGORY_ORDER.map(
  (category) => ({
    category,
    label: CAREER_CATEGORY_LABELS[category],
    paths: CAREER_PATHS.filter((p) => p.category === category),
  }),
);

export function isCareerPathSlug(value: unknown): value is CareerPathSlug {
  return typeof value === 'string' && CAREER_PATHS.some((p) => p.slug === value);
}

export function getCareerPath(slug: string) {
  return CAREER_PATHS.find((path) => path.slug === slug);
}
