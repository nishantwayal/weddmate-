/**
 * Weddmate Firestore Security Rules Adversarial Verification Spec (Phase 0 TDD)
 * Documents the 12 "Dirty Dozen" rejection assertions for Firebase Rules Unit Testing.
 */

export interface SecurityTestCase {
  id: string;
  collection: string;
  operation: 'get' | 'list' | 'create' | 'update' | 'delete';
  actorUid: string | null;
  payload?: Record<string, unknown>;
  expected: 'PERMISSION_DENIED' | 'ALLOW';
}

export const DIRTY_DOZEN_CASES: SecurityTestCase[] = [
  {
    id: 'DD-01-underage-profile',
    collection: 'profiles/userA',
    operation: 'create',
    actorUid: 'userA',
    payload: { uid: 'userA', fullName: 'Test User', age: 17, gender: 'Woman', city: 'Jaipur', optedInDiscover: true, visibility: 'visible' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-02-pii-cross-read',
    collection: 'users/userA',
    operation: 'get',
    actorUid: 'userB',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-03-shadow-field-injection',
    collection: 'profiles/userA',
    operation: 'update',
    actorUid: 'userA',
    payload: { bio: 'Updated', identityVerified: true },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-04-planner-forced-opt-in',
    collection: 'weddings/wed1/members/userB',
    operation: 'create',
    actorUid: 'planner1',
    payload: { uid: 'userB', weddingId: 'wed1', side: "Bride's Side", optedInMatchmaking: true, status: 'active' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-05-planner-snooping-chat',
    collection: 'matches/userA_userB_wed1/messages',
    operation: 'list',
    actorUid: 'planner1',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-06-secret-crush-peek',
    collection: 'swipes/userA_userB_wed1',
    operation: 'get',
    actorUid: 'userB',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-07-swipe-identity-spoof',
    collection: 'swipes/userB_userC_wed1',
    operation: 'create',
    actorUid: 'userA',
    payload: { fromUid: 'userB', toUid: 'userC', weddingId: 'wed1', action: 'like' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-08-unmatched-message-injection',
    collection: 'matches/userA_userB_wed1/messages/msg1',
    operation: 'create',
    actorUid: 'userC',
    payload: { id: 'msg1', matchId: 'userA_userB_wed1', senderUid: 'userC', text: 'Hi', type: 'text' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-09-terminal-unmatch-reopen',
    collection: 'matches/userA_userB_wed1',
    operation: 'update',
    actorUid: 'userA',
    payload: { status: 'active' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-10-path-id-poisoning',
    collection: `weddings/${'a'.repeat(300)}`,
    operation: 'create',
    actorUid: 'planner1',
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-11-client-timestamp-forgery',
    collection: 'weddings/wed1/memories/mem1',
    operation: 'create',
    actorUid: 'userA',
    payload: { id: 'mem1', weddingId: 'wed1', authorUid: 'userA', createdAt: '1999-01-01T00:00:00Z' },
    expected: 'PERMISSION_DENIED'
  },
  {
    id: 'DD-12-hidden-profile-scrape',
    collection: 'profiles',
    operation: 'list',
    actorUid: 'userB',
    expected: 'PERMISSION_DENIED'
  }
];
