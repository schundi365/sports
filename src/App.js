import React, { useState, useEffect } from 'react';
import { Search, Award, Users, UserPlus, Download, LogOut, Loader, AlertCircle, DollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Auth from './Auth';

const TrainingTracker = () => {
  // Initial hardcoded players list for seeding
  const initialPlayers = [
    "Rahul P", "Srikanth", "Vinay", "Saiteja", "Avinash", "Yash", "Bhargav", "Sai Anurag"
  ];

  const skillCategories = [
    { name: 'Singles', skills: ['Footwork', 'Net Play', 'Smash', 'Drop Shot'] },
    { name: 'Doubles', skills: ['Positioning', 'Communication', 'Defense', 'Attack'] },
    { name: 'Service', skills: ['Short Serve', 'Long Serve', 'Flick Serve', 'Consistency'] },
    { name: 'Fitness', skills: ['Stamina', 'Speed', 'Agility', 'Strength'] }
  ];

  // Authentication state
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [dbConfigured, setDbConfigured] = useState(false);

  // App state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);
  const [ratings, setRatings] = useState({});
  const [view, setView] = useState('list');
  const [showAddPlayer, setShowAddPlayer] = useState(false);
  const [newPlayerName, setNewPlayerName] = useState('');
  const [playersList, setPlayersList] = useState([]);
  const [syncing, setSyncing] = useState(false);
  const [error, setError] = useState('');

  // Expenses state
  const [expenses, setExpenses] = useState({});
  const [showExpenseModal, setShowExpenseModal] = useState(false);
  const [expensePlayer, setExpensePlayer] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseDescription, setExpenseDescription] = useState('');
  const [expenseDate, setExpenseDate] = useState('');

  // Deposits state
  const [deposits, setDeposits] = useState({});
  const [showDepositModal, setShowDepositModal] = useState(false);
  const [depositPlayer, setDepositPlayer] = useState('');
  const [depositAmount, setDepositAmount] = useState('');

  // Player management state
  const [showPlayerManagement, setShowPlayerManagement] = useState(false);
  const [showReplacePlayerModal, setShowReplacePlayerModal] = useState(false);
  const [playerToReplace, setPlayerToReplace] = useState('');
  const [newPlayerNameForReplace, setNewPlayerNameForReplace] = useState('');

  // Games played state (for expense statement)
  const [gamesPlayed, setGamesPlayed] = useState({});

  // Voting system state
  const [votingSessions, setVotingSessions] = useState([]);
  const [playerVotes, setPlayerVotes] = useState({});
  const [showVotingModal, setShowVotingModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState('');
  const [sessionTime, setSessionTime] = useState('18:00');
  const [sessionVenue, setSessionVenue] = useState('Regular Venue');
  const [costPerPlayer, setCostPerPlayer] = useState('10.00');
  const [maxPlayers, setMaxPlayers] = useState('8');
  const [sessionDescription, setSessionDescription] = useState('');

  // Check Supabase configuration and auth state on mount
  useEffect(() => {
    const configured = isSupabaseConfigured();
    setDbConfigured(configured);

    if (configured) {
      // Check current session
      supabase.auth.getSession().then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });

      // Listen for auth changes
      const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
        setUser(session?.user ?? null);
      });

      return () => subscription.unsubscribe();
    } else {
      setLoading(false);
    }
  }, []);

  // Load data from Supabase when user logs in
  useEffect(() => {
    if (user && dbConfigured) {
      loadDataFromDatabase();
    } else if (!dbConfigured) {
      // Fallback to initial players if no database
      setPlayersList(initialPlayers);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, dbConfigured]);

  // Load all data from Supabase
  const loadDataFromDatabase = async () => {
    setSyncing(true);
    setError('');

    try {
      // Load players
      const { data: playersData, error: playersError } = await supabase
        .from('players')
        .select('*')
        .order('name');

      if (playersError) throw playersError;

      // If no players exist, seed with initial players
      if (!playersData || playersData.length === 0) {
        await seedInitialPlayers();
        return; // seedInitialPlayers will reload data
      }

      const players = playersData.map(p => p.name);
      setPlayersList(players);

      // Load skill ratings
      const { data: ratingsData, error: ratingsError } = await supabase
        .from('skill_ratings')
        .select('*, players(name)');

      if (ratingsError) throw ratingsError;

      // Transform ratings data
      const ratingsObj = {};
      ratingsData.forEach(rating => {
        const playerName = rating.players.name;
        if (!ratingsObj[playerName]) {
          ratingsObj[playerName] = {};
        }
        const key = `${rating.category}-${rating.skill_name}`;
        ratingsObj[playerName][key] = rating.rating;
      });
      setRatings(ratingsObj);

      // Load expenses
      const { data: expensesData, error: expensesError } = await supabase
        .from('expenses')
        .select('*, players(name)')
        .order('date', { ascending: false });

      if (expensesError) throw expensesError;

      // Transform expenses data
      const expensesObj = {};
      expensesData.forEach(expense => {
        const playerName = expense.players.name;
        if (!expensesObj[playerName]) {
          expensesObj[playerName] = [];
        }
        expensesObj[playerName].push({
          id: expense.id,
          amount: expense.amount,
          description: expense.description,
          date: expense.date
        });
      });
      setExpenses(expensesObj);

      // Load deposits
      const { data: depositsData, error: depositsError } = await supabase
        .from('deposits')
        .select('*, players(name)')
        .order('created_at', { ascending: false });

      if (depositsError) throw depositsError;

      // Transform deposits data
      const depositsObj = {};
      depositsData.forEach(deposit => {
        const playerName = deposit.players.name;
        depositsObj[playerName] = deposit.amount;
      });
      setDeposits(depositsObj);

      // Load games played data (for now, we'll use a simple counter per player)
      // In a real app, this would come from a games/matches table
      const gamesObj = {};
      playersList.forEach(player => {
        // For demo purposes, assign random games played (1-20)
        gamesObj[player] = Math.floor(Math.random() * 20) + 1;
      });
      setGamesPlayed(gamesObj);

      // Load voting sessions
      const { data: votingData, error: votingError } = await supabase
        .from('voting_sessions')
        .select('*')
        .order('session_date', { ascending: true });

      if (votingError) throw votingError;
      setVotingSessions(votingData || []);

      // Load player votes
      const { data: votesData, error: votesError } = await supabase
        .from('player_votes')
        .select('*, voting_sessions(session_date), players(name)');

      if (votesError) throw votesError;

      // Transform votes data
      const votesObj = {};
      votesData.forEach(vote => {
        const sessionDate = vote.voting_sessions.session_date;
        const playerName = vote.players.name;
        
        if (!votesObj[sessionDate]) {
          votesObj[sessionDate] = {};
        }
        votesObj[sessionDate][playerName] = vote.vote_status;
      });
      setPlayerVotes(votesObj);

    } catch (err) {
      console.error('Error loading data:', err);
      setError('Failed to load data from database. Using offline mode.');
      setPlayersList(initialPlayers);
    } finally {
      setSyncing(false);
    }
  };

  // Seed initial players into database
  const seedInitialPlayers = async () => {
    try {
      const playersToInsert = initialPlayers.map(name => ({ name }));

      const { error } = await supabase
        .from('players')
        .insert(playersToInsert);

      if (error) throw error;

      // Reload data
      await loadDataFromDatabase();
    } catch (err) {
      console.error('Error seeding players:', err);
      setError('Failed to initialize database. Using offline mode.');
      setPlayersList(initialPlayers);
    }
  };

  // Get player ID from name
  const getPlayerId = async (playerName) => {
    const { data, error } = await supabase
      .from('players')
      .select('id')
      .eq('name', playerName)
      .single();

    if (error) throw error;
    return data.id;
  };

  const filteredPlayers = playersList.filter(player =>
    player.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const addPlayer = async () => {
    if (!newPlayerName.trim() || playersList.includes(newPlayerName.trim())) {
      return;
    }

    const playerName = newPlayerName.trim();

    if (dbConfigured && user) {
      try {
        const { error } = await supabase
          .from('players')
          .insert([{ name: playerName }]);

        if (error) throw error;

        setPlayersList([...playersList, playerName].sort());
        setNewPlayerName('');
        setShowAddPlayer(false);
      } catch (err) {
        console.error('Error adding player:', err);
        setError('Failed to add player to database');
      }
    } else {
      // Offline mode
      setPlayersList([...playersList, playerName].sort());
      setNewPlayerName('');
      setShowAddPlayer(false);
    }
  };

  const downloadExcel = () => {
    // Create workbook with multiple sheets
    const workbook = XLSX.utils.book_new();

    // Sheet 1: Weekly Expense Tracker (like the image format)
    const weeklyData = [];
    
    // Get current week dates
    const today = new Date();
    const currentWeekStart = new Date(today);
    currentWeekStart.setDate(today.getDate() - today.getDay()); // Start of current week (Sunday)
    
    // Create header row
    const headerRow = {
      'Players': 'Players',
      'Deposit': 'Deposit',
      'Balance Brought Forward': 'Balance Brought Forward',
      'Monday': 'Monday',
      'Tuesday': 'Tuesday', 
      'Wednesday': 'Wednesday',
      'Thursday': 'Thursday',
      'Friday': 'Friday',
      'Saturday': 'Saturday',
      'Sunday': 'Sunday',
      'Other Expenses Shortfall': 'Other Expenses/Shortfall',
      'Balance @ End of Week': 'Balance @ End of Week'
    };
    weeklyData.push(headerRow);

    // Add week dates as second row
    const weekDates = ['Week Dates', '', ''];
    for (let i = 1; i <= 7; i++) {
      const date = new Date(currentWeekStart);
      date.setDate(currentWeekStart.getDate() + i);
      weekDates.push(date.toLocaleDateString('en-GB', { day: '2-digit', month: '2-digit' }));
    }
    weekDates.push('', '');
    
    const weekDatesRow = {
      'Players': 'Week Dates',
      'Deposit': '',
      'Balance Brought Forward': '',
      'Monday': weekDates[3],
      'Tuesday': weekDates[4],
      'Wednesday': weekDates[5], 
      'Thursday': weekDates[6],
      'Friday': weekDates[7],
      'Saturday': weekDates[8],
      'Sunday': weekDates[9],
      'Other Expenses Shortfall': '',
      'Balance @ End of Week': ''
    };
    weeklyData.push(weekDatesRow);

    // Add player data rows
    playersList.forEach(player => {
      const deposit = deposits[player] || 0;
      const playerExpenses = expenses[player] || [];
      const balance = getPlayerBalance(player);
      
      // Calculate daily expenses for current week
      const dailyExpenses = {
        Monday: 0,
        Tuesday: 0,
        Wednesday: 0,
        Thursday: 0,
        Friday: 0,
        Saturday: 0,
        Sunday: 0
      };

      playerExpenses.forEach(expense => {
        const expenseDate = new Date(expense.date);
        const dayName = expenseDate.toLocaleDateString('en-US', { weekday: 'long' });
        
        // Check if expense is in current week
        const weekStart = new Date(currentWeekStart);
        const weekEnd = new Date(currentWeekStart);
        weekEnd.setDate(weekStart.getDate() + 6);
        
        if (expenseDate >= weekStart && expenseDate <= weekEnd) {
          if (dailyExpenses.hasOwnProperty(dayName)) {
            dailyExpenses[dayName] += parseFloat(expense.amount);
          }
        }
      });

      const playerRow = {
        'Players': player,
        'Deposit': deposit > 0 ? `£${deposit.toFixed(2)}` : '',
        'Balance Brought Forward': balance >= 0 ? `£${balance.toFixed(2)}` : `£${balance.toFixed(2)}`,
        'Monday': dailyExpenses.Monday > 0 ? `£${dailyExpenses.Monday.toFixed(2)}` : '',
        'Tuesday': dailyExpenses.Tuesday > 0 ? `£${dailyExpenses.Tuesday.toFixed(2)}` : '',
        'Wednesday': dailyExpenses.Wednesday > 0 ? `£${dailyExpenses.Wednesday.toFixed(2)}` : '',
        'Thursday': dailyExpenses.Thursday > 0 ? `£${dailyExpenses.Thursday.toFixed(2)}` : '',
        'Friday': dailyExpenses.Friday > 0 ? `£${dailyExpenses.Friday.toFixed(2)}` : '',
        'Saturday': dailyExpenses.Saturday > 0 ? `£${dailyExpenses.Saturday.toFixed(2)}` : '',
        'Sunday': dailyExpenses.Sunday > 0 ? `£${dailyExpenses.Sunday.toFixed(2)}` : '',
        'Other Expenses Shortfall': '',
        'Balance @ End of Week': balance >= 0 ? `£${balance.toFixed(2)}` : `£${balance.toFixed(2)}`
      };
      
      weeklyData.push(playerRow);
    });

    // Create worksheet for weekly tracker
    const weeklyWorksheet = XLSX.utils.json_to_sheet(weeklyData);
    
    // Set column widths
    weeklyWorksheet['!cols'] = [
      { wch: 12 }, // Players
      { wch: 10 }, // Deposit
      { wch: 18 }, // Balance Brought Forward
      { wch: 10 }, // Monday
      { wch: 10 }, // Tuesday
      { wch: 12 }, // Wednesday
      { wch: 10 }, // Thursday
      { wch: 10 }, // Friday
      { wch: 10 }, // Saturday
      { wch: 10 }, // Sunday
      { wch: 18 }, // Other Expenses
      { wch: 16 }  // Balance @ End of Week
    ];

    XLSX.utils.book_append_sheet(workbook, weeklyWorksheet, 'Weekly Tracker');

    // Sheet 2: Detailed Player Stats (original format)
    const detailedData = playersList.map(player => {
      const playerRatings = ratings[player] || {};
      const playerExpenses = expenses[player] || [];
      const totalExpenses = playerExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
      const deposit = deposits[player] || 0;
      const balance = getPlayerBalance(player);
      const games = gamesPlayed[player] || 0;

      const row = {
        'Player Name': player,
        'Skills Average': getPlayerAverage(player),
        'Games Played': games,
        'Deposit': deposit.toFixed(2),
        'Total Expenses': totalExpenses.toFixed(2),
        'Balance': balance.toFixed(2),
        'Number of Expenses': playerExpenses.length,
        'Average Expense': playerExpenses.length > 0 ? (totalExpenses / playerExpenses.length).toFixed(2) : '0.00',
      };

      // Add all skill ratings
      skillCategories.forEach(category => {
        category.skills.forEach(skill => {
          const key = `${category.name}-${skill}`;
          row[`${category.name} - ${skill}`] = playerRatings[key] || 0;
        });
      });

      return row;
    });

    const detailedWorksheet = XLSX.utils.json_to_sheet(detailedData);
    detailedWorksheet['!cols'] = Array(Object.keys(detailedData[0] || {}).length).fill({ wch: 15 });
    XLSX.utils.book_append_sheet(workbook, detailedWorksheet, 'Player Stats');

    // Sheet 3: Expense Details
    const expenseDetails = [];
    playersList.forEach(player => {
      const playerExpenses = expenses[player] || [];
      playerExpenses.forEach(expense => {
        expenseDetails.push({
          'Player': player,
          'Date': expense.date,
          'Amount': parseFloat(expense.amount).toFixed(2),
          'Description': expense.description || 'No description',
          'Day of Week': new Date(expense.date).toLocaleDateString('en-US', { weekday: 'long' })
        });
      });
    });

    if (expenseDetails.length > 0) {
      const expenseWorksheet = XLSX.utils.json_to_sheet(expenseDetails);
      expenseWorksheet['!cols'] = [
        { wch: 15 }, // Player
        { wch: 12 }, // Date
        { wch: 10 }, // Amount
        { wch: 25 }, // Description
        { wch: 12 }  // Day of Week
      ];
      XLSX.utils.book_append_sheet(workbook, expenseWorksheet, 'Expense Details');
    }

    // Generate filename with current week
    const weekStartStr = currentWeekStart.toISOString().split('T')[0];
    const filename = `Badminton_Club_Weekly_Tracker_${weekStartStr}.xlsx`;
    
    XLSX.writeFile(workbook, filename);
  };

  const updateRating = async (player, category, skill, value) => {
    // Update local state immediately
    setRatings(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        [`${category}-${skill}`]: value
      }
    }));

    // Save to database if configured
    if (dbConfigured && user) {
      try {
        const playerId = await getPlayerId(player);

        const { error } = await supabase
          .from('skill_ratings')
          .upsert({
            player_id: playerId,
            category: category.toLowerCase(),
            skill_name: skill.toLowerCase(),
            rating: value,
            updated_by: user.id
          }, {
            onConflict: 'player_id,category,skill_name'
          });

        if (error) throw error;
      } catch (err) {
        console.error('Error updating rating:', err);
        setError('Failed to save rating to database');
      }
    }
  };

  const getPlayerAverage = (player) => {
    const playerRatings = ratings[player] || {};
    const values = Object.values(playerRatings).filter(v => v > 0);
    if (values.length === 0) return 0;
    return (values.reduce((a, b) => a + b, 0) / values.length).toFixed(1);
  };

  const getTopPerformers = () => {
    return playersList
      .map(player => ({
        name: player,
        avg: parseFloat(getPlayerAverage(player))
      }))
      .filter(p => p.avg > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  };

  const getTopExpenses = () => {
    return playersList
      .map(player => {
        const playerExpenses = expenses[player] || [];
        const totalExpenses = playerExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
        const deposit = deposits[player] || 0;
        const balance = getPlayerBalance(player);
        return {
          name: player,
          totalExpenses: totalExpenses,
          expenseCount: playerExpenses.length,
          deposit: deposit,
          balance: balance
        };
      })
      .filter(p => p.totalExpenses > 0 || p.deposit > 0)
      .sort((a, b) => b.totalExpenses - a.totalExpenses)
      .slice(0, 5);
  };

  const handleSignOut = async () => {
    if (dbConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setRatings({});
    setPlayersList(initialPlayers);
  };

  // Expense management functions
  const openExpenseModal = (player = '') => {
    setExpensePlayer(player);
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseDate(new Date().toISOString().split('T')[0]);
    setShowExpenseModal(true);
  };

  const closeExpenseModal = () => {
    setShowExpenseModal(false);
    setExpensePlayer('');
    setExpenseAmount('');
    setExpenseDescription('');
    setExpenseDate('');
  };

  const addExpense = async () => {
    if (!expensePlayer || !expenseAmount) return;

    const newExpense = {
      amount: parseFloat(expenseAmount),
      description: expenseDescription,
      date: expenseDate,
      id: Date.now()
    };

    // Update local state immediately
    setExpenses(prev => ({
      ...prev,
      [expensePlayer]: [...(prev[expensePlayer] || []), newExpense]
    }));

    // Save to database if configured
    if (dbConfigured && user) {
      try {
        const playerId = await getPlayerId(expensePlayer);

        const { error } = await supabase
          .from('expenses')
          .insert({
            player_id: playerId,
            amount: parseFloat(expenseAmount),
            description: expenseDescription,
            date: expenseDate,
            created_by: user.id
          });

        if (error) throw error;

        // Reload expenses to get the actual ID
        const { data: expensesData, error: reloadError } = await supabase
          .from('expenses')
          .select('*, players(name)')
          .eq('players.name', expensePlayer)
          .order('date', { ascending: false });

        if (reloadError) throw reloadError;

        const expensesObj = {};
        expensesData.forEach(expense => {
          const playerName = expense.players.name;
          if (!expensesObj[playerName]) {
            expensesObj[playerName] = [];
          }
          expensesObj[playerName].push({
            id: expense.id,
            amount: expense.amount,
            description: expense.description,
            date: expense.date
          });
        });
        setExpenses(expensesObj);

      } catch (err) {
        console.error('Error adding expense:', err);
        setError('Failed to save expense to database');
      }
    }

    closeExpenseModal();
  };

  const deleteExpense = async (player, expenseId) => {
    // Update local state immediately
    setExpenses(prev => ({
      ...prev,
      [player]: (prev[player] || []).filter(exp => exp.id !== expenseId)
    }));

    // Delete from database if configured
    if (dbConfigured && user) {
      try {
        const { error } = await supabase
          .from('expenses')
          .delete()
          .eq('id', expenseId);

        if (error) throw error;
      } catch (err) {
        console.error('Error deleting expense:', err);
        setError('Failed to delete expense from database');
      }
    }
  };

  const getPlayerExpenseTotal = (player) => {
    const playerExpenses = expenses[player] || [];
    return playerExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
  };

  const getTotalExpenses = () => {
    return Object.values(expenses).reduce((total, playerExpenses) => {
      return total + playerExpenses.reduce((sum, exp) => sum + parseFloat(exp.amount || 0), 0);
    }, 0);
  };

  // Deposit management functions
  const openDepositModal = (player = '') => {
    setDepositPlayer(player);
    setDepositAmount('');
    setShowDepositModal(true);
  };

  const closeDepositModal = () => {
    setShowDepositModal(false);
    setDepositPlayer('');
    setDepositAmount('');
  };

  const addDeposit = async () => {
    if (!depositPlayer || !depositAmount) return;

    const amount = parseFloat(depositAmount);
    if (isNaN(amount) || amount <= 0) return;

    // Update local state immediately
    setDeposits(prev => ({
      ...prev,
      [depositPlayer]: amount
    }));

    // Save to database if configured
    if (dbConfigured && user) {
      try {
        const playerId = await getPlayerId(depositPlayer);

        const { error } = await supabase
          .from('deposits')
          .upsert({
            player_id: playerId,
            amount: amount,
            updated_by: user.id
          }, {
            onConflict: 'player_id'
          });

        if (error) throw error;
      } catch (err) {
        console.error('Error adding deposit:', err);
        setError('Failed to save deposit to database');
      }
    }

    closeDepositModal();
  };

  const getPlayerBalance = (player) => {
    const deposit = deposits[player] || 0;
    const totalExpenses = getPlayerExpenseTotal(player);
    return deposit - totalExpenses;
  };

  // Player management functions
  const openReplacePlayerModal = (player) => {
    setPlayerToReplace(player);
    setNewPlayerNameForReplace('');
    setShowReplacePlayerModal(true);
  };

  const closeReplacePlayerModal = () => {
    setShowReplacePlayerModal(false);
    setPlayerToReplace('');
    setNewPlayerNameForReplace('');
  };

  const replacePlayer = async () => {
    if (!playerToReplace || !newPlayerNameForReplace.trim()) return;

    const oldName = playerToReplace;
    const newName = newPlayerNameForReplace.trim();

    // Update local state
    setPlayersList(prev => prev.map(p => p === oldName ? newName : p));
    
    // Update ratings
    if (ratings[oldName]) {
      setRatings(prev => {
        const newRatings = { ...prev };
        newRatings[newName] = newRatings[oldName];
        delete newRatings[oldName];
        return newRatings;
      });
    }

    // Update expenses
    if (expenses[oldName]) {
      setExpenses(prev => {
        const newExpenses = { ...prev };
        newExpenses[newName] = newExpenses[oldName];
        delete newExpenses[oldName];
        return newExpenses;
      });
    }

    // Update deposits
    if (deposits[oldName]) {
      setDeposits(prev => {
        const newDeposits = { ...prev };
        newDeposits[newName] = newDeposits[oldName];
        delete newDeposits[oldName];
        return newDeposits;
      });
    }

    // Update games played
    if (gamesPlayed[oldName]) {
      setGamesPlayed(prev => {
        const newGames = { ...prev };
        newGames[newName] = newGames[oldName];
        delete newGames[oldName];
        return newGames;
      });
    }

    // Update database if configured
    if (dbConfigured && user) {
      try {
        // Update player name in database
        const { error } = await supabase
          .from('players')
          .update({ name: newName })
          .eq('name', oldName);

        if (error) throw error;
      } catch (err) {
        console.error('Error replacing player in database:', err);
        setError('Failed to update player in database');
      }
    }

    // Reset selected player if it was the replaced one
    if (selectedPlayer === oldName) {
      setSelectedPlayer(newName);
    }

    closeReplacePlayerModal();
  };

  const removePlayer = async (playerName) => {
    if (!window.confirm(`Are you sure you want to remove ${playerName}? This will delete all their data.`)) {
      return;
    }

    // Update local state
    setPlayersList(prev => prev.filter(p => p !== playerName));
    
    // Remove from all data structures
    setRatings(prev => {
      const newRatings = { ...prev };
      delete newRatings[playerName];
      return newRatings;
    });

    setExpenses(prev => {
      const newExpenses = { ...prev };
      delete newExpenses[playerName];
      return newExpenses;
    });

    setDeposits(prev => {
      const newDeposits = { ...prev };
      delete newDeposits[playerName];
      return newDeposits;
    });

    setGamesPlayed(prev => {
      const newGames = { ...prev };
      delete newGames[playerName];
      return newGames;
    });

    // Remove from database if configured
    if (dbConfigured && user) {
      try {
        const { error } = await supabase
          .from('players')
          .delete()
          .eq('name', playerName);

        if (error) throw error;
      } catch (err) {
        console.error('Error removing player from database:', err);
        setError('Failed to remove player from database');
      }
    }

    // Reset selected player if it was the removed one
    if (selectedPlayer === playerName) {
      setSelectedPlayer(null);
    }
  };

  // Get weekly expense breakdown for a player
  const getWeeklyExpenseBreakdown = (player) => {
    const playerExpenses = expenses[player] || [];
    const weeks = {};
    
    playerExpenses.forEach(expense => {
      const date = new Date(expense.date);
      const weekStart = new Date(date);
      weekStart.setDate(date.getDate() - date.getDay()); // Start of week (Sunday)
      const weekKey = weekStart.toISOString().split('T')[0];
      
      if (!weeks[weekKey]) {
        weeks[weekKey] = {
          weekStart: weekStart,
          expenses: [],
          total: 0
        };
      }
      
      weeks[weekKey].expenses.push(expense);
      weeks[weekKey].total += parseFloat(expense.amount);
    });

    return Object.values(weeks).sort((a, b) => b.weekStart - a.weekStart);
  };

  // Voting system functions
  const openVotingModal = (date = '') => {
    setSelectedDate(date);
    setSessionTime('18:00');
    setSessionVenue('Regular Venue');
    setCostPerPlayer('10.00');
    setMaxPlayers('8');
    setSessionDescription('');
    setShowVotingModal(true);
  };

  const closeVotingModal = () => {
    setShowVotingModal(false);
    setSelectedDate('');
  };

  const createVotingSession = async () => {
    if (!selectedDate || !costPerPlayer) return;

    const sessionData = {
      session_date: selectedDate,
      session_time: sessionTime,
      venue: sessionVenue,
      cost_per_player: parseFloat(costPerPlayer),
      max_players: parseInt(maxPlayers),
      description: sessionDescription,
      status: 'open'
    };

    // Update local state
    setVotingSessions(prev => [...prev, { ...sessionData, id: Date.now() }]);

    // Save to database if configured
    if (dbConfigured && user) {
      try {
        const { error } = await supabase
          .from('voting_sessions')
          .insert({
            ...sessionData,
            created_by: user.id
          });

        if (error) throw error;
      } catch (err) {
        console.error('Error creating voting session:', err);
        setError('Failed to create voting session');
      }
    }

    closeVotingModal();
  };

  const submitVote = async (sessionDate, playerName, voteStatus) => {
    // Update local state
    setPlayerVotes(prev => ({
      ...prev,
      [sessionDate]: {
        ...prev[sessionDate],
        [playerName]: voteStatus
      }
    }));

    // Save to database if configured
    if (dbConfigured && user) {
      try {
        const session = votingSessions.find(s => s.session_date === sessionDate);
        const playerId = await getPlayerId(playerName);

        const { error } = await supabase
          .from('player_votes')
          .upsert({
            session_id: session.id,
            player_id: playerId,
            vote_status: voteStatus
          }, {
            onConflict: 'session_id,player_id'
          });

        if (error) throw error;
      } catch (err) {
        console.error('Error submitting vote:', err);
        setError('Failed to submit vote');
      }
    }
  };

  const completeSession = async (sessionDate) => {
    const session = votingSessions.find(s => s.session_date === sessionDate);
    const sessionVotes = playerVotes[sessionDate] || {};
    const yesVotes = Object.entries(sessionVotes).filter(([_, vote]) => vote === 'yes');

    if (yesVotes.length === 0) {
      alert('No players voted yes for this session');
      return;
    }

    // Add expenses for players who voted yes
    const costPerPlayer = session.cost_per_player;
    
    for (const [playerName] of yesVotes) {
      const newExpense = {
        player: playerName,
        amount: costPerPlayer,
        description: `Badminton session - ${session.venue}`,
        date: sessionDate
      };

      // Add to local expenses
      setExpenses(prev => ({
        ...prev,
        [playerName]: [...(prev[playerName] || []), { ...newExpense, id: Date.now() + Math.random() }]
      }));

      // Save to database if configured
      if (dbConfigured && user) {
        try {
          const playerId = await getPlayerId(playerName);
          await supabase
            .from('expenses')
            .insert({
              player_id: playerId,
              amount: costPerPlayer,
              description: newExpense.description,
              date: sessionDate,
              created_by: user.id
            });
        } catch (err) {
          console.error('Error adding expense for player:', playerName, err);
        }
      }
    }

    // Update session status
    setVotingSessions(prev => 
      prev.map(s => 
        s.session_date === sessionDate 
          ? { ...s, status: 'completed' }
          : s
      )
    );

    // Update database if configured
    if (dbConfigured && user) {
      try {
        await supabase
          .from('voting_sessions')
          .update({ status: 'completed' })
          .eq('session_date', sessionDate);
      } catch (err) {
        console.error('Error updating session status:', err);
      }
    }

    alert(`Session completed! Added £${costPerPlayer} expense for ${yesVotes.length} players.`);
  };

  const getVoteCount = (sessionDate, voteType) => {
    const sessionVotes = playerVotes[sessionDate] || {};
    return Object.values(sessionVotes).filter(vote => vote === voteType).length;
  };

  // Show loading screen
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center">
        <div className="text-center">
          <Loader className="animate-spin text-green-600 mx-auto mb-4" size={48} />
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // Show auth screen if database is configured but user is not logged in
  if (dbConfigured && !user) {
    return <Auth supabase={supabase} onAuthSuccess={() => {}} />;
  }

  // Show warning if database is not configured
  const showDbWarning = !dbConfigured;

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Database Warning */}
        {showDbWarning && (
          <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 mb-4 rounded">
            <div className="flex">
              <AlertCircle className="text-yellow-400 mr-3" size={24} />
              <div>
                <p className="text-sm text-yellow-700">
                  <strong>Offline Mode:</strong> Database not configured. Data will not persist.
                  See <strong>SUPABASE_SETUP.md</strong> for setup instructions.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-4 rounded">
            <div className="flex justify-between items-center">
              <div className="flex">
                <AlertCircle className="text-red-400 mr-3" size={24} />
                <p className="text-sm text-red-700">{error}</p>
              </div>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600">
                ×
              </button>
            </div>
          </div>
        )}

        {/* Header */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">🏸 Badminton Club Tracker</h1>
              <p className="text-gray-600">
                Player Performance & Expenses Management
                {dbConfigured && user && (
                  <span className="ml-2 text-sm text-green-600">
                    • {user.email}
                  </span>
                )}
                {syncing && (
                  <span className="ml-2 text-sm text-blue-600">
                    <Loader className="inline animate-spin" size={12} /> Syncing...
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setView('list')}
                className={`px-4 py-2 rounded-lg ${view === 'list' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
              >
                <Users size={20} />
              </button>
              <button
                onClick={() => setView('leaderboard')}
                className={`px-4 py-2 rounded-lg ${view === 'leaderboard' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
              >
                <Award size={20} />
              </button>
              <button
                onClick={() => setView('expenses')}
                className={`px-4 py-2 rounded-lg ${view === 'expenses' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
              >
                <DollarSign size={20} />
              </button>
              <button
                onClick={() => setView('statement')}
                className={`px-4 py-2 rounded-lg ${view === 'statement' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                title="Expense Statement"
              >
                📊
              </button>
              <button
                onClick={() => setView('voting')}
                className={`px-4 py-2 rounded-lg ${view === 'voting' ? 'bg-green-600 text-white' : 'bg-gray-200'}`}
                title="Voting Calendar"
              >
                🗳️
              </button>
              <button
                onClick={() => setShowPlayerManagement(true)}
                className="px-4 py-2 rounded-lg bg-orange-600 text-white hover:bg-orange-700"
                title="Manage Players"
              >
                ⚙️
              </button>
              <button
                onClick={() => setShowAddPlayer(true)}
                className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 flex items-center gap-2"
              >
                <UserPlus size={20} />
                <span className="hidden md:inline">Add Player</span>
              </button>
              <button
                onClick={downloadExcel}
                className="px-4 py-2 rounded-lg bg-purple-600 text-white hover:bg-purple-700 flex items-center gap-2"
              >
                <Download size={20} />
                <span className="hidden md:inline">Export</span>
              </button>
              {dbConfigured && user && (
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 flex items-center gap-2"
                >
                  <LogOut size={20} />
                  <span className="hidden md:inline">Sign Out</span>
                </button>
              )}
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-3 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Search players..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
            />
          </div>
        </div>

        {/* Add Player Modal */}
        {showAddPlayer && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Add New Player</h3>
              <input
                type="text"
                value={newPlayerName}
                onChange={(e) => setNewPlayerName(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && addPlayer()}
                placeholder="Enter player name"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 mb-4"
                autoFocus
              />
              <div className="flex gap-2">
                <button
                  onClick={addPlayer}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Add Player
                </button>
                <button
                  onClick={() => {
                    setShowAddPlayer(false);
                    setNewPlayerName('');
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Expense Modal */}
        {showExpenseModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Add Expense</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Player</label>
                  <select
                    value={expensePlayer}
                    onChange={(e) => setExpensePlayer(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select a player</option>
                    {playersList.map(player => (
                      <option key={player} value={player}>{player}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={expenseAmount}
                    onChange={(e) => setExpenseAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                  <input
                    type="text"
                    value={expenseDescription}
                    onChange={(e) => setExpenseDescription(e.target.value)}
                    placeholder="What is this expense for?"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={expenseDate}
                    onChange={(e) => setExpenseDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={addExpense}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                >
                  Add Expense
                </button>
                <button
                  onClick={closeExpenseModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Add Deposit Modal */}
        {showDepositModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Set Deposit</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Player</label>
                  <select
                    value={depositPlayer}
                    onChange={(e) => setDepositPlayer(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  >
                    <option value="">Select a player</option>
                    {playersList.map(player => (
                      <option key={player} value={player}>{player}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Deposit Amount (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={depositAmount}
                    onChange={(e) => setDepositAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={addDeposit}
                  className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 font-medium"
                >
                  Set Deposit
                </button>
                <button
                  onClick={closeDepositModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Player Management Modal */}
        {showPlayerManagement && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-2xl w-full max-h-96 overflow-y-auto">
              <h3 className="text-xl font-bold mb-4">Manage Players</h3>
              <div className="space-y-3">
                {playersList.map(player => (
                  <div key={player} className="flex justify-between items-center p-3 border rounded-lg">
                    <div>
                      <span className="font-medium">{player}</span>
                      <div className="text-sm text-gray-600">
                        Balance: £{getPlayerBalance(player).toFixed(2)} | 
                        Games: {gamesPlayed[player] || 0} | 
                        Expenses: {(expenses[player] || []).length}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => openReplacePlayerModal(player)}
                        className="px-3 py-1 bg-blue-600 text-white rounded text-sm hover:bg-blue-700"
                      >
                        Replace
                      </button>
                      <button
                        onClick={() => removePlayer(player)}
                        className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              <div className="flex justify-end mt-6">
                <button
                  onClick={() => setShowPlayerManagement(false)}
                  className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Replace Player Modal */}
        {showReplacePlayerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Replace Player</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Replacing: <strong>{playerToReplace}</strong>
                  </label>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">New Player Name</label>
                  <input
                    type="text"
                    value={newPlayerNameForReplace}
                    onChange={(e) => setNewPlayerNameForReplace(e.target.value)}
                    placeholder="Enter new player name"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={replacePlayer}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Replace Player
                </button>
                <button
                  onClick={closeReplacePlayerModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Create Voting Session Modal */}
        {showVotingModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
              <h3 className="text-xl font-bold mb-4">Create Voting Session</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Session Date</label>
                  <input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Time</label>
                  <input
                    type="time"
                    value={sessionTime}
                    onChange={(e) => setSessionTime(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Venue</label>
                  <input
                    type="text"
                    value={sessionVenue}
                    onChange={(e) => setSessionVenue(e.target.value)}
                    placeholder="Regular Venue"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Cost per Player (£)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={costPerPlayer}
                    onChange={(e) => setCostPerPlayer(e.target.value)}
                    placeholder="10.00"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Max Players</label>
                  <input
                    type="number"
                    value={maxPlayers}
                    onChange={(e) => setMaxPlayers(e.target.value)}
                    placeholder="8"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                  <textarea
                    value={sessionDescription}
                    onChange={(e) => setSessionDescription(e.target.value)}
                    placeholder="Additional details about the session..."
                    rows="3"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
              <div className="flex gap-2 mt-6">
                <button
                  onClick={createVotingSession}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 font-medium"
                >
                  Create Session
                </button>
                <button
                  onClick={closeVotingModal}
                  className="flex-1 bg-gray-200 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-300 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Leaderboard View */}
        {view === 'leaderboard' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <Award className="text-yellow-500" />
                Top Performers (Skills)
              </h2>
              <div className="space-y-3">
                {getTopPerformers().map((player, index) => (
                  <div key={player.name} className="flex items-center gap-4 p-4 bg-gradient-to-r from-yellow-50 to-green-50 rounded-lg">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-white ${
                      index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-gray-400' : index === 2 ? 'bg-orange-600' : 'bg-green-600'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-sm text-gray-600">{player.sessionsAttended} training sessions</p>
                    </div>
                    <div className="text-2xl font-bold text-green-700">{player.avg}</div>
                  </div>
                ))}
                {getTopPerformers().length === 0 && (
                  <p className="text-gray-500 text-center py-8">No ratings yet. Start rating players!</p>
                )}
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <DollarSign className="text-red-500" />
                Financial Overview
              </h2>
              <div className="space-y-3">
                {getTopExpenses().map((player, index) => (
                  <div key={player.name} className="flex items-center gap-4 p-4 bg-gradient-to-r from-red-50 to-orange-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-red-600 flex items-center justify-center font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{player.name}</p>
                      <p className="text-sm text-gray-600">
                        Deposit: £{player.deposit.toFixed(2)} | {player.expenseCount} expenses
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-lg font-bold text-red-700">£{player.totalExpenses.toFixed(2)}</div>
                      <div className={`text-sm font-medium ${player.balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        Balance: £{player.balance.toFixed(2)}
                      </div>
                    </div>
                  </div>
                ))}
                {getTopExpenses().length === 0 && (
                  <p className="text-gray-500 text-center py-8">No financial data recorded yet.</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Expenses View */}
        {view === 'expenses' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold flex items-center gap-2">
                    <DollarSign className="text-green-600" />
                    Player Expenses
                  </h2>
                  <p className="text-gray-600 mt-1">Track and manage player expenses</p>
                </div>
                <div className="text-right">
                  <div className="text-sm text-gray-600">Total Expenses</div>
                  <div className="text-3xl font-bold text-green-600">£{getTotalExpenses().toFixed(2)}</div>
                </div>
              </div>

              <button
                onClick={() => openExpenseModal()}
                className="w-full mb-6 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 font-medium flex items-center justify-center gap-2"
              >
                <DollarSign size={20} />
                Add New Expense
              </button>

              {/* Expenses Summary Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">Player</th>
                      <th className="px-6 py-3 text-right text-sm font-semibold text-gray-700">Total Expenses</th>
                      <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">Transactions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {playersList
                      .filter(player => (expenses[player] || []).length > 0)
                      .map(player => {
                        const playerExpenses = expenses[player] || [];
                        const total = getPlayerExpenseTotal(player);
                        return (
                          <tr key={player} className="hover:bg-gray-50">
                            <td className="px-6 py-4 font-medium text-gray-800">{player}</td>
                            <td className="px-6 py-4 text-right font-bold text-green-600">
                              £{total.toFixed(2)}
                            </td>
                            <td className="px-6 py-4 text-center text-gray-600">
                              {playerExpenses.length}
                            </td>
                          </tr>
                        );
                      })}
                    {playersList.filter(player => (expenses[player] || []).length > 0).length === 0 && (
                      <tr>
                        <td colSpan="3" className="px-6 py-8 text-center text-gray-500">
                          No expenses recorded yet. Click "Add New Expense" to get started.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Detailed Expenses by Player */}
            {playersList
              .filter(player => (expenses[player] || []).length > 0)
              .map(player => {
                const playerExpenses = expenses[player] || [];
                return (
                  <div key={player} className="bg-white rounded-lg shadow-lg p-6">
                    <h3 className="text-xl font-bold mb-4 flex items-center justify-between">
                      <span>{player}</span>
                      <span className="text-green-600">£{getPlayerExpenseTotal(player).toFixed(2)}</span>
                    </h3>
                    <div className="space-y-3">
                      {playerExpenses
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map(expense => (
                          <div
                            key={expense.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100"
                          >
                            <div className="flex-1">
                              <div className="font-medium text-gray-800">
                                {expense.description || 'No description'}
                              </div>
                              <div className="text-sm text-gray-600">{expense.date}</div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div className="text-lg font-bold text-green-600">
                                £{parseFloat(expense.amount).toFixed(2)}
                              </div>
                              <button
                                onClick={() => deleteExpense(player, expense.id)}
                                className="text-red-600 hover:text-red-800 font-medium text-sm"
                              >
                                Delete
                              </button>
                            </div>
                          </div>
                        ))}
                    </div>
                  </div>
                );
              })}
          </div>
        )}

        {/* Player List View */}
        {view === 'list' && !selectedPlayer && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h2 className="text-xl font-bold mb-4">Select a Player ({filteredPlayers.length})</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
              {filteredPlayers.map(player => {
                const playerExpenses = expenses[player] || [];
                const totalExpenses = playerExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                const expenseCount = playerExpenses.length;
                const deposit = deposits[player] || 0;
                const balance = getPlayerBalance(player);

                return (
                  <button
                    key={player}
                    onClick={() => setSelectedPlayer(player)}
                    className="p-4 border-2 border-gray-200 rounded-lg hover:border-green-500 hover:bg-green-50 transition-colors text-left"
                  >
                    <div className="flex justify-between items-start">
                      <span className="font-medium">{player}</span>
                      <div className="flex flex-col items-end gap-1">
                        {getPlayerAverage(player) > 0 && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs font-bold">
                            {getPlayerAverage(player)}
                          </span>
                        )}
                        {deposit > 0 && (
                          <span className="bg-green-100 text-green-700 px-2 py-1 rounded-full text-xs">
                            Deposit: £{deposit.toFixed(2)}
                          </span>
                        )}
                        {(deposit > 0 || totalExpenses > 0) && (
                          <span className={`px-2 py-1 rounded-full text-xs font-bold ${balance >= 0 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                            Balance: £{balance.toFixed(2)}
                          </span>
                        )}
                        {expenseCount > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                            {expenseCount} expenses
                          </span>
                        )}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Expense Statement View */}
        {view === 'statement' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                📊 Player Expense Statements
              </h2>
              
              <div className="grid gap-6">
                {playersList.map(player => {
                  const deposit = deposits[player] || 0;
                  const totalExpenses = getPlayerExpenseTotal(player);
                  const balance = getPlayerBalance(player);
                  const games = gamesPlayed[player] || 0;
                  const weeklyBreakdown = getWeeklyExpenseBreakdown(player);
                  
                  return (
                    <div key={player} className="border rounded-lg p-6 bg-gray-50">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-xl font-bold text-gray-800">{player}</h3>
                          <p className="text-gray-600">Financial Statement</p>
                        </div>
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            £{balance.toFixed(2)}
                          </div>
                          <div className="text-sm text-gray-600">Current Balance</div>
                        </div>
                      </div>

                      {/* Summary Row */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                        <div className="bg-white p-3 rounded text-center">
                          <div className="text-lg font-bold text-green-600">£{deposit.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">Deposit</div>
                        </div>
                        <div className="bg-white p-3 rounded text-center">
                          <div className="text-lg font-bold text-blue-600">{games}</div>
                          <div className="text-xs text-gray-600">Games Played</div>
                        </div>
                        <div className="bg-white p-3 rounded text-center">
                          <div className="text-lg font-bold text-red-600">£{totalExpenses.toFixed(2)}</div>
                          <div className="text-xs text-gray-600">Total Expenses</div>
                        </div>
                        <div className="bg-white p-3 rounded text-center">
                          <div className={`text-lg font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            £{balance.toFixed(2)}
                          </div>
                          <div className="text-xs text-gray-600">Balance</div>
                        </div>
                      </div>

                      {/* Weekly Breakdown */}
                      {weeklyBreakdown.length > 0 && (
                        <div>
                          <h4 className="font-semibold text-gray-700 mb-3">Weekly Expense Breakdown</h4>
                          <div className="space-y-2 max-h-48 overflow-y-auto">
                            {weeklyBreakdown.map((week, index) => (
                              <div key={index} className="bg-white p-3 rounded border">
                                <div className="flex justify-between items-center">
                                  <div>
                                    <div className="font-medium">
                                      Week of {week.weekStart.toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-gray-600">
                                      {week.expenses.length} transaction{week.expenses.length !== 1 ? 's' : ''}
                                    </div>
                                  </div>
                                  <div className="text-right">
                                    <div className="font-bold text-red-600">£{week.total.toFixed(2)}</div>
                                  </div>
                                </div>
                                <div className="mt-2 space-y-1">
                                  {week.expenses.map((expense, expIndex) => (
                                    <div key={expIndex} className="text-sm text-gray-600 flex justify-between">
                                      <span>{expense.description || 'No description'}</span>
                                      <span>£{parseFloat(expense.amount).toFixed(2)}</span>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {weeklyBreakdown.length === 0 && (
                        <div className="text-center py-4 text-gray-500">
                          No expenses recorded for this player
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* Voting Calendar View */}
        {view === 'voting' && (
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold flex items-center gap-2">
                  🗳️ Session Voting Calendar
                </h2>
                <button
                  onClick={() => openVotingModal()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Create Session
                </button>
              </div>

              {/* Upcoming Sessions */}
              <div className="space-y-4">
                {votingSessions
                  .filter(session => new Date(session.session_date) >= new Date())
                  .map(session => {
                    const yesVotes = getVoteCount(session.session_date, 'yes');
                    const noVotes = getVoteCount(session.session_date, 'no');
                    const maybeVotes = getVoteCount(session.session_date, 'maybe');
                    
                    return (
                      <div key={session.id} className="border rounded-lg p-4 bg-gray-50">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-lg font-bold">
                              {new Date(session.session_date).toLocaleDateString('en-GB', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </h3>
                            <p className="text-gray-600">
                              {session.session_time} at {session.venue} • £{session.cost_per_player} per player
                            </p>
                            {session.description && (
                              <p className="text-sm text-gray-500 mt-1">{session.description}</p>
                            )}
                          </div>
                          <div className="text-right">
                            <div className={`px-3 py-1 rounded text-sm font-medium ${
                              session.status === 'completed' ? 'bg-green-100 text-green-700' :
                              session.status === 'closed' ? 'bg-red-100 text-red-700' :
                              'bg-blue-100 text-blue-700'
                            }`}>
                              {session.status.charAt(0).toUpperCase() + session.status.slice(1)}
                            </div>
                          </div>
                        </div>

                        {/* Vote Summary */}
                        <div className="flex gap-4 mb-4 text-sm">
                          <span className="text-green-600 font-medium">✓ Yes: {yesVotes}</span>
                          <span className="text-red-600 font-medium">✗ No: {noVotes}</span>
                          <span className="text-yellow-600 font-medium">? Maybe: {maybeVotes}</span>
                        </div>

                        {/* Player Voting Grid */}
                        {session.status === 'open' && (
                          <div>
                            <h4 className="font-medium mb-3">Player Votes:</h4>
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                              {playersList.map(player => {
                                const playerVote = playerVotes[session.session_date]?.[player];
                                
                                return (
                                  <div key={player} className="border rounded p-2 bg-white">
                                    <div className="text-sm font-medium mb-2">{player}</div>
                                    <div className="flex gap-1">
                                      <button
                                        onClick={() => submitVote(session.session_date, player, 'yes')}
                                        className={`px-2 py-1 text-xs rounded ${
                                          playerVote === 'yes' 
                                            ? 'bg-green-600 text-white' 
                                            : 'bg-gray-200 hover:bg-green-100'
                                        }`}
                                      >
                                        ✓
                                      </button>
                                      <button
                                        onClick={() => submitVote(session.session_date, player, 'no')}
                                        className={`px-2 py-1 text-xs rounded ${
                                          playerVote === 'no' 
                                            ? 'bg-red-600 text-white' 
                                            : 'bg-gray-200 hover:bg-red-100'
                                        }`}
                                      >
                                        ✗
                                      </button>
                                      <button
                                        onClick={() => submitVote(session.session_date, player, 'maybe')}
                                        className={`px-2 py-1 text-xs rounded ${
                                          playerVote === 'maybe' 
                                            ? 'bg-yellow-600 text-white' 
                                            : 'bg-gray-200 hover:bg-yellow-100'
                                        }`}
                                      >
                                        ?
                                      </button>
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        )}

                        {/* Complete Session Button */}
                        {session.status === 'open' && yesVotes > 0 && (
                          <div className="mt-4 pt-4 border-t">
                            <button
                              onClick={() => completeSession(session.session_date)}
                              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                            >
                              Complete Session & Add Expenses ({yesVotes} players)
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}

                {votingSessions.filter(session => new Date(session.session_date) >= new Date()).length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No upcoming sessions. Create one to start voting!
                  </div>
                )}
              </div>

              {/* Past Sessions */}
              {votingSessions.filter(session => new Date(session.session_date) < new Date()).length > 0 && (
                <div className="mt-8">
                  <h3 className="text-lg font-bold mb-4">Past Sessions</h3>
                  <div className="space-y-2">
                    {votingSessions
                      .filter(session => new Date(session.session_date) < new Date())
                      .slice(0, 5)
                      .map(session => {
                        const yesVotes = getVoteCount(session.session_date, 'yes');
                        
                        return (
                          <div key={session.id} className="flex justify-between items-center p-3 bg-gray-100 rounded">
                            <div>
                              <span className="font-medium">
                                {new Date(session.session_date).toLocaleDateString('en-GB')}
                              </span>
                              <span className="text-gray-600 ml-2">
                                {session.venue} • £{session.cost_per_player}
                              </span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-green-600 font-medium">{yesVotes} players</span>
                              <span className={`px-2 py-1 rounded text-xs ${
                                session.status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-gray-200'
                              }`}>
                                {session.status}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Player Rating View */}
        {view === 'list' && selectedPlayer && (
          <div className="space-y-4">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="text-green-600 hover:text-green-700 font-medium"
            >
              ← Back to Player List
            </button>

            <div className="bg-white rounded-lg shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold text-gray-800">{selectedPlayer}</h2>
                  <p className="text-gray-600">Player Profile & Expense Summary</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{getPlayerAverage(selectedPlayer)}</div>
                  <div className="text-sm text-gray-500">Skills Average</div>
                </div>
              </div>

              {/* Player Financial Summary */}
              <div className="mb-8 p-6 bg-blue-50 rounded-lg">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-lg font-bold text-gray-700">Financial Summary</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => openDepositModal(selectedPlayer)}
                      className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                    >
                      Set Deposit
                    </button>
                    <button
                      onClick={() => openExpenseModal(selectedPlayer)}
                      className="px-3 py-1 bg-red-600 text-white rounded text-sm hover:bg-red-700"
                    >
                      Add Expense
                    </button>
                  </div>
                </div>
                {(() => {
                  const playerExpenses = expenses[selectedPlayer] || [];
                  const totalExpenses = playerExpenses.reduce((sum, expense) => sum + parseFloat(expense.amount), 0);
                  const expenseCount = playerExpenses.length;
                  const avgExpense = expenseCount > 0 ? totalExpenses / expenseCount : 0;
                  const deposit = deposits[selectedPlayer] || 0;
                  const balance = getPlayerBalance(selectedPlayer);
                  const recentExpenses = playerExpenses.slice(0, 3); // Show last 3 expenses

                  return (
                    <div>
                      {/* Summary Stats */}
                      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
                        <div className="bg-white p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-600">Deposit</div>
                          <div className="text-2xl font-bold text-green-600">
                            £{deposit.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-600">Total Expenses</div>
                          <div className="text-2xl font-bold text-red-600">
                            £{totalExpenses.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-600">Balance</div>
                          <div className={`text-2xl font-bold ${balance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            £{balance.toFixed(2)}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-600">Number of Expenses</div>
                          <div className="text-2xl font-bold text-blue-600">
                            {expenseCount}
                          </div>
                        </div>
                        <div className="bg-white p-4 rounded-lg text-center">
                          <div className="text-sm text-gray-600">Average Expense</div>
                          <div className="text-2xl font-bold text-purple-600">
                            £{avgExpense.toFixed(2)}
                          </div>
                        </div>
                      </div>

                      {/* Recent Expenses */}
                      {recentExpenses.length > 0 && (
                        <div>
                          <h4 className="text-md font-semibold text-gray-700 mb-3">Recent Expenses</h4>
                          <div className="space-y-2">
                            {recentExpenses.map((expense, index) => (
                              <div key={expense.id || index} className="bg-white p-3 rounded-lg flex justify-between items-center">
                                <div>
                                  <div className="font-medium text-gray-800">
                                    {expense.description || 'No description'}
                                  </div>
                                  <div className="text-sm text-gray-500">
                                    {new Date(expense.date).toLocaleDateString()}
                                  </div>
                                </div>
                                <div className="text-lg font-bold text-red-600">
                                  £{parseFloat(expense.amount).toFixed(2)}
                                </div>
                              </div>
                            ))}
                          </div>
                          {expenseCount > 3 && (
                            <div className="mt-3 text-center">
                              <button
                                onClick={() => setView('expenses')}
                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                              >
                                View all {expenseCount} expenses →
                              </button>
                            </div>
                          )}
                        </div>
                      )}

                      {/* No expenses message */}
                      {expenseCount === 0 && (
                        <div className="text-center py-8">
                          <div className="text-gray-500 mb-4">No expenses recorded for this player</div>
                          <button
                            onClick={() => openExpenseModal(selectedPlayer)}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                          >
                            Add First Expense
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Skills Rating */}
              <h3 className="text-lg font-bold text-gray-700 mb-4">Skills Rating (1-10)</h3>
              {skillCategories.map(category => (
                <div key={category.name} className="mb-6 pb-6 border-b last:border-b-0">
                  <h4 className="text-md font-bold text-gray-700 mb-4">{category.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {category.skills.map(skill => {
                      const key = `${category.name}-${skill}`;
                      const currentRating = ratings[selectedPlayer]?.[key] || 0;

                      return (
                        <div key={skill} className="bg-gray-50 p-4 rounded-lg">
                          <div className="flex justify-between mb-2">
                            <span className="font-medium text-gray-700">{skill}</span>
                            <span className="font-bold text-green-600">{currentRating}/10</span>
                          </div>
                          <div className="flex gap-1">
                            {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(value => (
                              <button
                                key={value}
                                onClick={() => updateRating(selectedPlayer, category.name, skill, value)}
                                className={`flex-1 h-8 rounded transition-colors ${
                                  value <= currentRating
                                    ? 'bg-green-500 hover:bg-green-600'
                                    : 'bg-gray-200 hover:bg-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TrainingTracker;
