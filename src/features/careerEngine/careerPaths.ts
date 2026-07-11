import type { CareerPath } from './types';

export const CAREER_PATHS: CareerPath[] = [
  {
    slug: 'frontend',
    label: 'Frontend Engineering',
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
    label: 'Backend Engineering',
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
    label: 'Data & Analytics',
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
    label: 'Product Design (UI/UX)',
    description: 'Research, wireframe, and design digital products people love to use.',
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
    label: 'Digital Marketing & Growth',
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
    label: 'DevOps & Cloud',
    description: 'Automate infrastructure, deployments, and cloud systems at scale.',
    skills: ['Linux', 'Docker', 'CI/CD', 'Cloud Fundamentals (AWS/Azure)', 'Kubernetes Basics'],
    resources: [
      { title: 'AWS Skill Builder — Free Digital Training', url: 'https://skillbuilder.aws/', provider: 'AWS' },
      { title: 'Docker — Getting Started', url: 'https://docs.docker.com/get-started/', provider: 'Docker' },
      { title: 'Roadmap.sh — DevOps Roadmap', url: 'https://roadmap.sh/devops', provider: 'roadmap.sh' },
    ],
  },
];

export function getCareerPath(slug: string) {
  return CAREER_PATHS.find((path) => path.slug === slug);
}
