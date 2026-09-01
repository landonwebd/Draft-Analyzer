# Draft Analyzer Database Schema

## Data ownership

Every draft pool, imported draft, draft pick, player-ranking override, and FantasyPros import request stored in Postgres belongs to one authenticated user. Anonymous contact-form rate-limit records are stored separately and are not associated with an account.

Supabase Auth will manage user accounts in its built-in `auth.users` table. Draft Analyzer will reference those users by their UUID rather than storing passwords or authentication details itself.

## Stored data

The database will store:

- Draft pools
- Imported drafts
- Draft picks
- FantasyPros import request history used for rate limiting
- Anonymous contact-form request history used for rate limiting
- Player-ranking overrides

## Derived data

The database will not store:

- Personalized rankings
- Position rankings
- Ranking tiers
- Ranking confidence
- Meaningful-pass calculations
- Best Available results

These values will continue to be calculated from the user’s drafts and overrides so they cannot become stale.

## Browser-only data

Draft Tracker sessions remain in browser storage.

Player-ranking overrides remain in browser storage for anonymous users. Signed-in users store overrides in Postgres so manual ADP adjustments and excluded-player settings synchronize across devices.

When a signed-in user has existing browser overrides, the application will merge them into Postgres and remove the browser copy only after the migration succeeds.

## `draft_pools`

Stores the custom groups users create to organize their drafts.

| Column       | Type          | Rules                                       | Purpose                      |
| ------------ | ------------- | ------------------------------------------- | ---------------------------- |
| `id`         | `uuid`        | Primary key                                 | Uniquely identifies the pool |
| `user_id`    | `uuid`        | Required; references the authenticated user | Identifies who owns the pool |
| `name`       | `text`        | Required                                    | The pool’s display name      |
| `slug`       | `text`        | Required; unique for each user              | The pool’s URL-friendly name |
| `created_at` | `timestamptz` | Required; defaults to the current time      | Records when it was created  |
| `updated_at` | `timestamptz` | Required; defaults to the current time      | Records when it last changed |

A user cannot have two pools with the same slug. Different users may use the same pool name and slug.

## `imported_drafts`

Stores each imported fantasy-football draft and its relationship to an optional draft pool.

| Column             | Type          | Rules                                              | Purpose                                  |
| ------------------ | ------------- | -------------------------------------------------- | ---------------------------------------- |
| `id`               | `uuid`        | Primary key                                        | Uniquely identifies the imported draft   |
| `user_id`          | `uuid`        | Required; references the authenticated user        | Identifies who owns the draft            |
| `pool_id`          | `uuid`        | Optional; references a pool owned by the same user | Organizes the draft into a pool          |
| `name`             | `text`        | Required                                           | The draft’s display name                 |
| `source_file_name` | `text`        | Required; unique for each user                     | Identifies the original import source    |
| `imported_at`      | `timestamptz` | Required; defaults to the current time             | Records when the draft was imported      |
| `my_fantasy_team`  | `text`        | Required                                           | Identifies the user’s team in the draft  |
| `updated_at`       | `timestamptz` | Required; defaults to the current time             | Records when draft metadata last changed |

A draft may remain unassigned by storing `null` in `pool_id`. Deleting a draft pool sets the associated drafts’ `pool_id` values to `null` rather than deleting those drafts.

A user cannot import two drafts with the same `source_file_name`. Different users may import drafts from the same source.

A draft cannot reference a pool owned by another user.

## `draft_picks`

Stores each individual player selection belonging to an imported draft.

| Column         | Type      | Rules                                      | Purpose                                     |
| -------------- | --------- | ------------------------------------------ | ------------------------------------------- |
| `draft_id`     | `uuid`    | Required; references an imported draft     | Identifies the draft containing the pick    |
| `overall`      | `integer` | Required; greater than zero                | Records the overall selection order         |
| `pick`         | `text`    | Required                                   | Stores the displayed round-and-pick value   |
| `player_name`  | `text`    | Required                                   | Identifies the selected player              |
| `position`     | `text`    | Required; one of QB, RB, WR, TE, K, or DST | Records the player’s position               |
| `nfl_team`     | `text`    | Required                                   | Records the player’s NFL team               |
| `fantasy_team` | `text`    | Required                                   | Identifies the fantasy team making the pick |

The combination of `draft_id` and `overall` is the table’s primary key. An imported draft cannot contain two picks with the same overall selection number.

Deleting an imported draft automatically deletes all picks belonging to it.

Draft picks do not repeat `user_id`. Their ownership is inherited through the parent imported draft, and their Row Level Security policies will verify ownership through that relationship.

## `player_ranking_overrides`

Stores the manual changes a signed-in user applies to an individual player’s calculated ranking.

| Column                  | Type          | Rules                                         | Purpose                                  |
| ----------------------- | ------------- | --------------------------------------------- | ---------------------------------------- |
| `user_id`               | `uuid`        | Required; references the authenticated user   | Identifies who owns the override         |
| `player_key`            | `text`        | Required; non-empty                           | Identifies the normalized player         |
| `manual_adp_adjustment` | `integer`     | Required; defaults to 0; between -100 and 100 | Moves the player’s Personalized ADP      |
| `is_excluded`           | `boolean`     | Required; defaults to false                   | Removes the player from visible rankings |
| `updated_at`            | `timestamptz` | Required; defaults to the current time        | Records when the override last changed   |

The combination of `user_id` and `player_key` is the table’s primary key. Different users may override the same player independently.

Rows containing the default state—an adjustment of 0 and `is_excluded` set to false—will not be stored. Returning a player to the default state deletes that player’s override row.

Authenticated users may view, create, update, and delete only their own override rows. Anonymous users receive no table access.

## `private.fantasypros_import_requests`

Stores a short-lived record of authenticated FantasyPros draft requests so the server can enforce per-user and application-wide rate limits.

| Column           | Type          | Rules                                       | Purpose                                |
| ---------------- | ------------- | ------------------------------------------- | -------------------------------------- |
| `id`             | `bigint`      | Generated identity; primary key             | Uniquely identifies the request        |
| `user_id`        | `uuid`        | Required; references the authenticated user | Identifies who made the request        |
| `mock_draft_key` | `text`        | Required                                    | Identifies the requested mock draft    |
| `requested_at`   | `timestamptz` | Required; defaults to the current time      | Records when the request was permitted |

Authenticated users will not receive direct table access. A database function will use the authenticated user ID to check per-user and application-wide request counts and record an allowed request atomically.

The limits are:

- No more than 5 requests during any rolling 10-minute period
- No more than 25 requests during any rolling 24-hour period
- No more than 400 requests across the entire application during any rolling 24-hour period

Old request records may be removed after they are no longer needed for rate limiting.

## `private.contact_form_requests`

Stores anonymous contact-form request records so the server can prevent excessive messages without storing raw IP addresses.

| Column         | Type          | Rules                           | Purpose                                       |
| -------------- | ------------- | ------------------------------- | --------------------------------------------- |
| `id`           | `bigint`      | Generated identity; primary key | Uniquely identifies the request               |
| `request_hash` | `text`        | Required; 64 lowercase hex      | Stores a secret-keyed identifier for limiting |
| `requested_at` | `timestamptz` | Required; defaults to now       | Records when the request was permitted        |

Browser clients and authenticated users do not receive direct access to this table or its rate-limit function. The server calls the function with the Supabase secret key.

The contact-form limits are:

- No more than 3 messages during any rolling 10-minute period
- No more than 10 messages during any rolling 24-hour period

The raw request IP address is not stored in this table. Requests outside the active windows are ignored, and expired records for a request source are removed when that source makes a later request.
