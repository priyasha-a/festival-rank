# Ideas for Set Rank

A running list of things to add next. Tick them off or reorder as you go.
(Saved 2026-10-02.)

## Before sharing widely

- [ ] **Fix the email limit (custom SMTP).** Supabase's built-in email only sends ~2 sign-in emails per hour
  for the whole app, so friends signing up together hit "email rate limit exceeded". Connect Gmail (no domain
  needed) or Resend/Postmark in Supabase → Project Settings → Authentication → SMTP, then raise the limit in
  Authentication → Rate Limits.
- [ ] **Friends, step 2** (agreed, not built yet)
  - "Friends who went" on each festival page (e.g. "Maya and Jordan went to EDC 2025")
  - Side-by-side compare: "You both saw Kaskade — you ranked them #2, Maya #7"

## Fun & shareable

- [ ] **Share card**: a phone-sized image of your top 5 sets from a festival, ready for Instagram stories.
- [ ] **Set Rank Wrapped**: a yearly recap ("47 sets across 6 festivals; your #1 artist was Excision, seen 4 times").
- [ ] **Taste match with friends**: "You and Maya are an 82% match", from how similarly you rank the same artists.

## Deeper rankings

- [ ] **All-time ranking**: your best sets ever across every festival and show, using the same head-to-head screen.
- [ ] **Artist pages**: tap an artist to see every time you saw them and how each set ranked.
- [ ] **Notes on a set**: a short note per set ("played Bangarang into a new edit, insane drop").
- [ ] **Scores out of 10** (Beli-style), derived from each set's position in the ranking.

## Convenience

- [ ] **Add to home screen**: open full-screen like a real app, with its own icon (quick win).
- [ ] **Spotify playlist** from a ranking ("Your EDC 2025 Top 10"). Needs a Spotify developer app.
- [ ] **setlist.fm autofill** for solo shows: type an artist and pick the real date and venue.

## For you (the owner)

- [ ] **Requests page**: a private page listing festival requests, most-requested first (instead of checking
  Supabase → Table Editor → `festival_requests`).
- [ ] **Cleaner lineups**: fill gaps and fix spellings in lineups that were pieced together from search results.
- [ ] **Fully automatic festival adding** (via the Claude API): draft lineups for requested festivals, with an
  approve step before they go live. Costs a little per request.

## Suggested order

1. Fix the email limit (blocks friends from signing up)
2. Friends step 2 + share card (reasons to invite friends and post rankings)
3. Add to home screen (quick win)
