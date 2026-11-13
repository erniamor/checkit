# @repo/schemas

Zod schemas shared by the API and the front ends: what the API accepts (inputs) and returns (responses), with their TypeScript types. The API validates its inputs with them; the front ends validate the same inputs in their forms and type the API's responses.

## Usage

```ts
import { createListSchema, type CreateList, type List } from "@repo/schemas";

const result = createListSchema.safeParse({ name: formData.get("name") });
if (!result.success) {
	// result.error.issues[0].message is an error code, e.g. "list_name_required"
}
```

Add it to a project with `"@repo/schemas": "workspace:*"`. It is consumed as TypeScript source, with no build step.

## Contents

| Domain | Schemas and types | Constants |
| --- | --- | --- |
| Common | `dateTimeSchema`, `emailSchema`, `paginationSchema` / `Pagination`, `paginatedSchema(item)` / `Paginated<T>`, `apiErrorBodySchema` / `ApiErrorBody` (the API's error responses), `validationIssueSchema` / `ValidationIssue` | |
| Sign-in | `sendMagicLinkSchema` / `SendMagicLink`, `sendSignInCodeSchema` / `SendSignInCode`, `signInWithCodeSchema` / `SignInWithCode` | `SIGN_IN_CODE_LENGTH` (6) |
| Profile | `profileSchema` / `Profile`, `updateProfileSchema` / `UpdateProfile`, `profileNameSchema` | `PROFILE_NAME_MAX_LENGTH` (60) |
| Lists | `listKinds`, `listKindSchema` / `ListKind` (`purchases`, `tasks`), `createListSchema` / `CreateList`, `updateListSchema` / `UpdateList` (`name` and/or `kind`), `listSchema` / `List` | `LIST_NAME_MAX_LENGTH` (100) |
| Items | `createItemSchema` / `CreateItem`, `createItemsBatchSchema` / `CreateItemsBatch`, `updateItemSchema` / `UpdateItem`, `itemSchema` / `Item` | `ITEM_LABEL_MAX_LENGTH` (200), `ITEMS_BATCH_MAX_SIZE` (50) |
| Members | `memberRoleSchema` / `MemberRole`, `memberRoles`, `shareableRoleSchema` / `ShareableRole`, `memberSchema` / `Member`, `updateMemberSchema` / `UpdateMember` | |
| Invitations | `createInvitationSchema` / `CreateInvitation`, `invitationSchema` / `Invitation`, `invitationPreviewSchema` / `InvitationPreview` | |
| Share links | `createShareLinkSchema` / `CreateShareLink`, `shareLinkSchema` / `ShareLink`, `shareLinkPreviewSchema` / `ShareLinkPreview` | |
| Transcriptions | `transcriptionLanguageSchema` / `TranscriptionLanguage` (`en`, `fr`, `es`), `transcriptionQuerySchema` / `TranscriptionQuery`, `transcriptionSchema` / `Transcription` | `TRANSCRIPTION_UNAVAILABLE` (the API's error code without a transcription service) |
| Real-time events | `listEventSchema` / `ListEvent` (union discriminated by `type`), `ListEventType` | `LIST_EVENTS_READY` (`"ready"`, the first SSE event of a stream) |

In responses, dates are ISO 8601 strings.

## Error codes

Validation messages are codes, not sentences: the front ends translate them in every supported locale. The API returns the same codes in the `details` of its 422 errors.

| Code | Meaning |
| --- | --- |
| `list_name_required` | The list name is empty or blank |
| `list_name_too_long` | The list name is over `LIST_NAME_MAX_LENGTH` characters |
| `item_label_required` | The item label is empty or blank |
| `item_label_too_long` | The item label is over `ITEM_LABEL_MAX_LENGTH` characters |
| `items_required` | A batch contains no item |
| `too_many_items` | A batch contains more than `ITEMS_BATCH_MAX_SIZE` items |
| `nothing_to_update` | An item or list update changes no field |
| `email_invalid` | The email isn't a valid address (sign-in, invitation) |
| `code_invalid` | The sign-in code isn't `SIGN_IN_CODE_LENGTH` digits |
| `name_required` | The user's name is empty or blank |
| `name_too_long` | The user's name is over `PROFILE_NAME_MAX_LENGTH` characters |

Other failures (wrong type, unknown field) keep Zod's default English message: they come from a bug, not from user input.

## Scripts

`pnpm --filter @repo/schemas test`, `pnpm --filter @repo/schemas typecheck`.
