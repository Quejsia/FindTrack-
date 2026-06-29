# FindTrack Firestore Security Specification

This document defines the data invariants, security boundaries, and attack simulation payloads for the FindTrack security configuration.

## 1. Data Invariants
- An Item document must belong to the user registered in `request.auth.uid`. No user can create or update items on behalf of other users.
- Items are publicly readable so that lost-and-found items can be matched and searched by anyone.
- Only the creator of an item can update or delete it.
- Timestamp synchronization targets: `createdAt` is immutable after creation and must equal `request.time`. `updatedAt` must equal `request.time` during updates.
- Matches are atomic bridges between two item documents. They are readable by authenticated users so they can review matching notifications.

## 2. The "Dirty Dozen" Payloads (Denial-of-Access Check Cases)
Below are 12 malicious payloads seeking to bypass identity, integrity, and limits:

1. **Identity Spoofing on Item Create**: Attempt to set `userId` to `target_victim_123` instead of the caller's authentic UID.
2. **Resource Poisoning (Junk character identifier)**: Document ID containing massive wildcard injections.
3. **Ghost Fields injection**: Attempting to add an unlisted `isVerifiedAdmin: true` field to the Item model.
4. **Invalid Enum categorization**: Setting `category` to `alien_technology` instead of defined categories in the enum.
5. **Denial-of-Wallet (Overflow sizes)**: Title field containing 5MB of string characters to exhaust query memory.
6. **State Hijack (Bypassing status flows)**: Direct injection of `status: resolved` upon creation without proper verification.
7. **Unauthorized Item Mutability**: Authenticated user attempts to modify an item belonging to another user.
8. **Null Date Injection**: Creating an item with an empty or non-string date time value.
9. **Creation Timestamp Spoofing**: Attempt to hardcode the `createdAt` timestamp to several years ago.
10. **Modification of Immutable Fields**: Attempting to modify `userId` or `createdAt` on update operations.
11. **Match Modification by Random Bystander**: Setting a match Status directly to `accepted` when they are not the owner of either the lost or found item.
12. **Malicious Match Score Injection**: Attempting to inject a match confidence score of `9999` (outside the 0-100 threshold).

## 3. Recommended Security Configuration (`firestore.rules`)
Below is the verified implementation of the security rules.
