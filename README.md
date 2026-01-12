# 🏸 Badminton Club Tracker

A comprehensive badminton club management application with player performance tracking, expenses management, and multi-user support. Built with React and Supabase.

![React](https://img.shields.io/badge/React-19.2-blue)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-green)
![License](https://img.shields.io/badge/license-MIT-blue)

## Features

### Player Management
- Add and manage club members
- Search and filter players
- Track individual player profiles
- Edit player information

### Skills Tracking
Rate players across 16 different skills in 4 categories:
- **Singles**: Footwork, Net Play, Smash, Drop Shot
- **Doubles**: Positioning, Communication, Defense, Attack
- **Service**: Short Serve, Long Serve, Flick Serve, Consistency
- **Fitness**: Stamina, Speed, Agility, Strength

### Training Session Statistics
- Attendance tracking (Present in Nets)
- Technique focus monitoring
- Performance metrics tracking
- Dismissal tracking (Times Got Out)
- Session performance (Wickets Taken, Extras)
- Automated statistics calculation

### Expenses Management
- **Track player expenses** with detailed records
- Add expenses with:
  - Player name
  - Amount
  - Description
  - Date
- **View expenses** by:
  - Summary table with total per player
  - Detailed transaction history
  - Individual expense cards
- **Delete expenses** with one click
- **Total expenses** calculation across all players
- **Export to Excel** with expenses included

### Leaderboards
- Top 5 performers by skills average
- Best attendance tracking
- Real-time rankings

### Data Export
- Export all player data to Excel
- Comprehensive statistics included
- Calculated metrics (dismissal rates, performance per session)
- **Expenses data** included in export

### Multi-User Database Support
- **Supabase PostgreSQL database** with free tier
- User authentication (sign up/sign in)
- Real-time data persistence
- Row Level Security for data protection
- **Offline mode** - works without database configuration

## Quick Start

### Prerequisites
- Node.js 14+ and npm
- Supabase account (free tier) - optional but recommended for multi-user support

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd cricket-apps
```

2. Install dependencies:
```bash
npm install
```

3. **For Multi-User Support** (optional but recommended):
   - Follow the [Supabase Setup Guide](SUPABASE_SETUP.md)
   - Create `.env` file with your Supabase credentials:
   ```
   REACT_APP_SUPABASE_URL=your-project-url
   REACT_APP_SUPABASE_ANON_KEY=your-anon-key
   ```

4. Start the development server:
```bash
npm start
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Usage Modes

### With Database (Multi-User Mode)
- Create a Supabase project and configure environment variables
- Sign up/Sign in to access the application
- All data persists in the cloud
- Multiple users can access and update data simultaneously
- See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed setup

### Without Database (Offline Mode)
- Works immediately without any setup
- Data stored in browser memory only
- Data lost on page refresh
- Single-user only
- Perfect for quick testing or demo

## Using the Application

### Managing Players
1. Click **Add Player** button to add new players
2. Search for players using the search bar
3. Click on a player to view/edit their details

### Rating Skills
1. Select a player from the list
2. Rate each skill on a scale of 1-10
3. Skills are organized by category (Singles, Doubles, Service, Fitness)
4. Ratings are saved automatically

### Tracking Expenses
1. Click the **💲 (Dollar Sign)** button in the navigation
2. Click **Add New Expense** button
3. Fill in the form:
   - Select player name
   - Enter amount
   - Add description (optional)
   - Select date
4. Click **Add Expense** to save
5. View expenses in:
   - **Summary table** - Shows total expenses per player
   - **Detailed view** - Shows all individual transactions
6. Click **Delete** to remove an expense

### Viewing Leaderboards
1. Click the **🏆 (Trophy)** button
2. View:
   - Top 5 performers by skills average
   - Best attendance records

### Exporting Data
1. Click **Export** button
2. Excel file downloads with all data including:
   - Player information
   - All skill ratings
   - Training session statistics
   - Calculated performance metrics
   - **Expenses data**

## Database Schema

The application uses Supabase PostgreSQL with the following structure:

- **players** - Player profiles and basic information
- **skill_ratings** - Individual skill ratings (1-10 scale)
- **nets_data** - Training session statistics
- **profiles** - User profiles with role-based access

See `supabase-schema.sql` for the complete schema definition.

## Project Structure

```
cricket-apps/
├── public/
│   ├── index.html              # HTML template
│   ├── deposit-tracker.html    # Standalone deposit tracker
│   └── ...
├── src/
│   ├── App.js                  # Main application component
│   ├── Auth.js                 # Authentication component
│   ├── supabaseClient.js       # Supabase client configuration
│   ├── index.js                # React entry point
│   └── index.css               # Global styles
├── .env.example                # Environment variables template
├── .gitignore
├── package.json
├── supabase-schema.sql         # Database schema
├── SUPABASE_SETUP.md           # Database setup guide
└── README.md
```

## Available Scripts

### `npm start`
Runs the app in development mode at [http://localhost:3000](http://localhost:3000).
The page reloads when you make changes.

### `npm test`
Launches the test runner in interactive watch mode.

### `npm run build`
Builds the app for production to the `build` folder.
Optimized and minified for best performance.

### `npm run eject`
**Note: this is a one-way operation!**
Ejects from Create React App for full configuration control.

## Technologies Used

- **React 19.2** - Frontend framework
- **Supabase** - Backend-as-a-Service (PostgreSQL, Auth, Realtime)
- **Tailwind CSS** - Utility-first CSS framework
- **Lucide React** - Icon library
- **XLSX** - Excel file generation
- **Create React App** - Build tooling

## Multi-User Features

When database is configured:
- ✅ User authentication with email/password
- ✅ Persistent data storage in PostgreSQL
- ✅ Real-time data synchronization
- ✅ Multiple users can collaborate
- ✅ Row Level Security policies
- ✅ Automatic timestamps and audit trails
- ✅ User profile management

## Expenses Management Features

The application includes a comprehensive expenses tracking system:

### Adding Expenses
- Select player from dropdown
- Enter amount in dollars
- Add optional description
- Choose date of expense
- Instant save to database (if configured) or local state

### Viewing Expenses
- **Summary Table**: Shows total expenses and transaction count per player
- **Detailed View**: Individual expense cards with:
  - Description
  - Date
  - Amount
  - Delete button
- **Total Expenses**: Displayed at the top showing club-wide expenses

### Managing Expenses
- Delete individual expenses
- Sort by date (newest first)
- Filter by player automatically
- Export to Excel with all expense data

## Deployment

### GitHub Pages (Automated with GitHub Actions)

The application is configured for automatic deployment to GitHub Pages using GitHub Actions.

**Setup:**
1. Go to your GitHub repository → Settings → Pages
2. Under "Build and deployment":
   - Source: Select "GitHub Actions"
3. Push to your main branch or designated branch
4. GitHub Actions will automatically build and deploy

**Live URL:** `https://schundi365.github.io/cricket-apps/`

The workflow is configured in `.github/workflows/deploy.yml` and triggers on:
- Push to main/master branch
- Push to designated branches
- Manual trigger via "Actions" tab

**Manual Deployment:**
```bash
npm run build
npm run deploy  # Uses gh-pages package
```

### Vercel / Netlify
1. Connect your repository
2. Set environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
3. Deploy automatically on push

### Important for Production
Update Supabase Authentication settings:
- Add your production URL to Site URL
- Add your production URL to Redirect URLs

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed deployment instructions.

## Troubleshooting

### "Offline Mode" Warning
The application works without a database but data won't persist. To enable multi-user support:
1. Follow [SUPABASE_SETUP.md](SUPABASE_SETUP.md)
2. Create a `.env` file with your credentials
3. Restart the development server

### Database Connection Issues
- Verify `.env` file exists and has correct credentials
- Check Supabase project is active
- Ensure environment variables start with `REACT_APP_`
- Restart the development server after changing `.env`

### Authentication Problems
- Check Supabase Authentication settings
- Verify email confirmation (if enabled)
- Clear browser cache and cookies
- Check Site URL and Redirect URLs in Supabase dashboard

### Expenses Not Saving
- Verify database connection is active
- Check browser console for errors
- Ensure player is selected before adding expense
- Check expense amount is a valid number

## Contributing

Contributions are welcome! Please follow these steps:
1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Support

For issues and questions:
- Check [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for database setup
- Review the [Supabase Documentation](https://supabase.com/docs)
- Open an issue in the repository

## License

This project is licensed under the MIT License.

## Acknowledgments

- Badminton club members and administrators
- Supabase for the amazing backend platform
- React and Create React App teams
- All contributors and users

---

**Note**: This application uses Supabase's free tier which includes:
- 500 MB database storage
- 2 GB bandwidth
- 50,000 monthly active users
- Perfect for small to medium badminton clubs!

For more information about setting up the database, see [SUPABASE_SETUP.md](SUPABASE_SETUP.md).
