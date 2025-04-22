import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend);

function App() {
  const API_URL = process.env.REACT_APP_API_URL || 'https://mindsprout-backend-new.onrender.com';

  // Initialize token as null (no auto-login)
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [regularSignupForm, setRegularSignupForm] = useState({ name: '', email: '', username: '', password: '' });
  const [regularLoginForm, setRegularLoginForm] = useState({ email: '', password: '' });
  const [message, setMessage] = useState('');
  const [isQuizActive, setIsQuizActive] = useState(false);
  const [quiz, setQuiz] = useState({ happiness: 0, anger: 0, stress: 0, energy: 0, confidence: 0, isPostChat: false });
  const [currentQuizQuestion, setCurrentQuizQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [isChatActive, setIsChatActive] = useState(false);
  const [chat, setChat] = useState([]);
  const [timeLeft, setTimeLeft] = useState(15 * 60);
  const [extendCount, setExtendCount] = useState(0);
  const [lastChatTimestamp, setLastChatTimestamp] = useState(null);
  const [chatTokens, setChatTokens] = useState(3);
  const [tokenRegenTime, setTokenRegenTime] = useState(null);
  const [goals, setGoals] = useState([]);
  const [reports, setReports] = useState([]);
  const [journal, setJournal] = useState([]);
  const [journalInsights, setJournalInsights] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState(null);
  const [showBreathe, setShowBreathe] = useState(false);
  const [breatheCount, setBreatheCount] = useState(4);
  const [openNotepadSection, setOpenNotepadSection] = useState(null);
  const [openJournalType, setOpenJournalType] = useState(null);
  const [journalResponses, setJournalResponses] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const [showSummaryBuffer, setShowSummaryBuffer] = useState(false);
  const [chatInput, setChatInput] = useState('');
  const [journalPage, setJournalPage] = useState(1);
  const [reflectPage, setReflectPage] = useState(1);
  const [showSignup, setShowSignup] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [isDesktop, setIsDesktop] = useState(window.innerWidth > 768);
  const [affirmationsList, setAffirmationsList] = useState([]);
  const [dailyAffirmations, setDailyAffirmations] = useState(null);
  const [showDailyAffirmationsModal, setShowDailyAffirmationsModal] = useState(false);

  const chatBoxRef = useRef(null);
  const reportDetailsRef = useRef(null);

  const affirmations = [
    "You are enough just as you are.",
    "Your potential is limitless.",
    "You radiate positivity and love.",
    "Every day is a fresh start.",
    "You are capable of amazing things.",
    "Your strength is inspiring.",
    "You deserve happiness and peace.",
    "You are growing every day.",
    "Your voice matters.",
    "You are worthy of love and respect.",
    "You bring light to those around you.",
    "Your journey is unique and beautiful.",
    "You have the power to create change.",
    "Your resilience is unstoppable.",
    "You are a gift to the world.",
    "You are deserving of all good things.",
    "Your dreams are valid and achievable.",
    "You have the courage to face challenges.",
    "You inspire others with your kindness.",
    "You are a powerful creator of your reality.",
    "You are loved beyond measure.",
    "Your happiness is a priority.",
    "You are constantly evolving and improving.",
    "You are a source of strength for others.",
    "You have the ability to overcome obstacles.",
    "Your creativity knows no bounds.",
    "You are enough, just as you are.",
    "You have the right to express your feelings.",
    "Your uniqueness is your superpower.",
    "You are a magnet for positivity.",
    "You are surrounded by love and support.",
    "You are brave and can take risks.",
    "You deserve to take time for yourself.",
    "You are a beacon of hope and inspiration."
  ];

  // Available positions for affirmations
  const affirmationPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];

  // Manage affirmations during loading
  useEffect(() => {
    if (isLoading && !showSummaryBuffer) {
      const usedPositions = new Set();
      const interval = setInterval(() => {
        // Find an unused position
        const availablePositions = affirmationPositions.filter(pos => !usedPositions.has(pos));
        if (availablePositions.length === 0) return; // Skip if all positions are used
        const position = availablePositions[Math.floor(Math.random() * availablePositions.length)];
        usedPositions.add(position);

        const newAffirmation = {
          text: affirmations[Math.floor(Math.random() * affirmations.length)],
          id: Date.now(),
          position
        };
        setAffirmationsList((prev) => [...prev, newAffirmation].slice(-5));
        setTimeout(() => {
          setAffirmationsList((prev) => prev.filter((a) => a.id !== newAffirmation.id));
          usedPositions.delete(position);
        }, 2000);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setAffirmationsList([]);
    }
  }, [isLoading, showSummaryBuffer]);

  // Check for token on mount to maintain session on page refresh
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setRole('regular');
      fetchUserData(storedToken);
    }
  }, []);

  // Other existing states and effects
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (chatTokens < 3 && tokenRegenTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeDiff = (tokenRegenTime - now) / 1000;
        if (timeDiff <= 0) {
          setChatTokens((prev) => Math.min(prev + 1, 3));
          setTokenRegenTime(new Date(now.getTime() + 3 * 60 * 60 * 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [chatTokens, tokenRegenTime]);

  useEffect(() => {
    if (token && role === 'regular') {
      localStorage.setItem('token', token);
      fetchUserData(token);
    }
  }, [token, role]);

  useEffect(() => {
    if (isChatActive && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          handleEndChat();
          return 0;
        }
        return prev - 1;
      }), 1000);
      return () => clearInterval(timer);
    }
  }, [isChatActive, timeLeft]);

  useEffect(() => {
    if (showBreathe) {
      setBreatheCount(4);
      let count = 4;
      const interval = setInterval(() => {
        setBreatheCount(count);
        count -= 1;
        if (count < 1) {
          clearInterval(interval);
          setTimeout(() => {
            setShowBreathe(false);
            setTimeout(() => {
              setIsChatActive(true);
              setChat([{ sender: 'pal', text: 'Hello, welcome to this safe space, what is on your mind today?', timestamp: new Date() }]);
              setTimeLeft(15 * 60);
              setMessage('Let’s chat.');
            }, 500);
          }, 1000);
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [showBreathe]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const emotionDescriptions = {
    happiness: {
      question: "How happy are you right now?",
      feedback: (value) => ["Really Unhappy", "Somewhat Unhappy", "Mildly Happy", "Quite Happy", "Very Happy"][value - 1],
      emojis: ['😢', '😣', '😊', '😊', '🥰'],
    },
    anger: {
      question: "How angry are you right now?",
      feedback: (value) => ["Really Calm", "Somewhat Calm", "Mildly Angry", "Quite Angry", "Extremely Angry"][value - 1],
      emojis: ['😊', '😐', '😣', '😤', '😡'],
    },
    stress: {
      question: "How stressed are you right now?",
      feedback: (value) => ["Really Relaxed", "Somewhat Relaxed", "Mildly Stressed", "Quite Stressed", "Extremely Stressed"][value - 1],
      emojis: ['😊', '😐', '😣', '😓', '😰'],
    },
    energy: {
      question: "How energized are you right now?",
      feedback: (value) => ["Really Drained", "Somewhat Tired", "Mildly Energized", "Quite Energized", "Very Energized"][value - 1],
      emojis: ['😴', '😪', '😐', '😊', '⚡'],
    },
    confidence: {
      question: "How confident are you right now?",
      feedback: (value) => ["Really Unsure", "Somewhat Doubtful", "Mildly Confident", "Quite Confident", "Extremely Confident"][value - 1],
      emojis: ['😟', '😣', '😐', '😊', '💪'],
    },
  };

  const quizQuestions = Object.keys(emotionDescriptions);

  const journalPrompts = {
    daily: [
      { heading: "Highlights of My Day", subheading: "Reflect on the moments that brought you joy or satisfaction.", key: "highlights" },
      { heading: "What I Learned About Myself", subheading: "Consider any new insights or realizations you had.", key: "learned" },
      { heading: "Challenges I Faced", subheading: "Analyze your reactions and what you can learn from them.", key: "challenges" },
      { heading: "Emotions I Experienced", subheading: "Explore the feelings you had and their sources.", key: "emotions" },
    ],
    dream: [
      { heading: "My Dream Last Night", subheading: "Capture the key components of your dream, including characters and settings.", key: "dreamDescription" },
      { heading: "Emotions in the Dream", subheading: "Reflect on how the dream made you feel and what that might signify.", key: "dreamEmotions" },
      { heading: "Recurring Themes or Symbols", subheading: "Identify any patterns that might connect to your waking life.", key: "themes" },
      { heading: "Which part of the dream stands out the most?", subheading: "Focus on the most vivid or impactful moment and why it resonates.", key: "standout" },
    ],
    freestyle: [
      { heading: "My Thoughts", subheading: "Write whatever is on your mind, no structure needed.", key: "thoughts" },
    ],
  };

  const fetchUserData = async (authToken) => {
    setIsLoading(true);
    try {
      const cachedData = JSON.parse(localStorage.getItem('userData') || '{}');
      if (cachedData.goals) setGoals(cachedData.goals);
      if (cachedData.reports) setReports(cachedData.reports);

      const [goalsRes, reportsRes, lastChatRes, affirmationsRes] = await Promise.all([
        axios.get(`${API_URL}/api/regular/goals`, { headers: { Authorization: authToken } }),
        axios.get(`${API_URL}/api/regular/reports`, { headers: { Authorization: authToken } }),
        axios.get(`${API_URL}/api/regular/last-chat`, { headers: { Authorization: authToken } }),
        axios.get(`${API_URL}/api/regular/daily-affirmations`, { headers: { Authorization: authToken } })
      ]);

      setGoals(goalsRes.data || []);
      setReports(reportsRes.data || []);
      setLastChatTimestamp(lastChatRes.data.lastChatTimestamp ? new Date(lastChatRes.data.lastChatTimestamp) : null);
      setChatTokens(lastChatRes.data.chatTokens || 3);
      const regenTime = lastChatRes.data.lastTokenRegen
        ? new Date(new Date(lastChatRes.data.lastTokenRegen).getTime() + 3 * 60 * 60 * 1000)
        : null;
      setTokenRegenTime(regenTime);
      setDailyAffirmations(affirmationsRes.data && new Date(affirmationsRes.data.validUntil) > new Date() ? affirmationsRes.data : null);

      localStorage.setItem('userData', JSON.stringify({
        goals: goalsRes.data,
        reports: reportsRes.data,
        lastChatTimestamp: lastChatRes.data.lastChatTimestamp,
        chatTokens: lastChatRes.data.chatTokens,
        dailyAffirmations: affirmationsRes.data && new Date(affirmationsRes.data.validUntil) > new Date() ? affirmationsRes.data : null
      }));

      Promise.all([
        axios.get(`${API_URL}/api/regular/journal`, { headers: { Authorization: authToken } }),
        axios.get(`${API_URL}/api/regular/journal-insights`, { headers: { Authorization: authToken } }),
      ]).then(([journalRes, insightsRes]) => {
        setJournal(journalRes.data || []);
        setJournalInsights(insightsRes.data || []);
        localStorage.setItem('userData', JSON.stringify({
          ...JSON.parse(localStorage.getItem('userData') || '{}'),
          journal: journalRes.data,
          journalInsights: insightsRes.data,
        }));
      }).catch((err) => console.error('Error fetching non-critical data:', err));
    } catch (err) {
      console.error('Error fetching user data:', err);
      setMessage('Error loading your data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleGenerateDailyAffirmations = async () => {
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/regular/daily-affirmations`,
        {},
        { headers: { Authorization: token } }
      );
      setDailyAffirmations(response.data);
      setMessage('Today\'s inspiration generated!');
    } catch (err) {
      setMessage('Error generating affirmations: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const getBarChartData = useMemo(() => {
    return (quizData) => {
      const pre = quizData.find((q) => !q.isPostChat) || { happiness: 0, anger: 0, stress: 0, energy: 0, confidence: 0 };
      return {
        labels: ['Happiness', 'Anger', 'Stress', 'Energy', 'Confidence'],
        datasets: [{ label: 'Before Chat', data: [pre.happiness, pre.anger, pre.stress, pre.energy, pre.confidence], backgroundColor: '#36A2EB' }],
        options: { scales: { y: { beginAtZero: true, max: 5 } } },
      };
    };
  }, []);

  const barChartData = useMemo(() => (selectedReport ? getBarChartData(selectedReport.quizData) : null), [selectedReport, getBarChartData]);

  const weeklyMoodChartData = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyReports = reports
      .filter((r) => new Date(r.date) >= oneWeekAgo)
      .sort((a, b) => new Date(a.date) - new Date(b.date));

    const labels = weeklyReports.map((r) => new Date(r.date).toLocaleDateString());
    const datasets = [
      {
        label: 'Happiness',
        data: weeklyReports.map((r) => r.quizData.find((q) => !q.isPostChat)?.happiness || 0),
        borderColor: '#388E3C',
        backgroundColor: 'rgba(56, 142, 60, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Anger',
        data: weeklyReports.map((r) => r.quizData.find((q) => !q.isPostChat)?.anger || 0),
        borderColor: '#EF5350',
        backgroundColor: 'rgba(239, 83, 80, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Stress',
        data: weeklyReports.map((r) => r.quizData.find((q) => !q.isPostChat)?.stress || 0),
        borderColor: '#AB47BC',
        backgroundColor: 'rgba(171, 71, 188, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Energy',
        data: weeklyReports.map((r) => r.quizData.find((q) => !q.isPostChat)?.energy || 0),
        borderColor: '#FFA726',
        backgroundColor: 'rgba(255, 167, 38, 0.2)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Confidence',
        data: weeklyReports.map((r) => r.quizData.find((q) => !q.isPostChat)?.confidence || 0),
        borderColor: '#0288D1',
        backgroundColor: 'rgba(2, 136, 209, 0.2)',
        fill: true,
        tension: 0.4,
      },
    ];

    return {
      labels,
      datasets,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: { beginAtZero: true, max: 5, title: { display: true, text: 'Score', font: { size: 14 } } },
          x: { title: { display: true, text: 'Date', font: { size: 14 } } },
        },
        plugins: {
          legend: { position: 'top', labels: { font: { size: 12 } } },
          tooltip: { enabled: true },
        },
      }
    };
  }, [reports]);

  const weeklyMoodSummary = useMemo(() => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyReports = reports.filter((r) => new Date(r.date) >= oneWeekAgo);

    const averages = {
      happiness: 0,
      anger: 0,
      stress: 0,
      energy: 0,
      confidence: 0,
    };

    if (weeklyReports.length > 0) {
      weeklyReports.forEach((r) => {
        const quiz = r.quizData.find((q) => !q.isPostChat) || {};
        averages.happiness += quiz.happiness || 0;
        averages.anger += quiz.anger || 0;
        averages.stress += quiz.stress || 0;
        averages.energy += quiz.energy || 0;
        averages.confidence += quiz.confidence || 0;
      });
      Object.keys(averages).forEach((key) => {
        averages[key] = averages[key] / weeklyReports.length;
      });
    }

    const responses = {
      happiness: [
        "You are feeling quite unhappy this week.",
        "You are somewhat unhappy this week.",
        "You are feeling moderately happy this week.",
        "You are quite happy this week.",
        "You are very happy this week!"
      ],
      anger: [
        "You are feeling very calm this week.",
        "You are somewhat calm this week.",
        "You are feeling moderately angry this week.",
        "You are quite angry this week.",
        "You are feeling extremely angry this week."
      ],
      stress: [
        "You are very relaxed this week.",
        "You are somewhat relaxed this week.",
        "You are feeling moderately stressed this week.",
        "You are quite stressed this week.",
        "You are extremely stressed this week."
      ],
      energy: [
        "You are feeling very drained this week.",
        "You are somewhat tired this week.",
        "You are feeling moderately energized this week.",
        "You are quite energized this week.",
        "You are very energized this week!"
      ],
      confidence: [
        "You are feeling very unsure this week.",
        "You are somewhat doubtful this week.",
        "You are feeling moderately confident this week.",
        "You are quite confident this week.",
        "You are very confident this week!"
      ],
    };

    return Object.keys(averages).map((key) => {
      const avg = averages[key];
      const index = Math.round(avg) - 1;
      return `${key.charAt(0).toUpperCase() + key.slice(1)}: ${responses[key][index >= 0 && index < 5 ? index : 0]}`;
    });
  }, [reports]);

  const handleRegularSignup = (e) => {
    e.preventDefault();
    setIsLoading(true);
    axios.post(`${API_URL}/api/regular/signup`, regularSignupForm)
      .then((res) => {
        setMessage(res.data.message);
        setToken(res.data.token);
        setRole('regular');
        fetchUserData(res.data.token);
      })
      .catch((err) => setMessage(err.response?.data?.error || 'Signup failed'))
      .finally(() => setIsLoading(false));
  };

  const handleRegularLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loginData = { ...regularLoginForm, email: regularLoginForm.email.toLowerCase() };
    axios.post(`${API_URL}/api/regular/login`, loginData)
      .then((res) => {
        setToken(res.data.token);
        setRole('regular');
        setMessage(`Welcome, ${res.data.name || 'User'}!`);
        fetchUserData(res.data.token);
      })
      .catch((err) => setMessage(err.response?.data?.error || 'Login failed'))
      .finally(() => setIsLoading(false));
  };

  const canStartChat = () => {
    if (!token || role !== 'regular') return false;
    return chatTokens > 0;
  };

  const handleStartQuiz = () => {
    if (!canStartChat()) {
      setMessage('No chat tokens available. Wait for a token to regenerate (every 3 hours).');
      return;
    }
    setIsQuizActive(true);
    setCurrentQuizQuestion(0);
    setQuiz({ happiness: 0, anger: 0, stress: 0, energy: 0, confidence: 0, isPostChat: false });
    setSelectedAnswer(null);
  };

  const handleQuizAnswer = (value) => {
    setSelectedAnswer(value);
  };

  const handleQuizKeyPress = (e, value) => {
    if (e.key === 'Enter' || e.key === value.toString()) {
      handleQuizAnswer(value);
    }
  };

  const handleQuizNext = () => {
    if (selectedAnswer === null) return;
    const key = quizQuestions[currentQuizQuestion];
    setQuiz({ ...quiz, [key]: selectedAnswer });
    if (currentQuizQuestion < quizQuestions.length - 1) {
      setCurrentQuizQuestion(currentQuizQuestion + 1);
      setSelectedAnswer(null);
    }
  };

  const handleStartChat = () => {
    if (selectedAnswer === null) return;
    const key = quizQuestions[currentQuizQuestion];
    setQuiz({ ...quiz, [key]: selectedAnswer });
    setIsQuizActive(false);
    setShowBreathe(true);
  };

  const handleExtendChat = () => {
    if (extendCount < 3) {
      setTimeLeft((prev) => prev + 5 * 60);
      setExtendCount((prev) => prev + 1);
      setMessage('Chat extended by 5 minutes!');
    }
  };

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleChat = useCallback(
    debounce(async (text) => {
      if (timeLeft <= 0 || text.length > 500) return;
      const newUserMessage = { sender: 'user', text, timestamp: new Date() };
      setChat((prev) => [...prev, newUserMessage]);
      setChatInput('');
      try {
        const lowerText = text.toLowerCase();
        if (
          lowerText.includes('kill myself') ||
          lowerText.includes('killing myself') ||
          lowerText.includes('suicide') ||
          lowerText.includes('end my life')
        ) {
          setChat((prev) => [
            ...prev,
            {
              sender: 'pal',
              text: 'I hear that you’re in a really tough place right now, and I’m here for you. You don’t have to go through this alone—there’s help available. Please reach out to someone you trust or contact a hotline like 988 (US) or a local crisis line. What’s been going on? I’m listening.',
              timestamp: new Date(),
            },
          ]);
          return;
        }
        const response = await axios.post(
          `${API_URL}/api/regular/chat`,
          { message: text, chatHistory: chat },
          { headers: { Authorization: token } }
        );
        setChat((prev) => [
          ...prev,
          { sender: 'pal', text: response.data.text, timestamp: new Date(response.data.timestamp) },
        ]);
      } catch (err) {
        setMessage('Error sending message');
      }
    }, 500),
    [chat, token, timeLeft]
  );

  const handleEndChat = async () => {
    if (!chat.length) {
      setIsChatActive(false);
      setMessage('');
      setChat([]);
      return;
    }
    setShowSummaryBuffer(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/regular/end-chat`,
        { chatHistory: chat, quiz },
        { headers: { Authorization: token } }
      );
      setReports((prev) => [...prev, response.data]);
      setLastChatTimestamp(new Date());
      setChatTokens((prev) => Math.max(prev - 1, 0));
      setIsChatActive(false);
      setShowSummaryBuffer(false);
      setChat([]);
      setMessage('Chat session saved. View it in the Reflect tab.');
    } catch (err) {
      setMessage('Error ending chat');
      setShowSummaryBuffer(false);
    }
  };

  const handleGoalSubmit = async (e) => {
    e.preventDefault();
    const goalText = e.target.goal.value;
    if (!goalText) return;
    try {
      const response = await axios.post(
        `${API_URL}/api/regular/goals`,
        { text: goalText, achieved: false },
        { headers: { Authorization: token } }
      );
      setGoals(response.data);
      e.target.goal.value = '';
      setMessage('Goal added!');
    } catch (err) {
      setMessage('Error adding goal');
    }
  };

  const handleGoalToggle = async (goal) => {
    try {
      const response = await axios.put(
        `${API_URL}/api/regular/goals`,
        { text: goal.text, achieved: !goal.achieved },
        { headers: { Authorization: token } }
      );
      setGoals(response.data);
      setMessage('Goal updated!');
    } catch (err) {
      setMessage('Error updating goal');
    }
  };

  const handleDeleteReport = async () => {
    try {
      await axios.delete(`${API_URL}/api/regular/reports/${deleteConfirm}`, {
        headers: { Authorization: token },
      });
      setReports((prev) => prev.filter((r) => r._id !== deleteConfirm));
      setSelectedReport(null);
      setDeleteConfirm(null);
      setMessage('Report deleted!');
    } catch (err) {
      setMessage('Error deleting report');
    }
  };

  const handleDeleteJournalEntry = async () => {
    try {
      await axios.delete(`${API_URL}/api/regular/journal/${deleteConfirm}`, {
        headers: { Authorization: token },
      });
      setJournal((prev) => prev.filter((j) => j._id !== deleteConfirm));
      setSelectedJournalEntry(null);
      setDeleteConfirm(null);
      setMessage('Journal entry deleted!');
    } catch (err) {
      setMessage('Error deleting journal entry');
    }
  };

  const handleJournalSubmit = async () => {
    if (!openJournalType || !Object.values(journalResponses).some((v) => v.trim())) {
      setMessage('Please fill out at least one response.');
      return;
    }
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/regular/insights`,
        {
          date: new Date(),
          type: openJournalType,
          responses: journalResponses,
        },
        { headers: { Authorization: token } }
      );
      setJournal((prev) => [...prev, { _id: response.data._id, date: new Date(), type: openJournalType, responses: journalResponses }]);
      setOpenJournalType(null);
      setJournalResponses({});
      setMessage('Journal entry saved!');
      try {
        const insightResponse = await axios.post(
          `${API_URL}/api/regular/journal-insights`,
          { journalDate: new Date(), responses: journalResponses },
          { headers: { Authorization: token } }
        );
        setJournalInsights((prev) => [
          ...prev,
          { journalDate: new Date(), insight: insightResponse.data.insight, createdAt: new Date() },
        ]);
      } catch (err) {
        console.error('Error generating journal insight:', err);
      }
    } catch (err) {
      setMessage('Error saving journal entry');
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setToken(null);
    setRole(null);
    setGoals([]);
    setReports([]);
    setJournal([]);
    setJournalInsights([]);
    setDailyAffirmations(null);
    setChat([]);
    setMessage('Logged out successfully');
  };

  const itemsPerPage = 5;
  const journalStart = (journalPage - 1) * itemsPerPage;
  const journalEnd = journalStart + itemsPerPage;
  const reflectStart = (reflectPage - 1) * itemsPerPage;
  const reflectEnd = reflectStart + itemsPerPage;

  if (!token) {
    return (
      <div className="app">
        <div className="canvas auth">
          <img src="/logo.png" alt="MindSprout Logo" className="logo" />
          <p className="tagline">Grow Your Mind with MindSprout</p>
          {message && <p className="message">{message}</p>}
          {showSignup ? (
            <form className="signup-form" onSubmit={handleRegularSignup}>
              <input
                type="text"
                placeholder="Name"
                value={regularSignupForm.name}
                onChange={(e) => setRegularSignupForm({ ...regularSignupForm, name: e.target.value })}
                required
              />
              <input
                type="email"
                placeholder="Email"
                value={regularSignupForm.email}
                onChange={(e) => setRegularSignupForm({ ...regularSignupForm, email: e.target.value })}
                required
              />
              <input
                type="text"
                placeholder="Username"
                value={regularSignupForm.username}
                onChange={(e) => setRegularSignupForm({ ...regularSignupForm, username: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={regularSignupForm.password}
                onChange={(e) => setRegularSignupForm({ ...regularSignupForm, password: e.target.value })}
                required
              />
              <button type="submit" className="signup-btn">Sign Up</button>
              <button type="button" className="toggle-btn" onClick={() => setShowSignup(false)}>Back to Login</button>
            </form>
          ) : (
            <form className="login-form" onSubmit={handleRegularLogin}>
              <input
                type="email"
                placeholder="Email"
                value={regularLoginForm.email}
                onChange={(e) => setRegularLoginForm({ ...regularLoginForm, email: e.target.value })}
                required
              />
              <input
                type="password"
                placeholder="Password"
                value={regularLoginForm.password}
                onChange={(e) => setRegularLoginForm({ ...regularLoginForm, password: e.target.value })}
                required
              />
              <button type="submit">Login</button>
              <button type="button" className="toggle-btn" onClick={() => setShowSignup(true)}>Sign Up Instead</button>
            </form>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="canvas regular-dashboard">
        <img src="/logo.png" alt="MindSprout Logo" className="logo" />
        <button className="logout-btn" onClick={handleLogout}>
          <img src="/icons/logout.png" alt="Logout" className="icon" /> Logout
        </button>
        {message && <p className="message">{message}</p>}
        {isLoading && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            {affirmationsList.map((affirmation) => (
              <div key={affirmation.id} className={`affirmation ${affirmation.position}`}>
                {affirmation.text}
              </div>
            ))}
          </div>
        )}
        {showSummaryBuffer && (
          <div className="loading-overlay">
            <div className="spinner"></div>
            <p>Summarizing your chat...</p>
          </div>
        )}
        {showBreathe && (
          <div className="breathe-overlay active">
            <div className="breathe-animation">
              <h2>Take a deep breath...</h2>
              <p className="breathe-count">{breatheCount}</p>
            </div>
          </div>
        )}
        {isQuizActive && (
          <div className="quiz-fullscreen active">
            <div className="quiz-content">
              <h2>{emotionDescriptions[quizQuestions[currentQuizQuestion]].question}</h2>
              <p className="quiz-question">Select a value from 1 to 5</p>
              <div className="quiz-options">
                {[1, 2, 3, 4, 5].map((value) => (
                  <div
                    key={value}
                    className={`quiz-option-box ${selectedAnswer === value ? 'selected' : ''}`}
                    onClick={() => handleQuizAnswer(value)}
                    onKeyPress={(e) => handleQuizKeyPress(e, value)}
                    tabIndex={0}
                  >
                    <span className="quiz-value">{value}</span>
                    <span className="quiz-feedback">{emotionDescriptions[quizQuestions[currentQuizQuestion]].feedback(value)}</span>
                    <span className="quiz-emoji">{emotionDescriptions[quizQuestions[currentQuizQuestion]].emojis[value - 1]}</span>
                  </div>
                ))}
              </div>
              <div className="quiz-nav">
                {currentQuizQuestion < quizQuestions.length - 1 ? (
                  <button onClick={handleQuizNext} disabled={selectedAnswer === null}>Next</button>
                ) : (
                  <button onClick={handleStartChat} disabled={selectedAnswer === null}>Start Chat</button>
                )}
              </div>
            </div>
          </div>
        )}
        {activeTab === 'chat' && (
          <div className="chat">
            {!isChatActive ? (
              <>
                <h2>Chat with Pal</h2>
                <p>Tokens available: {chatTokens}/3</p>
                {tokenRegenTime && chatTokens < 3 && (
                  <p>Next token in: {Math.floor((tokenRegenTime - new Date()) / 1000 / 60)} minutes</p>
                )}
                <button onClick={handleStartQuiz} disabled={!canStartChat()}>
                  Start Chat
                </button>
              </>
            ) : (
              <>
                <h2>Chatting with Pal</h2>
                <p>Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                <div className="chat-box" ref={chatBoxRef}>
                  {chat.map((msg, index) => (
                    <p key={index} className={msg.sender}>
                      <strong>{msg.sender === 'user' ? 'You' : 'Pal'}:</strong> {msg.text}
                    </p>
                  ))}
                </div>
                <div className="chat-input-container">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && chatInput.trim() && handleChat(chatInput)}
                    placeholder="Type your message..."
                    maxLength={500}
                    disabled={timeLeft <= 0}
                  />
                  <button
                    className="send-btn"
                    onClick={() => chatInput.trim() && handleChat(chatInput)}
                    disabled={timeLeft <= 0 || !chatInput.trim()}
                  >
                    Send
                  </button>
                </div>
                <p className="char-counter">{chatInput.length}/500</p>
                <button onClick={handleExtendChat} disabled={extendCount >= 3}>
                  Extend Chat (5 mins)
                </button>
                <button onClick={handleEndChat}>End Chat</button>
              </>
            )}
          </div>
        )}
        {activeTab === 'journal' && (
          <div className="journal">
            <h2>Journal</h2>
            <div className="journal-options">
              <button
                className="journal-button"
                onClick={() => setOpenJournalType('daily')}
              >
                <img src="/personal.png" alt="Daily Journal" />
                <span>Daily Journal</span>
              </button>
              <button
                className="journal-button"
                onClick={() => setOpenJournalType('dream')}
              >
                <img src="/dream1.png" alt="Dream Journal" />
                <span>Dream Journal</span>
              </button>
              <button
                className="journal-button"
                onClick={() => setOpenJournalType('freestyle')}
              >
                <img src="/freestyle.png" alt="Freestyle Journal" />
                <span>Freestyle Journal</span>
              </button>
            </div>
            <h3>Your Journal Entries</h3>
            <table className="gradient-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Type</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {journal.slice(journalStart, journalEnd).map((entry) => (
                  <tr key={entry._id}>
                    <td>{new Date(entry.date).toLocaleDateString()}</td>
                    <td>{entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</td>
                    <td>
                      <button onClick={() => setSelectedJournalEntry(entry)}>View</button>
                      <button
                        className="delete-btn"
                        onClick={() => setDeleteConfirm(entry._id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="pagination">
              <button
                onClick={() => setJournalPage((prev) => Math.max(prev - 1, 1))}
                disabled={journalPage === 1}
              >
                Previous
              </button>
              <span>
                Page {journalPage} of {Math.ceil(journal.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setJournalPage((prev) => prev + 1)}
                disabled={journalEnd >= journal.length}
              >
                Next
              </button>
            </div>
          </div>
        )}
        {activeTab === 'reflect' && (
          <div className="reflect">
            <h2>Reflect</h2>
            <div className="summary-container">
              {reports.slice(reflectStart, reflectEnd).map((report) => (
                <div
                  key={report._id}
                  className="summary-card"
                  onClick={() => setSelectedReport(report)}
                >
                  <div className="summary-front">
                    <h4>{new Date(report.date).toLocaleDateString()}</h4>
                  </div>
                </div>
              ))}
            </div>
            <div className="pagination">
              <button
                onClick={() => setReflectPage((prev) => Math.max(prev - 1, 1))}
                disabled={reflectPage === 1}
              >
                Previous
              </button>
              <span>
                Page {reflectPage} of {Math.ceil(reports.length / itemsPerPage)}
              </span>
              <button
                onClick={() => setReflectPage((prev) => prev + 1)}
                disabled={reflectEnd >= reports.length}
              >
                Next
              </button>
            </div>
          </div>
        )}
        {activeTab === 'profile' && (
          <div className="profile">
            <h2>Profile</h2>
            <div className="mood-trend">
              <h3>Weekly Mood Trends</h3>
              <div className="mood-chart-container">
                <Line data={weeklyMoodChartData} options={weeklyMoodChartData.options} />
              </div>
              <div className="mood-summary">
                {weeklyMoodSummary.map((summary, index) => (
                  <p key={index}>{summary}</p>
                ))}
              </div>
            </div>
            <div className="daily-inspiration">
              <h3>Today's Inspiration</h3>
              {dailyAffirmations ? (
                <div
                  className="affirmation-display"
                  onClick={() => setShowDailyAffirmationsModal(true)}
                >
                  <p><strong>I Suggest:</strong> {dailyAffirmations.suggest}</p>
                  <p><strong>I Encourage:</strong> {dailyAffirmations.encourage}</p>
                  <p><strong>I Invite:</strong> {dailyAffirmations.invite}</p>
                </div>
              ) : (
                <p>No inspiration generated yet.</p>
              )}
              <button
                onClick={handleGenerateDailyAffirmations}
                disabled={dailyAffirmations && new Date(dailyAffirmations.validUntil) > new Date()}
              >
                Generate Today's
              </button>
            </div>
            <h3>Your Goals</h3>
            <form onSubmit={handleGoalSubmit}>
              <input type="text" name="goal" placeholder="Add a new goal" />
              <button type="submit">Add Goal</button>
            </form>
            <ul>
              {goals.map((goal, index) => (
                <li key={index}>
                  <input
                    type="checkbox"
                    checked={goal.achieved}
                    onChange={() => handleGoalToggle(goal)}
                  />
                  {goal.text}
                </li>
              ))}
            </ul>
          </div>
        )}
        {openJournalType && (
          <div className="journal-modal active">
            <div className="journal-content">
              <button
                className="close-btn"
                onClick={() => {
                  setOpenJournalType(null);
                  setJournalResponses({});
                }}
              >
                X
              </button>
              <h2>{openJournalType.charAt(0).toUpperCase() + openJournalType.slice(1)} Journal</h2>
              {journalPrompts[openJournalType].map((prompt) => (
                <div key={prompt.key} className="journal-prompt">
                  <h3>{prompt.heading}</h3>
                  <p>{prompt.subheading}</p>
                  <textarea
                    value={journalResponses[prompt.key] || ''}
                    onChange={(e) =>
                      setJournalResponses({
                        ...journalResponses,
                        [prompt.key]: e.target.value,
                      })
                    }
                    placeholder="Write your thoughts..."
                  />
                </div>
              ))}
              <button onClick={handleJournalSubmit}>Save Entry</button>
            </div>
          </div>
        )}
        {selectedJournalEntry && (
          <div className="notepad-modal active">
            <div className="notepad-content">
              <button
                className="close-btn"
                onClick={() => setSelectedJournalEntry(null)}
              >
                X
              </button>
              <h2>
                {selectedJournalEntry.type.charAt(0).toUpperCase() +
                  selectedJournalEntry.type.slice(1)}{' '}
                Journal - {new Date(selectedJournalEntry.date).toLocaleDateString()}
              </h2>
              {journalPrompts[selectedJournalEntry.type].map((prompt) => (
                <div key={prompt.key} className="notepad-text">
                  <h3>{prompt.heading}</h3>
                  <p>{selectedJournalEntry.responses[prompt.key] || 'No response'}</p>
                </div>
              ))}
              {journalInsights
                .filter(
                  (insight) =>
                    new Date(insight.journalDate).toDateString() ===
                    new Date(selectedJournalEntry.date).toDateString()
                )
                .map((insight, index) => (
                  <div key={index} className="notepad-text">
                    <h3>Insight</h3>
                    <p>{insight.insight}</p>
                  </div>
                ))}
            </div>
          </div>
        )}
        {deleteConfirm && (
          <div className="delete-confirm-modal active">
            <div className="delete-confirm-content">
              <h3>Confirm Deletion</h3>
              <p>
                Are you sure you want to delete this{' '}
                {selectedJournalEntry ? 'journal entry' : 'report'}?
              </p>
              <div className="delete-confirm-buttons">
                <button
                  onClick={
                    selectedJournalEntry ? handleDeleteJournalEntry : handleDeleteReport
                  }
                >
                  Delete
                </button>
                <button onClick={() => setDeleteConfirm(null)}>Cancel</button>
              </div>
            </div>
          </div>
        )}
        {selectedReport && (
          <div className="report-details" ref={reportDetailsRef}>
            <h2>Chat Summary - {new Date(selectedReport.date).toLocaleDateString()}</h2>
            {barChartData && (
              <div className="bar-chart-container">
                <Bar data={barChartData} />
              </div>
            )}
            <h3>What We Discussed</h3>
            <p>{selectedReport.summary.discussed}</p>
            <h3>Your Thoughts & Feelings</h3>
            <p>{selectedReport.summary.thoughtsFeelings}</p>
            <h3>Insights Uncovered</h3>
            <p>{selectedReport.summary.insights}</p>
            <h3>Mood Reflection</h3>
            <p>{selectedReport.summary.moodReflection}</p>
            <h3>Recommendations</h3>
            <p>{selectedReport.summary.recommendations}</p>
            <button
              className="delete-btn"
              onClick={() => setDeleteConfirm(selectedReport._id)}
            >
              Delete Report
            </button>
            <button onClick={() => setSelectedReport(null)}>Close</button>
          </div>
        )}
        {showDailyAffirmationsModal && dailyAffirmations && (
          <div className="daily-affirmations-modal active">
            <div className="daily-affirmations-content">
              <button
                className="close-btn"
                onClick={() => setShowDailyAffirmationsModal(false)}
              >
                X
              </button>
              <h3>Today's Inspiration</h3>
              <div className="affirmation-section">
                <h4>I Suggest</h4>
                <p>{dailyAffirmations.suggest}</p>
              </div>
              <div className="affirmation-section">
                <h4>I Encourage</h4>
                <p>{dailyAffirmations.encourage}</p>
              </div>
              <div className="affirmation-section">
                <h4>I Invite</h4>
                <p>{dailyAffirmations.invite}</p>
              </div>
            </div>
          </div>
        )}
        <div className="menu-bar">
          {['chat', 'journal', 'reflect', 'profile'].map((tab) => (
            <button
              key={tab}
              className={activeTab === tab ? 'active' : ''}
              onClick={() => setActiveTab(tab)}
            >
              <img src={`/icons/${tab}.png`} alt={tab} className="icon" />
              <span>{tab.charAt(0).toUpperCase() + tab.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default App;
