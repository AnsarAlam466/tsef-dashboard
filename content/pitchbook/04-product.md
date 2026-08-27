# The Product

## Live today at beta.tenandsee.homes

Ten&See is not a deck-stage idea. The platform is live, in beta, with real listings and real users.

### What is live right now

- **Listings catalogue** — property listings with filters by location, price, and room type
- **Live chat widget** — students inquire directly on the platform
- **WhatsApp integration** — direct landlord/agent contact where students already live
- **Booking & inquiry forms** — structured lead capture
- **Admin dashboard** — analytics plus a vector-DB layer (the foundation of the AI memory)
- **Lead tracking** — every inquiry across chat, WhatsApp, and forms is captured
- **Secured infrastructure** — JWT-authenticated admin, Docker deployment

### TSEF — the internal operating system (this tool)

Alongside the public platform, we run **TSEF**, our private operating system:

- **Dual CRM** — student leads and housing agents tracked as two synchronized pipelines
- **Unit log** — every room an agent sends becomes structured, matchable inventory
- **Deal engine** — matches close with an automatic success-fee calculation
- **Decision register** — every meeting produces owned, deadlined, immutable decisions
- **Audit trail** — every action logged; data visible only to the founding team

### Tech stack

| Layer | Technology |
|---|---|
| Public platform | HTML/CSS/JS · Node.js + Express · MongoDB · JWT · Docker |
| Internal OS (TSEF) | Next.js + TypeScript · MongoDB · NextAuth · OpenAI |
| AI layer | Vector DB (live) → knowledge graph + department agents (roadmap) |

### Product principle

**Humans are triggers. AI is the executor.** Every feature is built so that one human action (log a unit, receive an inquiry, hold a meeting) fans out into automated structure — matching, routing, reporting.
