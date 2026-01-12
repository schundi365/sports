# Supabase Setup Guide

This guide will help you set up Supabase for the MK Air Cricket Club Training Skills Tracker to enable multi-user access and data persistence.

## Prerequisites

- A Supabase account (free tier is sufficient)
- Node.js and npm installed

## Step 1: Create a Supabase Project

1. Go to [https://supabase.com](https://supabase.com) and sign up/login
2. Click "New Project"
3. Fill in your project details:
   - **Name**: MK Cricket Tracker (or your preferred name)
   - **Database Password**: Choose a strong password
   - **Region**: Select the closest region to your users
   - **Pricing Plan**: Free (500MB database, 2GB bandwidth)
4. Click "Create new project" and wait for it to initialize (2-3 minutes)

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** (gear icon) → **API**
2. Find these two values:
   - **Project URL** (looks like: `https://xxxxx.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)
3. Keep these values handy for the next step

## Step 3: Configure Environment Variables

1. In your project root directory, create a `.env` file:
   ```bash
   cp .env.example .env
   ```

2. Edit the `.env` file and add your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=https://your-project.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key-here
   ```

3. Replace `your-project.supabase.co` with your actual Project URL
4. Replace `your-anon-key-here` with your actual anon public key

**Important**: Never commit the `.env` file to git. It's already in `.gitignore`.

## Step 4: Set Up the Database Schema

1. In your Supabase project dashboard, go to **SQL Editor** (left sidebar)
2. Click "New query"
3. Copy the entire contents of `supabase-schema.sql` from this repository
4. Paste it into the SQL Editor
5. Click "Run" to execute the SQL

This will create:
- **Tables**: players, skill_ratings, nets_data, profiles
- **Row Level Security policies**: Allows authenticated users to read/write data
- **Triggers**: Auto-update timestamps and create user profiles
- **Indexes**: For improved query performance

## Step 5: Configure Authentication

1. In your Supabase project dashboard, go to **Authentication** → **Providers**
2. Enable **Email** provider (enabled by default)
3. Optional: Enable other providers (Google, GitHub, etc.) if desired
4. Go to **Authentication** → **URL Configuration**
5. Add your site URL:
   - **Site URL**: `http://localhost:3000` (for development)
   - For production, add your actual domain (e.g., `https://yourdomain.com`)
6. Add redirect URLs:
   - `http://localhost:3000/**` (for development)
   - Your production URL with wildcard

## Step 6: Test the Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Start the development server:
   ```bash
   npm start
   ```

3. Open [http://localhost:3000](http://localhost:3000)
4. You should see a login/signup screen
5. Create a new account to test
6. After logging in, you should be able to:
   - Add players
   - Rate players on skills
   - Track nets session data
   - View leaderboards
   - All data will persist across sessions

## Database Structure

### Tables

#### `players`
- Stores player information
- Columns: id, name, created_at, updated_at, created_by

#### `skill_ratings`
- Stores individual skill ratings for each player
- Columns: id, player_id, category, skill_name, rating (0-10), timestamps
- Categories: batting, bowling, fielding, fitness

#### `nets_data`
- Stores nets session statistics
- Columns: id, player_id, present_in_nets, works_on_technique, times_got_out, wickets_taken, bowling_extras, timestamps

#### `profiles`
- Extends auth.users with additional user information
- Columns: id, username, full_name, role, timestamps

### Row Level Security (RLS)

All authenticated users can:
- Read all data
- Create new players
- Update skill ratings
- Update nets data
- View other users' profiles
- Update their own profile

This enables multi-user collaboration while maintaining data integrity.

## Deployment

When deploying to production (e.g., GitHub Pages, Vercel, Netlify):

1. Set up environment variables in your hosting platform:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`

2. Update the Supabase Authentication URL Configuration:
   - Add your production URL to Site URL
   - Add your production URL to Redirect URLs

3. Build and deploy:
   ```bash
   npm run build
   ```

## Troubleshooting

### "Invalid API key" error
- Double-check your `.env` file has the correct credentials
- Ensure you're using the **anon public key**, not the service role key
- Restart the development server after changing `.env`

### Authentication not working
- Check Authentication → URL Configuration in Supabase dashboard
- Ensure your site URL matches your current environment
- Clear browser cache and cookies

### Database queries failing
- Verify the SQL schema was executed successfully in SQL Editor
- Check Row Level Security policies are enabled
- Ensure you're logged in (authenticated)

### Data not persisting
- Check browser console for errors
- Verify Supabase client is properly configured
- Ensure `.env` variables are loaded (restart dev server)

## Support

For Supabase-specific issues:
- [Supabase Documentation](https://supabase.com/docs)
- [Supabase Discord Community](https://discord.supabase.com)

For application issues:
- Check the GitHub repository issues
- Review console logs for error messages
