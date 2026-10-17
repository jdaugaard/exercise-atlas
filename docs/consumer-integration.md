# Future consumer integration

This is a proposal for consumers; no FitTrack integration is implemented here.

Search the read-only API, preview the full entry and artwork, then create a consumer-owned local copy or reviewed link. Save the provider name, stable exercise ID, record revision and catalog version so later changes can be offered for comparison. Preserve local exercise IDs, user edits, logging conventions and training history. A new source image or revised instructions should not automatically replace a user's chosen movement.

The API returns relative media URLs; resolve them against the configured catalog base URL. The media URL is content-addressed and can be cached indefinitely. JSON responses can be revalidated with ETags. A private GitHub repo does not authenticate a deployed HTTP service: this initial API is local only by default. Decide authentication and hosting before running it on an accessible server.

All initial entries are drafts. A production consumer can request `status=reviewed` and show review state. The sample service intentionally has no database, background generation worker, write endpoint, client credentials or user data.
