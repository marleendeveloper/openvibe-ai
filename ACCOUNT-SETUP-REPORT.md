# Account setup — 2026-11-10

Delivered email registration/login, confirmation messaging, password-reset request and recovery page, existing Google/Lovable login, shared account session, profile editor, and logout clearing all provider cookies. Header account icon reflects sign-in state. Profile stores only display name and bio; studio project code remains local.

Email/password sign-in enabled through hosted settings; email confirmation was not disabled. Private profile migration applied with explicit grants, three own-account policies, validation and automatic signup trigger. Live database check confirms the profile table, RLS, three policies and signup trigger exist.

46 automated tests passed, including profile rejection of caller-supplied user IDs and roles. Desktop and phone browser checks exercised registration inputs, password reset request view and the recovery page without a valid link. A real signup request with a reserved test email domain was rejected by hosted authentication as expected; this is not a successful registration test.

No auth users exist. Successful email confirmation/social sign-in, profile read-back, logout and authenticated AI review/OpenRouter generation remain unverified. No fake confirmed user, auto-confirm change, credential logging or authentication bypass was introduced. Sign in or register with a real address through the account icon to unlock those checks.