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
- The browser now retains the exact server-generated V2 run ID and can restore, poll, render, and place its accepted decision in History. This remains a controlled single-creator architecture: global persistence keys are not tenant-isolated and must not be used for a multi-user release without authentication and per-creator namespaces.
- YouTube analytics import currently requires exactly one supported Content CSV and one supported Date CSV, each no larger than 2 MB and using the validated English header shapes. OAuth/API connection, localized exports, analytics deletion/export controls, and multi-import selection are not implemented.
- Rejected V2 response diagnostics remain private operational artifacts; a formal retention/deletion policy is still required before beta use.

GreenRoom does not substitute simulated intelligence when live execution fails. Homepage empty states contain no fabricated recommendations.
