-- Opportunity Find — demo seed data
-- Run after schema.sql. ~34 sample opportunities across all types, career
-- paths, and experience levels, including a few expired ones (to verify
-- expired-filtering) and a few with no deadline (rolling).
--
-- career_tags values match the career path slugs used in
-- src/features/careerEngine/careerPaths.ts:
--   frontend, backend, data, design, product, marketing, cybersecurity, devops

insert into opportunities
  (title, organization, type, career_tags, required_skills, experience_level, location, remote, description, application_url, deadline, is_published)
values

-- ── Frontend ──────────────────────────────────────────────────────────
('Frontend Engineer Intern', 'Flutterwave', 'internship', '{frontend}', '{JavaScript,React,CSS,Git}', 'student', 'Lagos, Nigeria', false,
 'Join the web platform team building customer-facing dashboards used by thousands of merchants across Africa. You will pair with senior engineers, ship real UI features, and learn our component library.',
 'https://www.flutterwave.com/careers', '2026-07-25', true),

('Junior React Developer', 'Paystack', 'job', '{frontend}', '{React,TypeScript,Tailwind CSS}', 'entry', 'Lagos, Nigeria', true,
 'Build and maintain merchant-facing React applications. Great first role for someone who has shipped a few personal or freelance React projects and wants production experience.',
 'https://paystack.com/careers', '2026-08-15', true),

('Frontend Engineer, Growth', 'Moniepoint', 'job', '{frontend}', '{React,Next.js,Accessibility}', 'intermediate', 'Remote', true,
 'Own the performance and accessibility of our marketing and onboarding surfaces. 2+ years shipping production frontend code required.',
 'https://moniepoint.com/careers', '2026-09-10', true),

('Google Africa Developer Scholarship — Frontend Track', 'Google', 'tech_program', '{frontend}', '{HTML,CSS,JavaScript}', 'student', 'Remote', true,
 'A fully-funded scholarship program covering modern frontend web development, delivered with local learning communities across Africa.',
 'https://developers.google.com/programs/africa', '2026-08-01', true),

-- ── Backend ───────────────────────────────────────────────────────────
('Backend Engineer Intern (Node.js)', 'Andela', 'internship', '{backend}', '{Node.js,SQL,REST APIs}', 'student', 'Remote', true,
 'Work alongside a distributed engineering team building backend services for global clients. Includes structured mentorship and code review.',
 'https://andela.com/careers', '2026-07-14', true),

('Backend Software Engineer', 'Interswitch', 'job', '{backend}', '{Java,Spring Boot,Microservices,SQL}', 'intermediate', 'Lagos, Nigeria', false,
 'Design and maintain payment-processing microservices handling high transaction volumes. Experience with Spring Boot and distributed systems required.',
 'https://interswitchgroup.com/careers', '2026-08-30', true),

('Senior Backend Engineer, Platform', 'Kuda Bank', 'job', '{backend,devops}', '{Go,PostgreSQL,Kubernetes}', 'senior', 'Remote', true,
 'Lead the design of core banking services. You will set technical direction for a small team and own reliability of critical payment flows.',
 'https://kuda.com/careers', null, true),

('Semicolon Africa Backend Fellowship', 'Semicolon Africa', 'fellowship', '{backend}', '{Python,Django,APIs}', 'entry', 'Lagos, Nigeria', false,
 'A 6-month paid fellowship pairing early-career developers with mentors to build production backend systems for partner companies.',
 'https://semicolon.africa', '2026-09-20', true),

-- ── Data & Analytics ─────────────────────────────────────────────────
('Data Science Nigeria Fellowship', 'Data Science Nigeria', 'fellowship', '{data}', '{Python,SQL,Machine Learning}', 'entry', 'Lagos, Nigeria', false,
 'A structured fellowship teaching applied machine learning and data analysis, ending with a capstone project presented to industry partners.',
 'https://datasciencenigeria.org', '2026-08-20', true),

('Junior Data Analyst', 'Stears', 'job', '{data}', '{SQL,Excel,Data Visualization}', 'entry', 'Remote', true,
 'Support the research team by cleaning, analyzing, and visualizing economic and business data used in Stears reports.',
 'https://www.stears.co/careers', '2026-07-30', true),

('Data Analytics Internship', 'MTN Nigeria', 'internship', '{data}', '{SQL,Power BI}', 'student', 'Lagos, Nigeria', false,
 'Rotate through the analytics team supporting network and customer insight dashboards. Open to final-year students and recent graduates.',
 'https://www.mtnonline.com/careers', '2026-09-05', true),

('AWS re/Start Cloud & Data Program', 'Amazon Web Services', 'tech_program', '{data,devops}', '{Linux,SQL,Cloud Fundamentals}', 'student', 'Remote', true,
 'A free, full-time training program preparing job seekers for entry-level roles in cloud computing and data infrastructure.',
 'https://aws.amazon.com/training/restart/', '2026-10-15', true),

-- ── Design ────────────────────────────────────────────────────────────
('Product Designer', 'Bento Africa', 'job', '{design}', '{Figma,User Research,Prototyping}', 'intermediate', 'Remote', true,
 'Own end-to-end design for HR and payroll product surfaces used by hundreds of African businesses.',
 'https://www.bento.africa/careers', '2026-08-25', true),

('UI/UX Design Internship', 'Termii', 'internship', '{design}', '{Figma,Wireframing}', 'student', 'Lagos, Nigeria', false,
 'Support the design team with wireframes, UI polish, and usability testing for our messaging platform.',
 'https://termii.com/careers', '2026-07-21', true),

('She Code Africa Design Bootcamp', 'She Code Africa', 'tech_program', '{design}', '{Figma,Design Systems}', 'student', 'Remote', true,
 'A 10-week intensive program teaching product design fundamentals to women and underrepresented groups entering tech.',
 'https://shecodeafrica.org', '2026-08-10', true),

('Junior Product Designer', 'Piggyvest', 'job', '{design}', '{Figma,Interaction Design}', 'entry', 'Lagos, Nigeria', true,
 'Design onboarding and savings flows used by millions of users. Portfolio with at least one shipped product required.',
 'https://piggyvest.com/careers', null, true),

-- ── Product Management ───────────────────────────────────────────────
('Associate Product Manager Program', 'Microsoft', 'tech_program', '{product}', '{Product Strategy,Communication}', 'entry', 'Remote', true,
 'A rotational program for early-career candidates to build product management skills across two Microsoft product teams.',
 'https://careers.microsoft.com/students/us/en/apmprogram', '2026-09-15', true),

('Product Manager, Payments', 'Chipper Cash', 'job', '{product}', '{Roadmapping,Analytics,Stakeholder Management}', 'intermediate', 'Remote', true,
 'Own the roadmap for cross-border payment features used across 8+ African markets.',
 'https://chippercash.com/careers', '2026-08-05', true),

('Product Management Internship', 'Konga', 'internship', '{product}', '{Market Research,Communication}', 'student', 'Lagos, Nigeria', false,
 'Support product managers with user research, competitor analysis, and feature specs for the e-commerce marketplace.',
 'https://www.konga.com/careers', '2026-07-15', true),

-- ── Marketing ─────────────────────────────────────────────────────────
('Digital Marketing Associate', 'Jumia', 'job', '{marketing}', '{SEO,Content Strategy,Analytics}', 'entry', 'Lagos, Nigeria', false,
 'Plan and execute digital campaigns across search, social, and email for the Jumia marketplace.',
 'https://group.jumia.com/careers', '2026-08-18', true),

('Growth Marketing Intern', 'Bamboo', 'internship', '{marketing}', '{Social Media,Copywriting}', 'student', 'Remote', true,
 'Support the growth team with content creation, campaign tracking, and community engagement.',
 'https://investbamboo.com/careers', '2026-07-12', true),

('Ingressive for Good Digital Marketing Scholarship', 'Ingressive for Good', 'scholarship', '{marketing}', '{SEO,Google Analytics}', 'student', 'Remote', true,
 'Fully-funded access to a digital marketing certification track plus mentorship from industry practitioners.',
 'https://ingressive4good.com', '2026-08-28', true),

-- ── Cybersecurity ────────────────────────────────────────────────────
('Cybersecurity Analyst Trainee', 'Sterling Bank', 'job', '{cybersecurity}', '{Network Security,SIEM}', 'entry', 'Lagos, Nigeria', false,
 'Join the security operations center monitoring and responding to threats across banking infrastructure.',
 'https://sterling.ng/careers', '2026-09-01', true),

('Cybersecurity Fellowship', 'Tech4Dev', 'fellowship', '{cybersecurity}', '{Ethical Hacking,Network Security}', 'entry', 'Remote', true,
 'A hands-on fellowship covering penetration testing, security auditing, and incident response, capped with a certification exam.',
 'https://tech4dev.org', '2026-08-22', true),

('Cybersecurity Bootcamp Scholarship', 'Google Africa', 'scholarship', '{cybersecurity}', '{Security Fundamentals}', 'student', 'Remote', true,
 'Covers full tuition for an accredited cybersecurity fundamentals bootcamp, including exam vouchers.',
 'https://developers.google.com/programs/africa', '2026-10-01', true),

-- ── DevOps / Cloud ───────────────────────────────────────────────────
('Cloud Engineer', 'Providus Bank', 'job', '{devops}', '{AWS,Docker,CI/CD}', 'intermediate', 'Lagos, Nigeria', false,
 'Manage cloud infrastructure and deployment pipelines supporting core banking applications.',
 'https://providusbank.com/careers', '2026-08-12', true),

('DevOps Internship', 'Termii', 'internship', '{devops}', '{Docker,Linux,CI/CD}', 'student', 'Remote', true,
 'Support the platform team with build pipelines, monitoring, and infrastructure automation.',
 'https://termii.com/careers', '2026-07-28', true),

('MEST Africa Software Training Program (Cloud Track)', 'MEST Africa', 'tech_program', '{devops,backend}', '{AWS,Linux,Docker}', 'entry', 'Accra, Ghana', false,
 'A one-year, fully-funded training program in software engineering and entrepreneurship for aspiring African tech talent.',
 'https://meltwater.org', '2026-09-30', true),

-- ── NYSC-specific ────────────────────────────────────────────────────
('NYSC Corps Member — Tech Innovation Programme', 'National Information Technology Development Agency (NITDA)', 'nysc', '{backend,data}', '{Basic Programming,Digital Literacy}', 'student', 'Abuja, Nigeria', false,
 'A structured placement for corps members to contribute to national digital transformation projects while completing NYSC service.',
 'https://nitda.gov.ng', '2026-08-31', true),

('NYSC SAED Digital Skills Track', 'NYSC', 'nysc', '{marketing,design}', '{Digital Literacy}', 'student', 'Multiple locations, Nigeria', false,
 'The Skills Acquisition and Entrepreneurship Development (SAED) program offering corps members training in digital skills for self-employment.',
 'https://nysc.gov.ng', null, true),

-- ── Fellowships / Grants ─────────────────────────────────────────────
('Tony Elumelu Foundation Entrepreneurship Programme', 'Tony Elumelu Foundation', 'grant', '{product,marketing}', '{Business Planning}', 'entry', 'Remote, Africa-wide', true,
 'Seed funding, mentorship, and a 12-week business bootcamp for early-stage African entrepreneurs.',
 'https://www.tonyelumelufoundation.org', '2026-09-25', true),

('Mastercard Foundation Scholars Program', 'Mastercard Foundation', 'scholarship', '{product,data}', '{Academic Excellence}', 'student', 'Multiple locations', false,
 'Comprehensive scholarships covering tuition, accommodation, and mentorship for academically talented, economically disadvantaged African youth.',
 'https://mastercardfdn.org/all/scholars/', '2026-11-01', true),

('Chevening Scholarship', 'UK Government', 'scholarship', '{product,data,design}', '{Leadership,Academic Excellence}', 'intermediate', 'United Kingdom', false,
 'Fully-funded master''s degree scholarships for future leaders, with a focus on leadership and networking opportunities in the UK.',
 'https://www.chevening.org', '2026-11-05', true),

('Andela Learning Community Coding Competition', 'Andela', 'competition', '{frontend,backend}', '{Problem Solving,Algorithms}', 'student', 'Remote', true,
 'A monthly coding competition open to all skill levels, with cash prizes and interview fast-tracks for top performers.',
 'https://andela.com', '2026-07-13', true),

-- ── Expired (to verify auto-filtering) ──────────────────────────────
('Junior Frontend Developer', 'ExpiredCo Technologies', 'job', '{frontend}', '{HTML,CSS,JavaScript}', 'entry', 'Lagos, Nigeria', false,
 'This listing has already closed — used to verify that expired opportunities are hidden from public browse but remain visible to admins.',
 'https://example.com/careers', '2026-06-01', true),

('Data Analyst Internship', 'PastDeadline Analytics', 'internship', '{data}', '{Excel,SQL}', 'student', 'Remote', true,
 'This listing has already closed — used to verify expired-filtering behavior.',
 'https://example.com/careers', '2026-06-20', true);
