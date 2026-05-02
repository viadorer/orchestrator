# ADR 0001 — Modular ("Lego") prompting system

* Status: Accepted
* Date: 2025-Q4

## Context

Hugo, the autonomous content agent, must produce on-brand posts for many
projects (real estate, finance, lifestyle, B2B …) on multiple platforms
(LinkedIn, Instagram, Facebook, X) under multiple content modes
(educational, soft-sell, hard-sell). A single monolithic prompt rapidly
becomes unmaintainable: every project edit drifts other projects, and
every platform tweak drags every project back into review.

## Decision

We split the system prompt into **composable blocks** stored in two
tables:

* `prompt_templates` — global, reusable building blocks (system role,
  guardrails, platform conventions, quality rubric).
* `project_prompt_templates` — per-project overrides for a fixed set of
  categories: `identity`, `guardrail`, `quality_criteria`, `examples`,
  `platform_rules`, `editor_rules`.

At generation time `src/lib/ai/prompt-builder.ts` assembles the final
prompt by:

1. Selecting blocks by category + project + platform.
2. Substituting variables (`{{PROJECT_NAME}}`, `{{TONE}}`, `{{PLATFORM}}`).
3. Concatenating in a stable, deterministic order.

The same builder feeds the **content engine** (writer pass) and the
**Hugo editor** (critic pass). The editor uses an 8-axis rubric (hook,
value, authenticity, structure, guardrails, facts, cta, overall) and
only replaces the writer's output if its overall score is ≥ writer's.

## Consequences

Positive:
* Editing one project does not affect other projects.
* New platforms / content modes ship by adding blocks, not rewriting prompts.
* The same block can be A/B tested by versioning rows.

Negative:
* Prompt shape is not visible at one glance — engineers need the builder
  to render the final string.
* Variable substitution is implicit; missing variables silently render
  as empty strings unless the builder asserts them.

## Follow-ups

* Versioned prompt blocks with a registry diff in admin UI.
* A regression eval harness (50–100 fixed inputs, score per block change).
* Fail-loud variable substitution (assert all `{{VARS}}` resolved before
  the model is called).
