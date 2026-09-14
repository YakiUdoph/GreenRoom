# Known Limitations

- Live coverage is restricted to the three objective/provider pairs in `README.md`; classification is intentionally narrow.
- The source integrations read publisher feeds/indexes, not creator accounts. GreenRoom lacks creator eligibility, geography, rollout access, audience size, pricing context, and channel-performance connectors unless supplied in Memory or evidence.
- A relevant first-party post is evidence of a published change, not proof that every creator can access or benefit from it.
- Adobe, YouTube, Twitch, QStash, Upstash, and Minds are external dependencies. They can be unavailable, malformed, delayed, or changed upstream.
- Minds reply generation was inconsistent in historical foundation testing. Known successful diagnostic replies took roughly 11–31 seconds, but the sample is too small for an SLA or reliability claim.
- Runs are user-triggered. Recurring scheduled monitoring and notifications are not implemented.
- Freshness is currently bounded to 365 days; this is a relevance window, not continuous monitoring proof.
- The first matching high-ranked evidence item is sent for a personalized verdict; the product does not claim exhaustive coverage.
- The frontend has no configured lint/type-check command or automated browser/mobile test suite. Responsive CSS exists, but visual coverage is manual.
- The target user, demand, willingness to pay, and product-market fit have not been validated by repository evidence.
- Local file and ephemeral persistence modes are not equivalent to production durability and are labeled separately.
- Historical persisted briefings may predate the live-provider architecture and remain visibly labeled in history. They can never become the current run's result.
- The creator-facing state does not yet carry a trustworthy V2 run ID. The read-only V2 decision endpoint therefore requires an explicit genuine `run_id`; the frontend does not guess one or load the private acceptance artifact. Until that binding exists, TODAY safely presents only its run-bound V1 briefing shape through the shared presentation adapter.

GreenRoom does not substitute simulated intelligence when live execution fails. Homepage empty states contain no fabricated recommendations.
