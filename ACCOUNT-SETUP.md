# BioBot account sync setup

Bio City works immediately as a guest game and saves the profile on the current device. Real sign-in and cross-device profile sync require a Supabase project, which BioBot does not yet have.

1. Create a Supabase project and run `supabase-setup.sql` in its SQL Editor. In the Supabase dashboard, make sure the Realtime service is enabled for the project.
2. In Supabase Authentication settings, set the site URL and allowed redirect URL to `https://paveen202.github.io` (and `https://paveen202.github.io/BioBot/**` if the dashboard asks for a path).
3. Copy the Project URL and the publishable/anon key into `supabase-config.js`.
4. Publish the changed `supabase-config.js` to GitHub Pages. Do not paste a secret or service-role key into the website.

The browser stores each signed-in player's profile row under their own Auth user ID, protected by row-level security. The profile JSON includes points, level, species, merchandise, and profile style. The battle arena supports NPCs and room-code online player matches after cloud setup; friends sign in on separate devices, one creates a room, and the other joins with its six-character code. This is a lightweight educational game economy; it is not designed to prevent users from editing their own browser data.
