# Classes and specializations — task 2

Admin → Data → Classes & specializations (`/Admin/Classes`) manages the complete class catalog. A record with no parent is a class; choosing a class as parent creates a specialization. Nested specializations and converting a class with children into a specialization are rejected by the API.

Both kinds support create/edit/read, ordering, descriptions, archive/unarchive, recoverable deletion, revision history and restoration with stale-version protection. Used entries cannot be deleted; active specializations must be moved or archived before archiving their class. Restoring a version rechecks the class relationship and name conflicts.

Item/spell create/edit forms and the talent database-piece editor have linked Class and Specialization selectors. Changing the class clears the previous specialization. `DisciplineId` stores either a class (all its specializations), one specialization, or null (unrestricted). Existing records remain unrestricted; no class is inferred or assigned silently. Add the desired classes through the manager.

Database filters and read/delete views display the saved class/specialization. A class filter includes its specializations and combines with category/search filters; pagination retains both.

Deploy the server first. `docs/classes-upgrade.sql` is embedded and runs when startup upgrades are enabled, as in the Render blueprint. Otherwise apply the SQL manually after the existing upgrades.

Validation: Next production build (85 pages), 13 unit tests, browser checks with mocked APIs for management, archive/delete/restore, linked selections and saving from all four item/spell forms, filter and CSRF, with no document overflow at 428/926/1440px. Physical iPhone and the production database were not exercised.
