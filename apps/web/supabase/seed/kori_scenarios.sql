-- Seed data for kori_scenarios (roleplay scenarios on /scenarios and the
-- Today page's suggested-scenario card). The table is global + read-only via
-- RLS, so this runs with elevated rights (Supabase SQL editor / MCP), not
-- through the app. Re-runnable: existing ids are skipped.
--
-- id is the sort key on the page (order by id), so the numeric prefix
-- controls display order: workplace first, then daily life.

insert into kori_scenarios (id, title, category, level, summary, goal, intro_message) values

-- ── Meetings ────────────────────────────────────────────────────────────────
('01-daily-standup', 'Daily Standup', 'Meetings', 'Beginner',
 'Report yesterday''s work, today''s plan, and blockers to your team in Korean.',
 'Give a clear 3-sentence standup update.',
 'Let''s roleplay in Korean. You are my team lead running our daily standup. Greet me and ask what I did yesterday, what I''ll do today, and if I have any blockers. Keep your Korean simple, and gently correct my mistakes after each of my replies.'),

('02-sprint-planning', 'Sprint Planning', 'Meetings', 'Intermediate',
 'Discuss task estimates and politely push back when the scope is too big.',
 'Explain how long a task will take and negotiate the scope.',
 'Let''s roleplay in Korean. You are my project manager in a sprint planning meeting. Ask me to estimate a new feature, then push for a shorter deadline so I have to politely negotiate. Correct my mistakes as we go.'),

('03-one-on-one', 'One-on-one with Manager', 'Meetings', 'Intermediate',
 'Talk about your recent progress, difficulties, and growth goals with your manager.',
 'Describe your progress and ask for feedback naturally.',
 'Let''s roleplay in Korean. You are my manager in a one-on-one meeting. Ask how my work is going, what has been difficult, and what I want to improve. Use polite workplace Korean and correct my mistakes as we go.'),

('04-code-review', 'Code Review Discussion', 'Meetings', 'Intermediate',
 'Explain your code choices and respond to review feedback in Korean.',
 'Defend a design decision politely and accept a suggestion.',
 'Let''s roleplay in Korean. You are my senior developer reviewing my pull request. Ask me why I implemented something a certain way, suggest a change, and let me respond. Teach me natural developer Korean and correct my mistakes.'),

-- ── Office Life ─────────────────────────────────────────────────────────────
('05-first-day', 'First Day Self-introduction', 'Office Life', 'Beginner',
 'Introduce yourself to your new Korean team on your first day.',
 'Give a short, natural 자기소개 (self-introduction).',
 'Let''s roleplay in Korean. You are my new team lead welcoming me on my first day at a Korean company. Ask me to introduce myself to the team, then ask one or two friendly follow-up questions. Correct my mistakes and suggest more natural phrasing.'),

('06-ask-for-help', 'Asking a Coworker for Help', 'Office Life', 'Beginner',
 'Politely ask a busy coworker to help you with a bug.',
 'Interrupt politely, explain the problem, and thank them.',
 'Let''s roleplay in Korean. You are my coworker who is busy working. I need to politely interrupt you and ask for help with a bug in my code. Respond naturally and correct my Korean after each message.'),

('07-leave-request', 'Requesting a Day Off', 'Office Life', 'Beginner',
 'Ask your manager for annual leave (연차) politely and give a reason.',
 'Request specific dates and confirm handover plans.',
 'Let''s roleplay in Korean. You are my manager. I want to ask for one day of annual leave (연차) next week. Ask me why and whether my work will be covered. Keep it simple and correct my mistakes.'),

('08-apologize-delay', 'Apologizing for a Delay', 'Office Life', 'Intermediate',
 'Tell your manager a task will be late, explain why, and offer a new plan.',
 'Apologize professionally and propose a realistic new deadline.',
 'Let''s roleplay in Korean. You are my manager. I have to tell you that my task will be two days late. Ask me why and how I will fix the schedule. Teach me polite, professional apology expressions and correct my mistakes.'),

('09-team-dinner', 'Team Dinner (회식)', 'Office Life', 'Intermediate',
 'Make small talk at a company dinner and politely decline a drink.',
 'Hold casual conversation and refuse alcohol politely.',
 'Let''s roleplay in Korean. You are my senior coworker sitting next to me at a company dinner (회식). Make small talk about work and life, and at some point offer me a drink so I can practice declining politely. Correct my mistakes as we go.'),

('10-it-helpdesk', 'Reporting a Problem to IT', 'Office Life', 'Beginner',
 'Describe a laptop or VPN problem to the IT helpdesk.',
 'Explain the symptoms clearly and answer troubleshooting questions.',
 'Let''s roleplay in Korean. You are the company IT helpdesk. My laptop cannot connect to the VPN. Ask me troubleshooting questions and guide me through simple steps. Keep the Korean simple and correct my mistakes.'),

('11-salary-talk', 'Contract Renewal Talk', 'Office Life', 'Advanced',
 'Discuss your contract renewal and salary expectations with HR.',
 'State your contributions and expectations clearly but politely.',
 'Let''s roleplay in Korean. You are the HR manager discussing my contract renewal. Ask about my achievements this year and my expectations, and respond realistically so I can practice negotiating politely in formal Korean. Correct my mistakes as we go.'),

('12-incident-report', 'Explaining a Service Outage', 'Office Life', 'Advanced',
 'Explain to stakeholders what caused an outage and how you fixed it.',
 'Summarize cause, impact, fix, and prevention in clear Korean.',
 'Let''s roleplay in Korean. You are a non-technical stakeholder. Our service had a 30-minute outage last night and I must explain the cause, the fix, and how we will prevent it. Ask follow-up questions a business person would ask. Correct my mistakes.'),

-- ── Food & Dining ───────────────────────────────────────────────────────────
('13-cafe-order', 'Ordering at a Cafe', 'Food & Dining', 'Beginner',
 'Order a drink, choose size and options, and pay at a Korean cafe.',
 'Complete a full cafe order including one special request.',
 'Let''s roleplay in Korean. You are a barista at a Korean cafe. Greet me and take my order — ask about size, hot or iced, and for here or to go. Keep it simple and correct my mistakes after each reply.'),

('14-restaurant', 'Ordering at a Restaurant', 'Food & Dining', 'Beginner',
 'Ask about the menu, order food, and make a request (less spicy, more water).',
 'Order a meal and make one special request naturally.',
 'Let''s roleplay in Korean. You are a server at a Korean restaurant. Help me order — I may ask what''s popular or ask to make it less spicy. Respond naturally, keep it beginner-friendly, and correct my mistakes.'),

-- ── Health & Errands ────────────────────────────────────────────────────────
('15-pharmacy', 'At the Pharmacy', 'Health & Errands', 'Beginner',
 'Describe cold symptoms and understand the pharmacist''s instructions.',
 'Explain symptoms and confirm how to take the medicine.',
 'Let''s roleplay in Korean. You are a pharmacist. I have a cold and need medicine. Ask about my symptoms and explain how to take the medicine. Use simple Korean and correct my mistakes.'),

('16-clinic-visit', 'Visiting a Clinic', 'Health & Errands', 'Intermediate',
 'Register at the front desk and describe your symptoms to a doctor.',
 'Complete registration and explain symptoms in detail.',
 'Let''s roleplay in Korean. First you are the receptionist at a Korean clinic registering me as a first-time patient, then you are the doctor asking about my symptoms. Correct my mistakes as we go.'),

('17-bank-visit', 'At the Bank', 'Health & Errands', 'Intermediate',
 'Handle a common banking errand like a new card or app problem at the counter.',
 'Explain what you need and understand the teller''s instructions.',
 'Let''s roleplay in Korean. You are a bank teller. I am a foreign resident who needs to replace a lost check card and fix a mobile banking app problem. Ask for my ID, explain the steps, and correct my Korean mistakes.'),

('18-phone-plan', 'At the Phone Shop', 'Health & Errands', 'Intermediate',
 'Compare phone plans and ask about data, price, and contract length.',
 'Choose a plan after asking at least three questions.',
 'Let''s roleplay in Korean. You are a staff member at a Korean telecom shop. I want a new phone plan — explain two options and answer my questions about data, price, and contract period. Correct my mistakes as we go.'),

-- ── Out & About ─────────────────────────────────────────────────────────────
('19-taxi-directions', 'Taking a Taxi', 'Out & About', 'Beginner',
 'Tell the driver where to go, ask about time, and pay.',
 'Give a destination and one extra instruction (e.g., stop here).',
 'Let''s roleplay in Korean. You are a taxi driver in Seoul. I will tell you my destination — make small talk, tell me the estimated time, and let me practice asking you to stop at the right place. Keep it simple and correct my mistakes.'),

('20-real-estate', 'Apartment Hunting (부동산)', 'Out & About', 'Advanced',
 'Discuss rent type (전세/월세), deposit, and contract terms with an agent.',
 'Ask about deposit, monthly rent, options, and move-in date.',
 'Let''s roleplay in Korean. You are a real estate agent (부동산 중개인). I am looking for a one-room apartment — explain a 월세 offer including deposit, rent, and management fee, and answer my questions. Correct my mistakes and teach me key housing vocabulary.')

on conflict (id) do nothing;
