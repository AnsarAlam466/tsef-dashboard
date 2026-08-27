# The Intelligence Layer

## The company is data that learns

Ten&See is not a website with AI features bolted on. It is an AI-native company where the business itself is the intelligence layer — the website and TSEF are just interfaces to it.

### The graph — Ten&See's second brain

Every entity is a node; every relationship is an edge. Nothing is lost to WhatsApp scroll-back.

| Node | Key properties |
|---|---|
| Student | budget, university, room preference, move-in date |
| Room/Unit | price, location, availability, agent |
| Agent/Landlord | buildings, response rate, deal history |
| Lead | source, intent, stage, assigned owner |
| Deal | value, fee, student, room, status |
| Meeting → Decision | owner, deadline, department, status |

### The agent layer — one AI agent per department

Each department gets a dedicated AI agent that fires on triggers and receives **only the delta** — what changed — while the graph holds permanent memory. This is how intelligence scales without token costs scaling.

| Agent | Trigger | Action |
|---|---|---|
| Sales Agent | New inquiry | Read intent, pre-fill lead, suggest match & response |
| Ops Agent | Meeting logged | Extract decisions, assign owners, trigger departments |
| Finance Agent | Deal closed | Compute unit economics, update the weekly report |
| Marketing Agent | Campaign data | Segment-match, feed qualified leads to Sales |
| Support Agent | Ticket pattern | Auto-resolve or escalate to product |

### The build path

1. **Foundation (now)** — live platform + TSEF capturing structured data on every lead, unit, deal, and decision
2. **Graph (next)** — all entities and relationships in a queryable graph; vector DB expanded across listings
3. **Agents (then)** — department agents firing on triggers, humans approving critical actions
4. **Self-optimizing company (12mo+)** — expansion planned from historical graph data; the company operates 24/7 — humans sleep, agents don't

### The moat

Every closed deal makes the matching smarter. Every conversation enriches the graph. A competitor can copy the website in a weekend — they cannot copy **the accumulated graph of students, agents, buildings, prices, and outcomes**.
