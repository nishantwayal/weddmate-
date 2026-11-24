# Weddmate Security Specification (Phase 0 TDD)

## 1. Data Invariants
1. **18+ & Consent Mandate**: No user profile or account can be created unless `age >= 18`, `ageConfirmed18Plus == true`, and `acceptedTerms == true`.
2. **PII Isolation**: Emails, phone numbers, blocklists, and partner preference notes live strictly in `/users/{userId}` and are readable/writable ONLY by `request.auth.uid == userId`. `/profiles/{userId}` never stores PII (`email`, `phone`).
3. **Voluntary Opt-In Only**: Joining a wedding QR community creates `/weddings/{weddingId}/members/{memberUid}` with `optedInMatchmaking` defaulting to `false` unless explicitly toggled on by the user. `/profiles/{userId}` is only readable by other community members when `optedInDiscover == true && visibility == 'visible'`.
4. **Private Match Chat Isolation**: `/matches/{matchId}/messages/{messageId}` uses the Master Gate (`get()` on `/matches/{matchId}`) so ONLY the two `participants` in an `'active'` match can read or write messages. Wedding planners are strictly excluded.
5. **Secret Crush Confidentiality**: `/swipes/{swipeId}` (`{fromUid}_{toUid}_{weddingId}`) cannot be read by `toUid` if `action == 'secret_crush'` unless `toUid` has ALSO created a reciprocal positive swipe (`{toUid}_{fromUid}_{weddingId}`).
6. **Planner Authority Without Surveillance**: Wedding planners (`plannerUid == request.auth.uid`) can manage event settings, QR expiry, and guest access on `/weddings/{weddingId}`, and read aggregate member counts, but CANNOT read `/matches`, `/messages`, `/swipes`, or `/users/{otherUid}`.
7. **Temporal Integrity & Path Guarding**: Every `createdAt` / `updatedAt` timestamp must equal `request.time`; every path ID must match `^[a-zA-Z0-9_\-]+$` and `<= 128` chars (280 for composite matchId).

## 2. The "Dirty Dozen" Adversarial Payloads
1. **Underage Profile Spoof**: `profiles/{uid}` create with `{ age: 17, ... }` -> `PERMISSION_DENIED`.
2. **PII Leak Attempt**: Guest B calls `get(/users/{guestA})` -> `PERMISSION_DENIED`.
3. **Ghost Field Shadow Update**: `profiles/{uid}` update injecting `{ identityVerified: true, isAdmin: true }` -> `PERMISSION_DENIED`.
4. **Forced Matchmaking Opt-In**: Planner attempts to create `/weddings/{w}/members/{guestB}` with `optedInMatchmaking: true` -> `PERMISSION_DENIED`.
5. **Planner Snooping Chat**: Wedding planner calls `list(/matches/{matchId}/messages)` -> `PERMISSION_DENIED`.
6. **Secret Crush Peek**: Guest B calls `get(/swipes/{guestA}_{guestB}_{w})` before Guest B likes Guest A -> `PERMISSION_DENIED`.
7. **Identity Spoofing in Swipe**: Guest A creates swipe with `{ fromUid: guestB, toUid: guestC }` -> `PERMISSION_DENIED`.
8. **Unmatched Message Injection**: Guest C sends message to `/matches/{A_B_W}/messages/{m}` -> `PERMISSION_DENIED`.
9. **Terminal State Unlock**: User tries to set match `status` back to `'active'` after `'unmatched'` -> `PERMISSION_DENIED`.
10. **Path Poisoning (1.5KB ID)**: Create `/weddings/{1500_char_id}` -> `PERMISSION_DENIED`.
11. **Backdated Timestamp Fraud**: Create memory with client timestamp instead of `request.time` -> `PERMISSION_DENIED`.
12. **Blanket Profile Scrape**: Query `profiles` where `visibility == 'hidden'` as non-owner -> `PERMISSION_DENIED`.
