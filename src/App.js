import React, { useState, useEffect } from 'react';
import { Search, Award, Users, Calendar, UserPlus, Download, LogOut, Loader, AlertCircle, DollarSign } from 'lucide-react';
import * as XLSX from 'xlsx';
import { supabase, isSupabaseConfigured } from './supabaseClient';
import Auth from './Auth';

const TrainingTracker = () => {
  // Initial hardcoded players list for seeding
  const initialPlayers = [
    "John Smith", "Sarah Johnson", "Michael Chen", "Emily Davis", "David Williams",
    "Lisa Anderson", "James Brown", "Emma Martinez", "Robert Wilson", "Maria Garcia"
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
  const [netsData, setNetsData] = useState({});
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

      // Load nets data
      const { data: netsDataResult, error: netsError } = await supabase
        .from('nets_data')
        .select('*, players(name)');

      if (netsError) throw netsError;

      // Transform nets data
      const netsObj = {};
      netsDataResult.forEach(nets => {
        const playerName = nets.players.name;
        netsObj[playerName] = {
          presentInNets: nets.present_in_nets,
          worksOnTechnique: nets.works_on_technique,
          timesGotOut: nets.times_got_out,
          wicketsTaken: nets.wickets_taken,
          bowlingExtras: nets.bowling_extras
        };
      });
      setNetsData(netsObj);

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
    const exportData = playersList.map(player => {
      const playerRatings = ratings[player] || {};
      const playerNets = netsData[player] || {};

      const row = {
        'Player Name': player,
        'Skills Average': getPlayerAverage(player),
        'Present in Nets': playerNets.presentInNets || 0,
        'Works on Technique': playerNets.worksOnTechnique || 'No',
        'Times Got Out': playerNets.timesGotOut || 0,
        'Wickets Taken': playerNets.wicketsTaken || 0,
        'Bowling Extras': playerNets.bowlingExtras || 0,
      };

      // Add all skill ratings
      skillCategories.forEach(category => {
        category.skills.forEach(skill => {
          const key = `${category.name}-${skill}`;
          row[`${category.name} - ${skill}`] = playerRatings[key] || 0;
        });
      });

      // Add calculated stats
      if (playerNets.presentInNets > 0) {
        if (playerNets.timesGotOut > 0) {
          row['Dismissal Rate (%)'] = ((playerNets.timesGotOut / playerNets.presentInNets) * 100).toFixed(1);
        }
        if (playerNets.wicketsTaken > 0) {
          row['Wickets per Session'] = (playerNets.wicketsTaken / playerNets.presentInNets).toFixed(1);
        }
        if (playerNets.bowlingExtras > 0) {
          row['Extras per Session'] = (playerNets.bowlingExtras / playerNets.presentInNets).toFixed(1);
        }
      }

      return row;
    });

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Player Stats');

    // Auto-size columns
    const maxWidth = exportData.reduce((w, r) => Math.max(w, Object.keys(r).length), 10);
    worksheet['!cols'] = Array(maxWidth).fill({ wch: 15 });

    XLSX.writeFile(workbook, `Badminton_Club_Stats_${new Date().toISOString().split('T')[0]}.xlsx`);
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

  const updateNetsData = async (player, field, value) => {
    // Update local state immediately
    setNetsData(prev => ({
      ...prev,
      [player]: {
        ...prev[player],
        [field]: value
      }
    }));

    // Save to database if configured
    if (dbConfigured && user) {
      try {
        const playerId = await getPlayerId(player);

        // Get current nets data for this player
        const currentData = netsData[player] || {};
        const updatedData = { ...currentData, [field]: value };

        const { error } = await supabase
          .from('nets_data')
          .upsert({
            player_id: playerId,
            present_in_nets: updatedData.presentInNets || 0,
            works_on_technique: updatedData.worksOnTechnique || 'No',
            times_got_out: updatedData.timesGotOut || 0,
            wickets_taken: updatedData.wicketsTaken || 0,
            bowling_extras: updatedData.bowlingExtras || 0,
            updated_by: user.id
          }, {
            onConflict: 'player_id'
          });

        if (error) throw error;
      } catch (err) {
        console.error('Error updating nets data:', err);
        setError('Failed to save nets data to database');
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
        avg: parseFloat(getPlayerAverage(player)),
        netsAttendance: netsData[player]?.presentInNets || 0
      }))
      .filter(p => p.avg > 0)
      .sort((a, b) => b.avg - a.avg)
      .slice(0, 5);
  };

  const getBestAttendance = () => {
    return playersList
      .map(player => ({
        name: player,
        attendance: netsData[player]?.presentInNets || 0
      }))
      .filter(p => p.attendance > 0)
      .sort((a, b) => b.attendance - a.attendance)
      .slice(0, 5);
  };

  const handleSignOut = async () => {
    if (dbConfigured) {
      await supabase.auth.signOut();
    }
    setUser(null);
    setRatings({});
    setNetsData({});
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

  const addExpense = () => {
    if (!expensePlayer || !expenseAmount) return;

    const newExpense = {
      amount: parseFloat(expenseAmount),
      description: expenseDescription,
      date: expenseDate,
      id: Date.now()
    };

    setExpenses(prev => ({
      ...prev,
      [expensePlayer]: [...(prev[expensePlayer] || []), newExpense]
    }));

    closeExpenseModal();
  };

  const deleteExpense = (player, expenseId) => {
    setExpenses(prev => ({
      ...prev,
      [player]: (prev[player] || []).filter(exp => exp.id !== expenseId)
    }));
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
                  <label className="block text-sm font-medium text-gray-700 mb-2">Amount ($)</label>
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
                      <p className="text-sm text-gray-600">{player.netsAttendance} nets sessions</p>
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
                <Calendar className="text-blue-500" />
                Best Attendance
              </h2>
              <div className="space-y-3">
                {getBestAttendance().map((player, index) => (
                  <div key={player.name} className="flex items-center gap-4 p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
                    <div className="w-10 h-10 rounded-full bg-blue-600 flex items-center justify-center font-bold text-white">
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-semibold">{player.name}</p>
                    </div>
                    <div className="text-2xl font-bold text-blue-700">{player.attendance}</div>
                  </div>
                ))}
                {getBestAttendance().length === 0 && (
                  <p className="text-gray-500 text-center py-8">No attendance recorded yet.</p>
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
                  <div className="text-3xl font-bold text-green-600">${getTotalExpenses().toFixed(2)}</div>
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
                              ${total.toFixed(2)}
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
                      <span className="text-green-600">${getPlayerExpenseTotal(player).toFixed(2)}</span>
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
                                ${parseFloat(expense.amount).toFixed(2)}
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
                const playerNetsData = netsData[player] || {};
                const attendance = playerNetsData.presentInNets || 0;

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
                        {attendance > 0 && (
                          <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded-full text-xs">
                            {attendance} nets
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
                  <p className="text-gray-600">Training Performance Tracker</p>
                </div>
                <div className="text-center">
                  <div className="text-4xl font-bold text-green-600">{getPlayerAverage(selectedPlayer)}</div>
                  <div className="text-sm text-gray-500">Skills Average</div>
                </div>
              </div>

              {/* Nets Session Data */}
              <div className="mb-8 p-6 bg-blue-50 rounded-lg">
                <h3 className="text-lg font-bold text-gray-700 mb-4">Nets Session Statistics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Present in Nets
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={netsData[selectedPlayer]?.presentInNets || ''}
                      onChange={(e) => updateNetsData(selectedPlayer, 'presentInNets', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Works on Technique
                    </label>
                    <select
                      value={netsData[selectedPlayer]?.worksOnTechnique || 'No'}
                      onChange={(e) => updateNetsData(selectedPlayer, 'worksOnTechnique', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="No">No</option>
                      <option value="Sometimes">Sometimes</option>
                      <option value="Yes">Yes</option>
                      <option value="Always">Always</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Times Got Out
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={netsData[selectedPlayer]?.timesGotOut || ''}
                      onChange={(e) => updateNetsData(selectedPlayer, 'timesGotOut', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wickets Taken
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={netsData[selectedPlayer]?.wicketsTaken || ''}
                      onChange={(e) => updateNetsData(selectedPlayer, 'wicketsTaken', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Bowling Extras
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={netsData[selectedPlayer]?.bowlingExtras || ''}
                      onChange={(e) => updateNetsData(selectedPlayer, 'bowlingExtras', parseInt(e.target.value) || 0)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                    />
                  </div>
                </div>

                {/* Stats Summary */}
                {netsData[selectedPlayer]?.presentInNets > 0 && (
                  <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                    {netsData[selectedPlayer]?.timesGotOut > 0 && (
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600">Dismissal Rate</div>
                        <div className="text-lg font-bold text-red-600">
                          {((netsData[selectedPlayer].timesGotOut / netsData[selectedPlayer].presentInNets) * 100).toFixed(1)}%
                        </div>
                      </div>
                    )}
                    {netsData[selectedPlayer]?.wicketsTaken > 0 && (
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600">Wickets/Session</div>
                        <div className="text-lg font-bold text-green-600">
                          {(netsData[selectedPlayer].wicketsTaken / netsData[selectedPlayer].presentInNets).toFixed(1)}
                        </div>
                      </div>
                    )}
                    {netsData[selectedPlayer]?.bowlingExtras > 0 && (
                      <div className="bg-white p-3 rounded-lg text-center">
                        <div className="text-sm text-gray-600">Extras/Session</div>
                        <div className="text-lg font-bold text-orange-600">
                          {(netsData[selectedPlayer].bowlingExtras / netsData[selectedPlayer].presentInNets).toFixed(1)}
                        </div>
                      </div>
                    )}
                  </div>
                )}
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
