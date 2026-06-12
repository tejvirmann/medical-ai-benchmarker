# MedBench — an idea for checking AI before it touches your patients

## The one-line version

A tool that lets a radiology department check, on its own historical patient data and its own equipment mix, whether an AI model actually performs the way the vendor's slide deck claims — before the contract is signed, and quietly afterward to make sure it keeps performing.

## The problem, told as one true story

Epic told hospitals that its Sepsis Prediction Model — built into the EHR that probably runs your own hospital — could correctly distinguish a septic patient from a non-septic one about **76% of the time**.

An independent academic study, published years later in *JAMA Internal Medicine*, found the model actually performed at an AUC of **0.60–0.64** — barely better than a coin flip — with a sensitivity as low as 14.7% and a positive predictive value of 7.6%. Nobody caught the gap before go-live. It ran in hundreds of hospitals, making real predictions about real patients, before anyone outside the company checked whether the marketed number held up.

That's not a fringe vendor cutting corners. That's the single most resourced company in health IT, and its own flagship model. If their number was off by 15+ points of AUC, what should anyone assume about the smaller imaging-AI vendor who walked into your department last month with a deck claiming "94% sensitivity" — tested on a dataset from a hospital three states away, with different scanners, a different patient mix, and a different disease prevalence than yours?

Right now, there is no way to find out before you sign. You're trusting the deck.

Dr. Dania Daye has named this exact gap herself — calling it **"the last mile"** to clinical AI deployment: the space between "this worked in a research paper" and "this works in my department, on my patients, with my equipment, today."

## What's already out there — and why none of it closes the gap

AI is showing up in hospitals faster than almost anyone can track — predictive AI use in U.S. hospitals climbed from roughly two-thirds to over 70% in a single year, and that curve keeps climbing. The tools to independently check any of it haven't kept pace:

- **The vendor's own published numbers** — measured on their dataset, their population, their best-case scenarios. Not yours.
- **A pilot / "shadow mode" period** — useful, but the vendor usually controls what gets measured and how the results get reported back to you. They're grading their own work.
- **FDA clearance** — confirms the tool cleared a regulatory bar in a lab setting. It says nothing about whether it holds up in your department, on your scanners, with your patient mix.
- **MedPerf**, an open academic project — the right underlying idea (privacy-preserving, runs locally), but no interface at all. Requires an engineering team just to stand up.
- **Epic's own free validation tool, released this year** — genuinely a strong signal that even the largest player in health IT agrees this gap is real and worth closing. But it's a code library built for data scientists writing notebooks, it's scoped to the kind of risk-score models Epic itself builds, and — coming from the company that owns the EHR the AI plugs into — it isn't exactly a neutral referee either.

Nothing on that list is independent, built for a clinician instead of an engineer, *and* able to run quietly on your own equipment without asking you to hand anything to anyone. That's the actual, still-open gap.

## What it would actually do (to start — small and specific on purpose)

Before your department commits to an AI tool, MedBench runs that tool against a batch of **your own historical studies** — cases your own radiologists already read and already wrote reports on. Nothing new has to be labeled or created — though "ground truth" is a loaded phrase to use in front of a radiologist, and it deserves a straight answer, not a hand-wave. (That's the very next section, not a footnote.)

It produces one plain-language report:
- How often did the model's call match what your radiologists actually found?
- Where did it disagree — and on which kinds of cases?
- Does its accuracy hold steady across different groups of your patients (age, sex, race, which scanner produced the image) — or does it quietly get worse for some of them?

You walk into your AI governance committee holding *your own* numbers, on *your own* patients, instead of a vendor's slide deck. That's the entire first version. Not a diagnostic tool. Not something that ever touches a live patient encounter. A second, independent opinion on the vendor's claim — run before the money changes hands.

## The "ground truth" problem — the one only a radiologist would catch

Here's the objection that should occur to you before you finish reading this sentence, because you've lived it: *radiologists don't always agree with each other.* Inter-reader variability isn't some embarrassing footnote in this field — it's a documented, accepted fact of daily practice. Two board-certified colleagues reading the same study will disagree on a real fraction of findings. So what does it even mean to say an AI's call "matched" a report your department wrote — matched *whose* read, on a day when your own group might have split?

That's exactly why MedBench doesn't pretend there's one sacred, unimpeachable truth to grade an AI against. A tool that claimed there was would deserve to get thrown out by the first room of radiologists who read its methodology — and they'd be right to throw it out. Instead, it measures the AI against the same yardstick your department already lives by every day: the spread of your *own* radiologists' reads on the same cases. If your group's own disagreement rate on a given finding already runs around, say, 15%, and the AI's disagreement with your group falls inside that range, that's a fundamentally different finding than an AI that disagrees with your group 40% of the time. The first looks like "reads about as consistently as one more colleague would." The second looks like something that doesn't belong anywhere near a worklist.

Put plainly: the question was never "is the AI right." It's "does this thing argue with you about as much as you already argue with each other — or wildly more." That's a question only your own department's data can answer. A vendor's slide deck can't even pose it, because it has no idea how your radiologists actually read.

## How this would actually sit in your week

It shouldn't change it. This isn't an app you'd open every morning. Think of it more like ordering an inspection before buying a house — something you'd request a handful of times a year, only when your department is actually in the middle of evaluating a tool. Someone — you, a colleague on the AI committee, whoever currently owns vendor evaluation — points it at a batch of cases, it runs on its own, you read the report. The rest of your week looks exactly like it does now.

And to be specific about what "running it" actually looks like: a handful of clicks on a screen — pick the task, pick the model, point at a folder, press run. Not a chat window to figure out how to talk to. Not a notebook to know how to code in. Closer to using a copy machine than learning a new piece of clinical software.

## The data question — addressed before you have to ask it

This is the first objection anyone in your IT or security office will raise, so here it is up front: **nothing that identifies a patient ever has to leave your building.**

```
   INSIDE YOUR HOSPITAL'S WALLS                        OUTSIDE
  ┌────────────────────────────────┐
  │  Your studies + the reports    │
  │  your radiologists already     │
  │  wrote                         │
  │             ↓                  │
  │   The tool runs the entire     │
  │   comparison RIGHT HERE,       │       only this
  │   on a machine you control     │  ───────────────────→   A report:
  │             ↓                  │      ever crosses        percentages,
  │   (no image, no name, no       │      the wall            charts, plain
  │    identifier ever leaves      │                          language
  │    this box)                   │
  └────────────────────────────────┘
```

The tool runs entirely on a machine inside your own network — yours, not ours. It reads the studies and reports that are already sitting in your own systems, runs the comparison locally, and the only thing that would ever leave (if anything does at all) is the *aggregate result*: percentages, charts, summaries — never an image, never a name, never an identifier. It can run with no internet connection at all, and your security team can watch the network traffic themselves to confirm that nothing goes anywhere. You're not being asked to hand anything to anyone — you're being asked to let a piece of software run on your own hardware, the same way you'd evaluate any other internal tool. And if your compliance officer wants the one-line version for the file: this changes nothing about your HIPAA posture, because nothing that legally counts as PHI ever crosses the wall to begin with.

## What this explicitly is *not*

- **Not a diagnostic tool.** It makes no claim about any individual patient and is never in the loop of an actual clinical decision.
- **Not a certification, a clearance, or a shield against liability.** A strong score doesn't bless a tool for deployment, and a weak one doesn't condemn it — it's one more measurement on historical, already-labeled data, handed to the humans on your AI committee to weigh alongside everything else they already weigh. The decision — and the responsibility for it — never leaves your department's hands; this just makes sure it's an informed one.
- **Not FDA-regulated**, because it doesn't do anything clinical — it independently checks tools that do.
- **Not a replacement for how your department already evaluates vendors.** It's an addition: one more, independent measurement sitting alongside whatever process you already run.
- **Not asking you to change how you read a study or write a report.** It only observes what already happens; it never participates in it.

## Why this, why now

- UW–Madison is already a live site in the **PRISM Trial** — a national, ~400,000-patient study testing whether AI can help radiologists read mammograms, with an estimated 50,000 patients enrolled in Wisconsin. Your department is, right now, in the middle of asking exactly the question this tool exists to answer: *does this AI actually hold up on our patients?*
- The FDA finalized guidance in August 2025 creating an official pathway for AI device makers to pre-define exactly this kind of thing — how they'll watch their models for drift and shifting subgroup performance over time. It's not yet mandatory, and tellingly, only about 8% of new AI devices have adopted one so far. The direction the agency is heading is now unmistakable; almost nobody has actually built the muscle for it yet.
- UW–Madison Radiology has already invested in its own GPU infrastructure for deep learning — which means the most common objection to "run this locally" (*we don't have the hardware*) doesn't even apply here.

## Where this could go, if the first version actually proves useful

I'm deliberately not leading with this — a tool that tries to do everything on day one usually ends up doing nothing well, and I'd rather earn the right to build the bigger version than pitch it now. But if the narrow version above turns out to genuinely help, the natural next steps would be:

- **Watching continuously, not just checking once** — automatically re-running the same comparison on a schedule after a tool goes live, so a gap like the Epic Sepsis Model's gets caught in week one instead of years later
- **Making the subgroup breakdown the headline, not a footnote** — "this performs 12% worse for women over 60" as the first line of every report, by default, not something you have to dig for
- **Reaching the newer wave of AI** — ambient scribes and clinical AI agents are spreading even faster than imaging tools right now, and there's currently no fast, scalable way (not even Epic has one) to check whether they're quietly hallucinating something dangerous into a chart

None of that has to be true on day one for the idea to be worth trying — it only has to be true that the narrow version, on its own, would actually get used.

## What I'm actually asking you

Not for a yes. For your honest, unfiltered read, as someone who'd be standing on the other side of this:

- Is this a real pain you've felt yourself — or watched a colleague feel — or am I imagining a problem that doesn't actually bite in practice?
- If someone offered to run this, for free, on one model your department is currently curious about, on cases you already have — would you actually take them up on it? If not, why not?
- What would make you trust a report like this? What would make you throw it in the trash on sight?
- What am I getting wrong about how this would really play out inside a radiology department?

I'd rather hear "this wouldn't actually help me, and here's why" now than build something nobody asked for.
