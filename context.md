# Game Context: Phiên Chợ Giá Trị Online

## 1. Executive Summary

**Phiên Chợ Giá Trị Online** is a real-time multiplayer market simulation built around a single commodity: **dragon fruit sold by the crate**. Players take the roles of producers, consumers, intermediaries, and market regulators across a sequence of market shocks. Their production, pricing, buying, wholesale, policy, and inventory decisions create live data that the game uses to explain political economy concepts: commodity value, socially necessary labor time, supply and demand, market price, circulation, competition, technological change, and state intervention.

The core learning claim is simple: **market price moves, but value has an anchor**. In the game, "standard value" is derived from socially necessary labor time, while market price is computed only from completed transactions. This lets players see that supply and demand push prices above or below value without being the source of value itself.

## 2. Design Purpose and Significance

The game turns abstract political economy theory into a live social system. Instead of telling learners that price fluctuates around value, it lets them produce goods, negotiate, experience scarcity or surplus, watch prices form, and then compare the final transaction data with the theoretical benchmark.

Its significance for presentations and pitch decks:

- **Experiential learning:** learners generate the evidence themselves, rather than passively reading a chart.
- **Role-based conflict:** every role has a different objective, information position, and constraint.
- **Data integrity:** prices, balances, inventory, spoilage, and scores come from server-authoritative transactions.
- **Political economy mapping:** the same round can be discussed as a game mechanic, a market failure, a class relation, or a policy problem.
- **Debrief value:** the observatory and final review convert gameplay into structured reflection: value vs price, supply vs demand, profit vs utility, policy cost vs social outcome.

## 3. Session Structure

### Lobby and Role Assignment

The host creates a room, shares a code or QR, and players join the lobby. Rooms support **4 to 16 seats**; the configured room size is the target economic roster, not only a human attendance limit. At session start, humans occupy the available role slots and bots fill every remaining seat so that the intended market scale is preserved. Roles can be auto-assigned or manually assigned by the host. The host is **not** the government role; the host is a technical/facilitation role.

| Seats | Producers | Consumers | Intermediaries | Government |
| ---: | ---: | ---: | ---: | ---: |
| 4 | 2 | 2 | 0 | 0 |
| 5 | 2 | 2 | 1 | 0 |
| 6 | 2 | 2 | 1 | 1 |
| 7 | 3 | 2 | 1 | 1 |
| 8 | 3 | 3 | 1 | 1 |
| 9 | 4 | 3 | 1 | 1 |
| 10 | 4 | 4 | 1 | 1 |
| 11 | 4 | 5 | 1 | 1 |
| 12 | 5 | 5 | 1 | 1 |
| 13 | 5 | 5 | 2 | 1 |
| 14 | 5 | 6 | 2 | 1 |
| 15 | 6 | 6 | 2 | 1 |
| 16 | 6 | 7 | 2 | 1 |

Auto-assignment distributes humans across a balanced sequence of producer, consumer, intermediary, and government slots before bots take the unoccupied roles. Manual assignment preserves the host's choices, requires every human to have a role, and fills the missing target composition with bots. An auto-hosted, auto-assigned session can start with **one ready human**; sessions without auto-host require at least **four ready humans**. Producer profiles are spread across Traditional, Social-average, and Pioneer types according to the number of producer seats.

Every role is introduced with a visible score metric, a concise "how to win" statement, and three tactical priorities. Bots follow deterministic rules and can also take over if a participant disconnects, preserving the continuity of the live market.

### Intro

Before round 1, the game enters a short intro period. Players learn their role, their map zone, and the central distinction between **standard value** and **market price**. The map acts as a hub: players can move between their task zone, the consumer market, and the observatory.

### Round Loop

Each round follows the same phase structure:

| Phase | Default Timing | What Happens | Purpose |
| --- | ---: | --- | --- |
| **EVENT** | 22 seconds | The round shock is announced. | Establishes the economic condition of the round before decisions begin. |
| **DECISION** | 60 seconds | Producers choose production; government may apply policy from round 2 onward. | Creates supply and institutional conditions before trade. |
| **MARKET_OPEN** | 300 seconds | Retail, offers, counteroffers, wholesale, export promotion, and paced bot actions occur; the live activity feed records market events. | Lets price form through actual exchange while making the process observable. |
| **SETTLEMENT** | Server-driven, displayed briefly | Open offers expire, listings close, unsold goods spoil or carry if protected, final snapshot is created. | Converts market activity into reliable round data. |
| **RECAP** | 30 seconds in auto-host mode | Players review the round's data. | Connects outcomes to theory before the next shock. |

Players can mark themselves ready to fast-forward eligible phases when everyone is done. The host can also pause, resume, extend, skip, or end the session.

### Debrief

After the final round, the game produces a debrief with:

- Participant outcomes by role
- Badges for notable behavior
- Market snapshots by round
- Value vs market price chart
- AI-generated pedagogical comments when available
- A reminder that final market data comes from actual completed transactions

## 4. The Four Round Scenario

The default scenario is `dragon-fruit-simple-v1`. It uses four rounds to isolate different political economy dynamics.

| Round | Event | Mechanical Change | Political Economy Focus |
| ---: | --- | --- | --- |
| **1** | Baseline market | Standard value is **10,000 VND/crate**. Supply and demand start from normal conditions. | Establishes the benchmark for value, cost, and price formation. |
| **2** | Bumper harvest | Production capacity and producer resources rise by about **50%**. Standard value remains **10,000 VND/crate**. | Surplus supply can push price downward without changing value. |
| **3** | Dragon fruit goes viral | Total consumer demand rises by about **50%**. Standard value remains **10,000 VND/crate**. | Excess demand can push price upward and strain affordability. |
| **4** | Technology diffuses | Social labor time falls; standard value drops to **6,000 VND/crate**. | Widespread productivity gains reduce unit value. |

This structure lets the game separate three questions that are often blurred:

- What determines value?
- What moves price?
- What happens when technology changes the social conditions of production?

## 5. Core Economy Model

### Value Formula

The standard value of one crate is calculated from:

```text
standard value = transferred input value + socially necessary labor time * labor value rate
```

In the current scenario:

- Transferred input value: **2,000 VND/crate**
- Labor value rate: **4,000 VND per labor-time unit**
- Social labor time in rounds 1-3: **2**
- Social labor time in round 4: **1**

So:

- Rounds 1-3: `2,000 + 2 * 4,000 = 10,000 VND`
- Round 4: `2,000 + 1 * 4,000 = 6,000 VND`

### Producer Profiles

Producer costs depend on individual labor time, not directly on the social value benchmark.

| Profile | Individual Labor Time | Unit Cost | Base Capacity | Meaning |
| --- | ---: | ---: | ---: | --- |
| Traditional | 4 | 18,000 VND | 2 crates | High-cost producer, vulnerable when price falls. |
| Social average | 2 | 10,000 VND | 4 crates | Producer aligned with the social benchmark. |
| Pioneer | 1 | 6,000 VND | 6 crates | Low-cost producer with technological advantage. |

This is the game’s main representation of the distinction between **individual labor** and **socially necessary labor**.

The expanded room sizes preserve productive diversity rather than duplicating one generic producer:

| Producer Seats | Traditional | Social Average | Pioneer |
| ---: | ---: | ---: | ---: |
| 2 | 1 | 0 | 1 |
| 3 | 1 | 1 | 1 |
| 4 | 1 | 2 | 1 |
| 5 | 1 | 2 | 2 |
| 6 | 2 | 2 | 2 |

### Money, Inventory, and Price

- Money is stored as integer VND and usually displayed as thousand VND.
- Gameplay prices must be between **1,000 and 30,000 VND**, in **1,000 VND** steps.
- Producers begin with **50,000 VND**.
- Consumers receive **20,000 VND subsidy per round**.
- Intermediaries begin with **60,000 VND**.
- Government begins with **40,000 VND**.
- Market price is a weighted average of completed retail transactions.
- Listings and wholesale offers do **not** become market price unless actual retail/system-export transactions complete.
- If no retail transaction completes, market price remains null rather than being invented.

## 6. Role Breakdown

### Producer: Nhà Cung Cấp

**Role fantasy:** owner of dragon fruit supply.

**Win objective shown to the player:** maximize profit after production costs. Produce within capital and capacity, choose between retail and wholesale, and invest in technology when future cost savings justify it.

**Main mechanics:**

- Receives a productivity profile: Traditional, Social average, or Pioneer.
- Produces crates during the DECISION phase if wallet and capacity allow.
- Pays production cost immediately when producing.
- Can cancel production during DECISION only while inventory has not been committed to listings or wholesale.
- Can invest in technology upgrades in rounds 1-3.
- Can sell directly to consumers through retail listings.
- Can sell wholesale to intermediaries.
- Can respond to offers and counteroffers.
- Faces spoilage risk if produced goods remain unsold and unprotected at settlement.

**Scoring:**

```text
producer score = ending balance - 50,000 VND starting capital
```

**Political economy significance:**

The producer role embodies commodity production, private cost, competition, technological differentiation, and the need to "realize" value through sale. A producer may create goods, but unsold goods show that private labor is not automatically validated by the market. The role also demonstrates how lower individual cost can create advantage and how competition can polarize producers.

### Consumer: Khách Hàng

**Role fantasy:** buyer seeking use-value under budget pressure.

**Win objective shown to the player:** fulfill the required need at the lowest total spending. Track remaining demand, compare listed price with standard value, and choose between buying now and bargaining.

**Main mechanics:**

- Receives a per-round need target, usually 2 crates per consumer.
- In round 3, total demand increases by about 50%.
- Receives a subsidy each round to participate in the market.
- During MARKET_OPEN, can buy immediately at listed price.
- Can submit an offer below the ask price.
- Tracks fulfilled units, remaining need, spending, and open offer reservations.

**Scoring:**

```text
consumer utility = fulfilled required units * 20,000 VND - retail spending
```

**Political economy significance:**

The consumer role centers use-value and effective demand. Consumers care about satisfying needs, but they are constrained by money prices. In scarcity, they face rising prices and rationing pressure. In surplus, they may bargain, delay, or buy cheaply. The role helps separate "need" from "demand backed by purchasing power."

### Intermediary: Đại Lý Phân Phối

**Role fantasy:** distributor connecting producers to consumers.

**Win objective shown to the player:** maximize the wholesale-to-retail margin while avoiding spoiled inventory. Buy wholesale with enough margin, relist quickly, and clear stock before settlement.

**Main mechanics:**

- Begins with trading capital.
- Becomes active mainly during MARKET_OPEN.
- Buys wholesale from producers.
- Can counter wholesale offers.
- Receives inventory after successful wholesale purchase.
- Lists inventory for retail sale to consumers.
- Earns from the margin between wholesale cost and retail price.
- Takes inventory risk: unsold goods may spoil at settlement.
- Tracks connected producers and consumers for market connector recognition.

**Scoring:**

```text
intermediary score = ending balance - 60,000 VND starting capital
```

**Political economy significance:**

The intermediary represents circulation, distribution, market access, and trade margins. This role makes visible that moving commodities through the market is itself costly and risky. It can stabilize supply access, but it can also introduce markups, inventory speculation, and uneven bargaining power.

### Government / Market Regulator: Cơ Quan Quản Lý Thị Trường

**Role fantasy:** public authority with a limited policy budget.

**Win objective shown to the player:** maximize social score by increasing successful trade and need fulfillment while reducing spoilage, insolvency, and unnecessary public spending.

**Main mechanics:**

- Observes in round 1.
- From round 2 onward, can use at most one policy per round.
- Does not directly set market price.
- Pays policy costs from a limited public budget.
- Chooses between intervention and non-intervention.

Available policies:

| Policy | Cost | Effect | Political Economy Issue |
| --- | ---: | --- | --- |
| Information disclosure | 3,000 VND | Reveals exact demand context. | Transparency, information asymmetry, market coordination. |
| Cold storage | 2,000 VND per protected crate, max 3 crates | Protects unsold inventory from spoilage. | Infrastructure, waste reduction, stabilization after surplus. |
| Technology support | 8,000 VND | Gives a selected producer a 50% upgrade discount in rounds 2-3. | Industrial policy, productivity, uneven modernization. |
| Export promotion | 4,000 VND plus purchase spending | During the first 15 seconds of MARKET_OPEN, system export can buy about 25% of eligible supply at or below standard value. | Demand creation, surplus absorption, public spending tradeoff. |
| No intervention | 0 VND | Lets the market adjust without policy. | Laissez-faire baseline and opportunity cost. |

**Scoring:**

```text
social score =
  2 * completed retail quantity
  + round(10 * consumer fulfillment rate)
  - 2 * spoiled quantity
  - 5 * insolvent producer count
  - floor(policy spending / 1,000)
```

**Political economy significance:**

The government role is designed as a regulator, not a price dictator. It shows why state action is political and constrained: policy can improve information, protect goods, support technology, or absorb surplus, but every intervention has budget cost and distributional consequences.

### Host

**Role fantasy:** facilitator / teacher / session operator.

**Main mechanics:**

- Creates and configures the room.
- Shares room code and QR.
- Assigns or swaps roles if manual assignment is used.
- Starts, pauses, resumes, extends, advances, or ends the session.
- Can rely on auto-host for timed phase progression and narration.

**Significance:**

The host is deliberately separate from the government role. This prevents confusion between **pedagogical authority** and **market regulation**.

### Bots

**Role fantasy:** system-controlled substitutes.

**Main mechanics:**

- Fill every unoccupied seat in the configured target roster.
- Can maintain play if a user disconnects.
- Follow deterministic heuristics under the same phase, money, role, and inventory rules as humans.
- Use distinct market-persona names and are visibly labeled as bots in the activity feed.
- Act in six timed MARKET_OPEN waves rather than resolving the market in one instant.
- Do not receive human badges.

The six bot waves stage a readable chain of circulation:

1. Government export action when eligible; producers create retail listings.
2. Producers create wholesale offers.
3. Intermediaries accept or counter wholesale offers.
4. Producers resolve wholesale counters; intermediaries list acquired stock at retail.
5. Consumers begin buying or bargaining.
6. Bot sellers answer retail offers and consumers make final demand actions.

Bot timers stop when the market is paused or leaves MARKET_OPEN and are rescheduled on resume. This keeps automated activity synchronized with the same public clock that constrains human players.

**Significance:**

Bots protect the market system from collapsing when participation is uneven. They are not meant to optimize perfectly; they preserve social interaction and keep the simulation legible. Staggering their actions makes cause and effect visible: supply appears, wholesale circulation develops, retail inventory reaches consumers, and bargaining follows.

## 7. Major Gameplay Systems

### Production

During DECISION, producers choose how many crates to produce. Maximum quantity is limited by:

- Production capacity
- Already produced quantity
- Available wallet balance
- Unit cost

This turns production into a capital-constrained decision, not just a quantity slider.

### Retail Market

During MARKET_OPEN, producers and intermediaries can list goods for consumers. Consumers can:

- Buy immediately at ask price
- Submit a lower offer
- Wait for other sellers

Completed retail transactions transfer money to the seller, deduct money from the buyer, update consumer fulfillment, reduce listing inventory, and become part of the market-price calculation.

### Wholesale Market

Producers can create wholesale offers for intermediaries. Intermediaries can accept, reject, or counter. Accepted wholesale trades transfer inventory to the intermediary, who can then sell retail. Wholesale creates circulation and margin opportunities but does not directly count as market price.

### Offers and Counteroffers

Offer mechanics model negotiation and bargaining power. Open offers reserve buyer affordability so buyers cannot overcommit money. Offers expire when the market phase ends.

### Settlement and Spoilage

At settlement:

- Open retail and wholesale offers expire.
- Open listings close.
- Final retail market price is computed from completed retail transactions.
- Unsold inventory becomes at risk.
- Protected inventory carries over.
- Unprotected unsold inventory spoils.
- A final market snapshot is stored for the observatory and debrief.

Spoilage is important because it shows that overproduction is not just "extra supply"; it is a social cost.

### Live Market Activity and Role Guidance

The map and every role workspace include a live, newest-first feed of up to **24 current-round events**. It records:

- Retail listings
- Wholesale offers and negotiation
- Retail offers and counteroffers
- Completed retail and wholesale trades
- Applied government policies and their cost

Each item identifies the actor, role, bot status, timestamp, quantity, and relevant price or policy detail. This makes the market more than an end-of-round chart: players can watch circulation, bargaining, intervention, and price formation unfold as a sequence of social actions.

Role-goal cards remain visible in the lobby and task workspace. They connect each action to the role's scoring metric: profit for producers and intermediaries, utility for consumers, and social score for government. For facilitation and presentation, these two systems make both **motivation** and **market process** explicit without revealing private decision data.

### Observatory

The observatory is open to all roles. It shows:

- Standard value
- Market price when formed
- Supply
- Demand
- Expected inventory / spoilage
- Recent transactions

Alongside the observatory's aggregate evidence, the live activity feed supplies the event-level narrative behind those totals.

Its central message is that **value and price are related but not identical**.

## 8. Scoring and Recognition

The game avoids a single universal win condition because the roles represent different positions in the market.

| Role | Score Meaning |
| --- | --- |
| Producer | Profit over starting capital. |
| Consumer | Utility from fulfilled need minus spending. |
| Intermediary | Profit over trading capital. |
| Government | Social score combining trade volume, fulfillment, waste, insolvency, and policy cost. |

Badges recognize role-specific success:

- Efficient producer
- Wise consumer
- Market connector
- Balanced regulator

This supports a presentation point: **markets do not produce one shared outcome; they distribute gains, losses, risks, and power differently across actors.**

## 9. Political Economy Mapping

| Concept / Issue | In-Game Representation | Discussion Angle |
| --- | --- | --- |
| Commodity | Dragon fruit crates produced for exchange. | A thing becomes economically meaningful through use-value and exchange. |
| Use-value | Consumers gain utility only when needs are fulfilled. | Use-value motivates demand but is not the same as price. |
| Value | Standard value derived from social labor time. | Value is anchored in social production conditions. |
| Socially necessary labor time | Rounds 1-3 use labor time 2; round 4 uses labor time 1. | Value changes when social productivity changes, not when one actor alone becomes efficient. |
| Individual labor time | Producer profiles have different unit costs. | Some producers profit, some break even, some are squeezed. |
| Market price | Weighted average of completed retail trades. | Price is an empirical outcome of exchange, not a declared list price. |
| Supply shock | Round 2 increases production capacity. | Surplus can push price below value and create waste. |
| Demand shock | Round 3 increases consumer need. | Scarcity can push price above value and reduce affordability. |
| Technological diffusion | Round 4 lowers standard value to 6,000 VND. | Productivity lowers unit value when it becomes socially generalized. |
| Competition | Multiple sellers set prices and respond to offers. | Competition pressures inefficient producers and rewards cost advantage. |
| Circulation | Intermediaries buy wholesale and sell retail. | Distribution links supply and demand but introduces margins and inventory risk. |
| Money | Wallets, ledger entries, VND prices, subsidies. | Money acts as measure and means of circulation. |
| Overproduction | Unsold goods spoil unless protected. | Private production can produce social waste when not validated by demand. |
| Information asymmetry | Government can disclose demand information. | Transparency can improve coordination but costs resources. |
| Infrastructure | Cold storage protects surplus. | Logistics and storage mediate market volatility. |
| Industrial policy | Technology support discounts upgrades. | Public policy can shape productivity and competitive structure. |
| External demand | Export promotion buys part of eligible supply. | State-created demand can absorb surplus but uses public budget. |
| Social welfare | Government score combines fulfillment, waste, insolvency, and spending. | Policy success is multidimensional, not just high prices or high profits. |
| Market transparency | The live feed exposes listings, negotiation, trade, and policy in sequence. | Aggregate prices conceal the social actions and bargaining that produced them. |
| Algorithmic participation | Bots occupy vacant roles and trade through paced, rule-bound heuristics. | Automation can sustain liquidity while also shaping market tempo, supply, demand, and perceived competition. |
| Platform governance | The server controls role composition, phase timing, valid actions, settlement, and the public record. | Markets are constituted by rules and infrastructure; they are not institution-free spaces. |

## 10. Pitch-Deck Framing

**One-sentence pitch:**  
Phiên Chợ Giá Trị Online is a multiplayer political economy lab where students play a dragon-fruit market and produce real data showing how price fluctuates around value under supply shocks, demand shocks, technology change, and policy intervention.

**Why it works:**

- It makes theory playable without reducing it to a quiz.
- It separates value, cost, listed price, transaction price, and market price.
- It gives every actor a meaningful but partial objective.
- It exposes the live chain from listing and bargaining to trade and policy, rather than showing only final totals.
- It makes policy a constrained choice, not a magic fix.
- It ends with evidence players created themselves.

**Best presentation arc:**

1. Introduce the commodity: one crate of dragon fruit.
2. Explain the value anchor: 10,000 VND in rounds 1-3, 6,000 VND in round 4.
3. Show the four actors and their conflicting goals.
4. Walk through the phase loop: event, decision, market, settlement, recap.
5. Compare round 2 surplus with round 3 scarcity.
6. Use the activity feed to trace who listed, bargained, traded, and intervened.
7. Use the observatory chart to discuss price vs value.
8. Close with the debrief: who gained, who lost, what spoiled, and what policy changed.

## 11. Source-of-Truth Files

The key mechanics above are represented in:

- `app/src/lib/scenario.ts` — scenario constants, role composition, round events, policy definitions, phase durations.
- `app/src/lib/economy.ts` — value, cost, production capacity, market price, and scoring formulas.
- `app/src/lib/game-service.ts` — session start, role assignment, round entry, phase machine, role state initialization.
- `app/src/lib/lobby-readiness.ts` — human start thresholds, readiness checks, and target-seat role composition.
- `app/src/lib/bots.ts` and `app/src/lib/timer-service.ts` — deterministic role behavior and timed market waves.
- `app/src/lib/market-service.ts` — production, upgrades, retail listings, buy-now, offers, counteroffers.
- `app/src/lib/wholesale-service.ts` — producer-to-intermediary wholesale channel.
- `app/src/lib/policy-service.ts` — government policy actions.
- `app/src/lib/settlement.ts` — final round snapshots, spoilage, settlement.
- `app/src/lib/finalize.ts` — final outcomes, badges, and debrief narration.
- `app/src/lib/session-service.ts` — live snapshots, transaction history, market activity, and analytics.
- `app/src/lib/game-guidance.ts` and `app/src/lib/role-tutorial.ts` — role goals, tactical guidance, and theory-facing copy.
