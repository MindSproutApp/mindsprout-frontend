import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { Bar, Line } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, LineElement, PointElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';
// === START OF STRIPE ADDITION ===
import { loadStripe } from '@stripe/stripe-js';

// Initialize Stripe with your publishable key
const stripePromise = loadStripe(process.env.REACT_APP_STRIPE_PUBLISHABLE_KEY);
// === END OF STRIPE ADDITION ===

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
  const [tranquilTokens, setTranquilTokens] = useState(1);
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
  const [tokenConfirm, setTokenConfirm] = useState(null);
  const [isFetchingUserData, setIsFetchingUserData] = useState(false);
  const [showInsightBuffer, setShowInsightBuffer] = useState(false); // New state for insight buffering

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
    "You are a beacon of hope and inspiration"
  ];

  const affirmationPositions = ['top-left', 'top-right', 'bottom-left', 'bottom-right', 'center'];

  // Debounce utility
  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // Debounced fetchUserData
  const debouncedFetchUserData = useCallback(
    debounce(async (authToken) => {
      if (isFetchingUserData) return;
      setIsFetchingUserData(true);
      setIsLoading(true);
      try {
        const cachedData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (cachedData.goals) setGoals(cachedData.goals);
        if (cachedData.reports) setReports(cachedData.reports);

        const results = await Promise.allSettled([
          axios.get(`${API_URL}/api/regular/goals`, { headers: { Authorization: authToken } }),
          axios.get(`${API_URL}/api/regular/reports`, { headers: { Authorization: authToken } }),
          axios.get(`${API_URL}/api/regular/last-chat`, { headers: { Authorization: authToken } }),
          axios.get(`${API_URL}/api/regular/daily-affirmations`, { headers: { Authorization: authToken } }),
          axios.get(`${API_URL}/api/regular/tranquil-tokens`, { headers: { Authorization: authToken } })
        ]);

        const [goalsRes, reportsRes, lastChatRes, affirmationsRes, tokensRes] = results;

        if (goalsRes.status === 'fulfilled') {
          setGoals(goalsRes.value.data || []);
        } else {
          console.error('Failed to fetch goals:', goalsRes.reason);
          setGoals(cachedData.goals || []);
        }

        if (reportsRes.status === 'fulfilled') {
          setReports(reportsRes.value.data || []);
        } else {
          console.error('Failed to fetch reports:', reportsRes.reason);
          setReports(cachedData.reports || []);
        }

        if (lastChatRes.status === 'fulfilled') {
          setLastChatTimestamp(lastChatRes.value.data.lastChatTimestamp ? new Date(lastChatRes.value.data.lastChatTimestamp) : null);
        } else {
          console.error('Failed to fetch last chat:', lastChatRes.reason);
          setLastChatTimestamp(cachedData.lastChatTimestamp ? new Date(cachedData.lastChatTimestamp) : null);
        }

        if (affirmationsRes.status === 'fulfilled') {
          setDailyAffirmations(affirmationsRes.value.data || null);
        } else {
          console.error('Failed to fetch daily affirmations:', affirmationsRes.reason);
          setDailyAffirmations(cachedData.dailyAffirmations || null);
        }

        if (tokensRes.status === 'fulfilled') {
          setTranquilTokens(tokensRes.value.data.tranquilTokens || 1);
          const regenTime = tokensRes.value.data.lastTokenRegen
            ? new Date(new Date(tokensRes.value.data.lastTokenRegen).getTime() + 24 * 60 * 60 * 1000)
            : null;
          setTokenRegenTime(regenTime);
        } else {
          console.error('Failed to fetch tranquil tokens:', tokensRes.reason);
          setMessage('Unable to fetch Tranquil Tokens. Please try again.');
        }

        localStorage.setItem('userData', JSON.stringify({
          goals: goalsRes.status === 'fulfilled' ? goalsRes.value.data : cachedData.goals,
          reports: reportsRes.status === 'fulfilled' ? reportsRes.value.data : cachedData.reports,
          lastChatTimestamp: lastChatRes.status === 'fulfilled' ? lastChatRes.value.data.lastChatTimestamp : cachedData.lastChatTimestamp,
          tranquilTokens: tokensRes.status === 'fulfilled' ? tokensRes.value.data.tranquilTokens : 1,
          lastTokenRegen: tokensRes.status === 'fulfilled' ? tokensRes.value.data.lastTokenRegen : cachedData.lastTokenRegen,
          dailyAffirmations: affirmationsRes.status === 'fulfilled' ? affirmationsRes.value.data : cachedData.dailyAffirmations
        }));

        const [journalRes, insightsRes] = await Promise.all([
          axios.get(`${API_URL}/api/regular/journal`, { headers: { Authorization: authToken } }).catch(err => ({ error: err })),
          axios.get(`${API_URL}/api/regular/journal-insights`, { headers: { Authorization: authToken } }).catch(err => ({ error: err }))
        ]);

        if (!journalRes.error) {
          setJournal(journalRes.data || []);
        } else {
          console.error('Failed to fetch journal:', journalRes.error);
          setJournal(cachedData.journal || []);
        }

        if (!insightsRes.error) {
          setJournalInsights(insightsRes.data || []);
        } else {
          console.error('Failed to fetch journal insights:', insightsRes.error);
          setJournalInsights(cachedData.journalInsights || []);
        }

        localStorage.setItem('userData', JSON.stringify({
          ...JSON.parse(localStorage.getItem('userData') || '{}'),
          journal: !journalRes.error ? journalRes.data : cachedData.journal,
          journalInsights: !insightsRes.error ? insightsRes.data : cachedData.journalInsights,
        }));
      } catch (err) {
        console.error('Error fetching user data:', err);
        setMessage('Some data could not be loaded. Please try again.');
      } finally {
        setIsLoading(false);
        setIsFetchingUserData(false);
      }
    }, 300),
    []
  );

  // Manage affirmations during loading
  useEffect(() => {
    if (isLoading && !showSummaryBuffer && !showInsightBuffer) {
      const usedPositions = new Set();
      const interval = setInterval(() => {
        const availablePositions = affirmationPositions.filter(pos => !usedPositions.has(pos));
        if (availablePositions.length === 0) return;
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
  }, [isLoading, showSummaryBuffer, showInsightBuffer]);

  // Check for token on mount to maintain session
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken && !token) {
      setToken(storedToken);
      setRole('regular');
      debouncedFetchUserData(storedToken);
    }
  }, []);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Token regeneration (every 24 hours)
  useEffect(() => {
    if (tranquilTokens < 1 && tokenRegenTime) {
      const interval = setInterval(() => {
        const now = new Date();
        const timeDiff = (tokenRegenTime - now) / 1000;
        if (timeDiff <= 0) {
          setTranquilTokens((prev) => prev + 1);
          setTokenRegenTime(new Date(now.getTime() + 24 * 60 * 60 * 1000));
        }
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [tranquilTokens, tokenRegenTime]);

  // === START OF STRIPE ADDITION ===
  // Handle Stripe redirect after payment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionId = urlParams.get('session_id');
    if (sessionId && token) {
      const completePurchase = async () => {
        setIsLoading(true);
        try {
          const response = await axios.post(
            `${API_URL}/api/regular/purchase-tokens`,
            { sessionId },
            { headers: { Authorization: token } }
          );
          setTranquilTokens(response.data.tranquilTokens);
          setMessage(`Successfully purchased Tranquil Tokens!`);
          // Clear query parameters
          window.history.replaceState({}, document.title, window.location.pathname);
          setActiveTab('chat'); // Redirect to chat tab after purchase
        } catch (err) {
          console.error('Error completing purchase:', err);
          setMessage('Error completing purchase: ' + (err.response?.data?.error || err.message));
        } finally {
          setIsLoading(false);
        }
      };
      completePurchase();
    }
  }, [token]);
  // === END OF STRIPE ADDITION ===

  // Token consumption
  const consumeToken = async (action, callback) => {
    if (tranquilTokens < 1) {
      setMessage('No Tranquil Tokens available. Purchase more or wait for regeneration (every 24 hours).');
      return;
    }
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/regular/consume-token`,
        { action },
        { headers: { Authorization: token } }
      );
      setTranquilTokens((prev) => prev - 1);
      callback();
    } catch (err) {
      setMessage('Error consuming token: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  // Update user data when token or role changes
  useEffect(() => {
    if (token && role === 'regular') {
      localStorage.setItem('token', token);
      debouncedFetchUserData(token);
    }
  }, [token, role]);

  // Existing useEffects
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
      question: "How happy are you feeling right now?",
      feedback: (value) => [
        "Feeling quite down",
        "Somewhat unhappy",
        "Moderately happy",
        "Quite happy",
        "Very happy"
      ][value - 1],
      emojis: ["😢", "🙁", "😐", "🙂", "😊"]
    },
    anger: {
      question: "How angry are you feeling right now?",
      feedback: (value) => [
        "Very calm",
        "Somewhat calm",
        "Moderately angry",
        "Quite angry",
        "Very angry"
      ][value - 1],
      emojis: ["😊", "🙂", "😐", "😣", "😣"]
    },
    stress: {
      question: "How stressed are you feeling right now?",
      feedback: (value) => [
        "Very relaxed",
        "Somewhat relaxed",
        "Moderately stressed",
        "Quite stressed",
        "Very stressed"
      ][value - 1],
      emojis: ["😊", "🙂", "😐", "😣", "😣"]
    },
    energy: {
      question: "How energized are you feeling right now?",
      feedback: (value) => [
        "Very drained",
        "Somewhat tired",
        "Moderately energized",
        "Quite energized",
        "Very energized"
      ][value - 1],
      emojis: ["😴", "😪", "😐", "💪", "⚡"]
    },
    confidence: {
      question: "How confident are you feeling right now?",
      feedback: (value) => [
        "Very unsure",
        "Somewhat doubtful",
        "Moderately confident",
        "Quite confident",
        "Very confident"
      ][value - 1],
      emojis: ["😓", "😕", "😐", "😊", "😊"]
    }
  };

  const quizQuestions = Object.keys(emotionDescriptions);

  const journalPrompts = {
    daily: [
      { key: 'highlights', heading: 'Highlights', subheading: 'What were the best parts of your day?' },
      { key: 'learned', heading: 'Learned', subheading: 'What did you learn today?' },
      { key: 'challenges', heading: 'Challenges', subheading: 'What challenges did you face?' },
      { key: 'emotions', heading: 'Emotions', subheading: 'How did you feel today?' }
    ],
    dream: [
      { key: 'dreamDescription', heading: 'Dream Description', subheading: 'Describe your dream in detail.' },
      { key: 'dreamEmotions', heading: 'Dream Emotions', subheading: 'What emotions did you feel in the dream?' },
      { key: 'themes', heading: 'Themes', subheading: 'What themes or symbols stood out?' },
      { key: 'standout', heading: 'Standout Moment', subheading: 'What was the most memorable part?' }
    ],
    freestyle: [
      { key: 'thoughts', heading: 'My Thoughts', subheading: 'Write whatever is on your mind.' }
    ]
  };

  // Modified handleStartQuiz to require token confirmation
  const handleStartQuiz = () => {
    if (tranquilTokens < 1) {
      setMessage('No Tranquil Tokens available. Purchase more or wait for regeneration (every 24 hours).');
      return;
    }
    setTokenConfirm({ action: 'startChat', callback: () => {
      setIsQuizActive(true);
      setCurrentQuizQuestion(0);
      setQuiz({ happiness: 0, anger: 0, stress: 0, energy: 0, confidence: 0, isPostChat: false });
      setSelectedAnswer(null);
    }});
  };

  // Modified handleGenerateInsight with buffering
  const handleGenerateInsight = async (entry) => {
    if (tranquilTokens < 1) {
      setMessage('No Tranquil Tokens available. Purchase more or wait for regeneration (every 24 hours).');
      return;
    }
    setTokenConfirm({
      action: 'generateInsight',
      callback: async () => {
        setShowInsightBuffer(true);
        setIsLoading(true);
        try {
          // Simulate 8-second buffering
          await new Promise((resolve) => setTimeout(resolve, 8000));
          const response = await axios.post(
            `${API_URL}/api/regular/journal-insights`,
            {
              journalDate: entry.date,
              responses: entry.responses,
            },
            { headers: { Authorization: token } }
          );
          const newInsight = {
            journalDate: new Date(entry.date),
            insight: response.data.insight,
            createdAt: new Date(),
          };
          setJournalInsights((prev) => [...prev, newInsight]);
          setMessage('Insight generated! View it in the notepad.');
          // Ensure journal entry remains open
          setOpenNotepadSection('reflect');
          setSelectedJournalEntry(entry);
        } catch (err) {
          console.error('Error generating insight:', err);
          setMessage('Error generating insight: ' + (err.response?.data?.error || err.message));
        } finally {
          setShowInsightBuffer(false);
          setIsLoading(false);
        }
      }
    });
  };

  // === START OF STRIPE ADDITION ===
  // Shop purchase handler
  const handlePurchaseTokens = async (quantity, productId) => {
    setIsLoading(true);
    try {
      // Create a Stripe Checkout session
      const response = await axios.post(
        `${API_URL}/api/regular/create-checkout-session`,
        { quantity, productId },
        { headers: { Authorization: token } }
      );

      const { sessionId } = response.data;
      const stripe = await stripePromise;
      const { error } = await stripe.redirectToCheckout({ sessionId });

      if (error) {
        console.error('Stripe redirect error:', error);
        setMessage(`Purchase failed: ${error.message}`);
      }
    } catch (err) {
      console.error('Error initiating purchase:', err);
      setMessage('Error initiating purchase: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };
  // === END OF STRIPE ADDITION ===

  // Existing handlers
  const handleRegularSignup = (e) => {
    e.preventDefault();
    setIsLoading(true);
    axios.post(`${API_URL}/api/regular/signup`, regularSignupForm)
      .then((res) => {
        setMessage(res.data.message);
        setToken(res.data.token);
        setRole('regular');
        debouncedFetchUserData(res.data.token);
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
        debouncedFetchUserData(res.data.token);
      })
      .catch((err) => setMessage(err.response?.data?.error || 'Login failed'))
      .finally(() => setIsLoading(false));
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
          const helpline = "If you're in the UK, please call Samaritans at 116 123. In the US, call 988. You're not alone, and help is available.";
          setChat((prev) => [...prev, { sender: 'pal', text: helpline, timestamp: new Date() }]);
          return;
        }
        const response = await axios.post(
          `${API_URL}/api/regular/chat`,
          { message: text, chatHistory: chat },
          { headers: { Authorization: token } }
        );
        setChat((prev) => [...prev, { sender: 'pal', text: response.data.text, timestamp: new Date(response.data.timestamp) }]);
      } catch (error) {
        console.error('Error chatting:', error);
        setMessage('Error chatting: ' + (error.response?.data?.error || error.message));
      }
    }, 300),
    [chat, timeLeft, token]
  );

  const handleEndChat = async () => {
    setTimeLeft(0);
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/regular/end-chat`,
        { chatHistory: chat, quiz },
        { headers: { Authorization: token } }
      );
      const newReport = response.data;
      setReports((prev) => [...prev, newReport]);
      setLastChatTimestamp(new Date());
      setChat([]);
      setIsChatActive(false);
      setExtendCount(0);
      setShowSummaryBuffer(true);
      setTimeout(() => {
        setShowSummaryBuffer(false);
        setActiveTab('reflect');
        setSelectedReport(newReport);
        setMessage('Session complete! Check your Reflect tab for the summary.');
        debouncedFetchUserData(token);
      }, 1500);
    } catch (error) {
      console.error('Error ending chat:', error);
      setMessage('Error ending chat: ' + (error.response?.data?.error || error.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenJournal = (type) => {
    setOpenJournalType(type);
    setJournalResponses({});
  };

  const handleCloseJournal = () => {
    setOpenJournalType(null);
    setJournalResponses({});
  };

  const handleJournalInput = (key, value) => {
    setJournalResponses((prev) => ({ ...prev, [key]: value }));
  };

  const handleSaveJournal = async () => {
    if (Object.keys(journalResponses).length === 0) {
      setMessage('Please fill in at least one response before saving.');
      return;
    }
    setIsLoading(true);
    const journalData = {
      date: new Date().toISOString(),
      type: openJournalType,
      responses: { ...journalResponses },
    };
    try {
      const response = await axios.post(`${API_URL}/api/regular/insights`, journalData, {
        headers: { Authorization: token },
      });
      const newJournalEntry = {
        _id: response.data._id,
        date: new Date(journalData.date),
        type: journalData.type,
        responses: journalData.responses,
      };
      setJournal((prev) => [...prev, newJournalEntry]);
      setOpenJournalType(null);
      setJournalResponses({});
      setActiveTab('journal');
      setSelectedJournalEntry(newJournalEntry);
      setMessage('Journal saved! Check your journal tab.');
      await debouncedFetchUserData(token);
    } catch (err) {
      console.error('Error saving journal:', err);
      setMessage('Error saving journal: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenJournalEntry = (entry) => {
    setSelectedJournalEntry(entry);
    setOpenNotepadSection('reflect');
  };

  const handleCloseJournalEntry = () => {
    setSelectedJournalEntry(null);
    setOpenNotepadSection(null);
  };

  const handleDeleteJournal = async (entryId) => {
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/api/regular/journal/${entryId}`, {
        headers: { Authorization: token },
      });
      setJournal((prev) => prev.filter((entry) => entry._id !== entryId));
      setJournalInsights((prev) =>
        prev.filter((insight) => {
          const journalDate = journal.find((entry) => entry._id === entryId)?.date;
          return journalDate ? new Date(insight.journalDate).getTime() !== new Date(journalDate).getTime() : true;
        })
      );
      setSelectedJournalEntry(null);
      setOpenNotepadSection(null);
      setMessage('Journal entry deleted successfully.');
    } catch (err) {
      console.error('Error deleting journal:', err);
      setMessage('Error deleting journal: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleDeleteReport = async (reportId) => {
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/api/regular/reports/${reportId}`, {
        headers: { Authorization: token },
      });
      setReports((prev) => prev.filter((report) => report._id !== reportId));
      setSelectedReport(null);
      setOpenNotepadSection(null);
      setMessage('Report deleted successfully.');
    } catch (err) {
      console.error('Error deleting report:', err);
      setMessage('Error deleting report: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      setDeleteConfirm(null);
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
      setShowDailyAffirmationsModal(true);
      setMessage('New daily affirmations generated!');
    } catch (err) {
      console.error('Error generating affirmations:', err);
      setMessage('Error generating affirmations: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteAccount = async () => {
    setIsLoading(true);
    try {
      await axios.delete(`${API_URL}/api/regular/account`, {
        headers: { Authorization: token },
      });
      setMessage('Account deleted successfully');
      handleLogout();
    } catch (err) {
      console.error('Error deleting account:', err);
      setMessage('Error deleting account: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
      setDeleteConfirm(null);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('userData');
    setRole(null);
    setIsQuizActive(false);
    setIsChatActive(false);
    setQuiz({ happiness: 0, anger: 0, stress: 0, energy: 0, confidence: 0, isPostChat: false });
    setChat([]);
    setTimeLeft(15 * 60);
    setExtendCount(0);
    setLastChatTimestamp(null);
    setTranquilTokens(1);
    setTokenRegenTime(null);
    setGoals([]);
    setReports([]);
    setJournal([]);
    setJournalInsights([]);
    setMessage('Logged out');
    setActiveTab('chat');
    setSelectedReport(null);
    setSelectedJournalEntry(null);
    setOpenNotepadSection(null);
    setOpenJournalType(null);
    setJournalResponses({});
    setShowSummaryBuffer(false);
    setChatInput('');
    setShowSignup(false);
    setDeleteConfirm(null);
    setAffirmationsList([]);
    setDailyAffirmations(null);
    setShowDailyAffirmationsModal(false);
    setTokenConfirm(null);
    setShowInsightBuffer(false);
  };

  const handleOpenNotepad = (section) => {
    setOpenNotepadSection(section);
  };

  const handleCloseNotepad = () => {
    setOpenNotepadSection(null);
  };

  const handleViewReport = (report) => {
    setSelectedReport(report);
    setTimeout(() => {
      if (reportDetailsRef.current) {
        reportDetailsRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
      }
    }, 100);
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
        scales: {
          y: {
            min: 0,
            max: 5,
            ticks: {
              stepSize: 1,
            },
          },
          x: {
            title: {
              display: true,
              text: 'Date',
              padding: { top: 10 },
            },
            ticks: {
              padding: 10,
              maxRotation: 45,
              minRotation: 45,
            },
          },
        },
        plugins: {
          tooltip: {
            callbacks: {
              label: function (context) {
                const datasetLabel = context.dataset.label || '';
                const value = context.parsed.y;
                const date = context.chart.data.labels[context.dataIndex];
                return `${datasetLabel}: ${value} (Date: ${date})`;
              },
            },
          },
        },
        layout: {
          padding: {
            bottom: 20,
          },
        },
        maintainAspectRatio: false,
      },
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

  const renderJournalResponses = (entry) => {
    const responses = entry.responses;
    const insight = journalInsights.find((i) => new Date(i.journalDate).getTime() === new Date(entry.date).getTime());
    const hasInsight = !!insight;

    if (entry.type === 'daily') {
      return (
        <div>
          <h4>Highlights</h4>
          <p>{responses.highlights || 'Not available'}</p>
          <h4>Learned</h4>
          <p>{responses.learned || 'Not available'}</p>
          <h4>Challenges</h4>
          <p>{responses.challenges || 'Not available'}</p>
          <h4>Emotions</h4>
          <p>{responses.emotions || 'Not available'}</p>
          {hasInsight ? (
            <>
              <h4>Your Insights</h4>
              <p>{insight.insight}</p>
            </>
          ) : (
            <button onClick={() => handleGenerateInsight(entry)} disabled={isLoading}>
              Gain Profound Insights
            </button>
          )}
        </div>
      );
    } else if (entry.type === 'dream') {
      return (
        <div>
          <h4>Dream Description</h4>
          <p>{responses.dreamDescription || 'Not available'}</p>
          <h4>Dream Emotions</h4>
          <p>{responses.dreamEmotions || 'Not available'}</p>
          <h4>Themes</h4>
          <p>{responses.themes || 'Not available'}</p>
          <h4>Standout Moment</h4>
          <p>{responses.standout || 'Not available'}</p>
          {hasInsight ? (
            <>
              <h4>Your Insights</h4>
              <p>{insight.insight}</p>
            </>
          ) : (
            <button onClick={() => handleGenerateInsight(entry)} disabled={isLoading}>
              Gain Profound Insights
            </button>
          )}
        </div>
      );
    } else if (entry.type === 'freestyle') {
      return (
        <div>
          <h4>My Thoughts</h4>
          <p>{responses.thoughts || 'Not available'}</p>
          {hasInsight ? (
            <>
              <h4>Your Insights</h4>
              <p>{insight.insight}</p>
            </>
          ) : (
            <button onClick={() => handleGenerateInsight(entry)} disabled={isLoading}>
              Gain Profound Insights
            </button>
          )}
        </div>
      );
    }
    return null;
  };

  const renderJournalEntry = (entry) => {
    return (
      <div key={entry._id} className="journal-entry">
        <p>{new Date(entry.date).toLocaleDateString()}</p>
        <p>Type: {entry.type.charAt(0).toUpperCase() + entry.type.slice(1)}</p>
        <button onClick={() => handleOpenJournalEntry(entry)}>View</button>
        <button onClick={() => setDeleteConfirm({ type: 'journal', id: entry._id })}>Delete</button>
      </div>
    );
  };

  const paginatedJournal = useMemo(() => {
    const start = (journalPage - 1) * 5;
    const end = start + 5;
    return journal.slice().reverse().slice(start, end);
  }, [journal, journalPage]);

  const paginatedReports = useMemo(() => {
    const start = (reflectPage - 1) * 5;
    const end = start + 5;
    return reports.slice().reverse().slice(start, end);
  }, [reports, reflectPage]);

  // Render UI
  if (!token) {
    return (
      <div className="auth">
        {showSignup ? (
          <>
            <h2>Sign Up</h2>
            <form onSubmit={handleRegularSignup}>
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
              <button type="submit" disabled={isLoading}>Sign Up</button>
            </form>
            <p>{message}</p>
            <button onClick={() => setShowSignup(false)}>Back to Login</button>
          </>
        ) : (
          <>
            <h2>Login</h2>
            <form onSubmit={handleRegularLogin}>
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
              <button type="submit" disabled={isLoading}>Login</button>
            </form>
            <p>{message}</p>
            <button onClick={() => setShowSignup(true)}>Sign Up</button>
          </>
        )}
        {isLoading && affirmationsList.map((aff) => (
          <div key={aff.id} className={`affirmation ${aff.position}`}>
            {aff.text}
          </div>
        ))}
      </div>
    );
  }

  if (showInsightBuffer) {
    return (
      <div className="buffer-screen">
        <h2>Generating Your Insight...</h2>
        <p>This may take a moment as we reflect deeply on your thoughts.</p>
        {affirmationsList.map((aff) => (
          <div key={aff.id} className={`affirmation ${aff.position}`}>
            {aff.text}
          </div>
        ))}
      </div>
    );
  }

  if (showSummaryBuffer) {
    return (
      <div className="buffer-screen">
        <h2>Preparing Your Summary...</h2>
        <p>We're reflecting on our chat to provide meaningful insights.</p>
        {affirmationsList.map((aff) => (
          <div key={aff.id} className={`affirmation ${aff.position}`}>
            {aff.text}
          </div>
        ))}
      </div>
    );
  }

  if (isQuizActive) {
    const currentEmotion = quizQuestions[currentQuizQuestion];
    const { question, feedback, emojis } = emotionDescriptions[currentEmotion];

    return (
      <div className="quiz">
        <h2>{question}</h2>
        <div className="quiz-options">
          {[1, 2, 3, 4, 5].map((value) => (
            <button
              key={value}
              className={selectedAnswer === value ? 'selected' : ''}
              onClick={() => handleQuizAnswer(value)}
              onKeyPress={(e) => handleQuizKeyPress(e, value)}
              aria-label={feedback(value)}
            >
              {emojis[value - 1]} {feedback(value)}
            </button>
          ))}
        </div>
        {selectedAnswer !== null && (
          <button
            onClick={currentQuizQuestion < quizQuestions.length - 1 ? handleQuizNext : handleStartChat}
            className="next-button"
          >
            {currentQuizQuestion < quizQuestions.length - 1 ? 'Next' : 'Start Chat'}
          </button>
        )}
      </div>
    );
  }

  if (showBreathe) {
    return (
      <div className="breathe">
        <h2>Breathe</h2>
        <div className="breathe-circle">{breatheCount}</div>
      </div>
    );
  }

  if (tokenConfirm) {
    return (
      <div className="confirmation">
        <h2>Confirm Token Usage</h2>
        <p>
          This action ({tokenConfirm.action === 'startChat' ? 'starting a chat' : 'generating an insight'}) will use 1
          Tranquil Token. You have {tranquilTokens} tokens remaining.
        </p>
        <button
          onClick={() => {
            consumeToken(tokenConfirm.action, tokenConfirm.callback);
            setTokenConfirm(null);
          }}
          disabled={isLoading}
        >
          Confirm
        </button>
        <button onClick={() => setTokenConfirm(null)} disabled={isLoading}>
          Cancel
        </button>
      </div>
    );
  }

  if (deleteConfirm) {
    return (
      <div className="confirmation">
        <h2>Confirm Deletion</h2>
        <p>
          Are you sure you want to delete this {deleteConfirm.type === 'report' ? 'report' : deleteConfirm.type === 'journal' ? 'journal entry' : 'account'}? This action cannot be undone.
        </p>
        <button
          onClick={() => {
            if (deleteConfirm.type === 'report') {
              handleDeleteReport(deleteConfirm.id);
            } else if (deleteConfirm.type === 'journal') {
              handleDeleteJournal(deleteConfirm.id);
            } else {
              handleDeleteAccount();
            }
          }}
          disabled={isLoading}
        >
          Confirm
        </button>
        <button onClick={() => setDeleteConfirm(null)} disabled={isLoading}>
          Cancel
        </button>
      </div>
    );
  }

  if (openJournalType) {
    return (
      <div className="journal-form">
        <h2>{openJournalType.charAt(0).toUpperCase() + openJournalType.slice(1)} Journal</h2>
        {journalPrompts[openJournalType].map((prompt) => (
          <div key={prompt.key} className="journal-prompt">
            <h3>{prompt.heading}</h3>
            <p>{prompt.subheading}</p>
            <textarea
              value={journalResponses[prompt.key] || ''}
              onChange={(e) => handleJournalInput(prompt.key, e.target.value)}
              placeholder="Write here..."
            />
          </div>
        ))}
        <button onClick={handleSaveJournal} disabled={isLoading}>
          Save Journal
        </button>
        <button onClick={handleCloseJournal} disabled={isLoading}>
          Cancel
        </button>
      </div>
    );
  }

  if (showDailyAffirmationsModal && dailyAffirmations) {
    return (
      <div className="daily-affirmations-modal">
        <h2>Your Daily Affirmations</h2>
        <div className="affirmation-card">
          <h3>Suggest</h3>
          <p>{dailyAffirmations.suggest}</p>
        </div>
        <div className="affirmation-card">
          <h3>Encourage</h3>
          <p>{dailyAffirmations.encourage}</p>
        </div>
        <div className="affirmation-card">
          <h3>Invite</h3>
          <p>{dailyAffirmations.invite}</p>
        </div>
        <button onClick={() => setShowDailyAffirmationsModal(false)}>Close</button>
      </div>
    );
  }

  return (
    <div className="app">
      <header>
        <h1>MindSprout</h1>
        <div className="header-info">
          <span>Tokens: {tranquilTokens}</span>
          {tokenRegenTime && tranquilTokens < 1 && (
            <span>
              Next token in:{' '}
              {Math.floor((tokenRegenTime - new Date()) / (1000 * 60 * 60))}h{' '}
              {Math.floor(((tokenRegenTime - new Date()) % (1000 * 60 * 60)) / (1000 * 60))}m
            </span>
          )}
          <button onClick={() => setDeleteConfirm({ type: 'account' })}>Delete Account</button>
          <button onClick={handleLogout}>Logout</button>
        </div>
      </header>
      <nav>
        <button
          className={activeTab === 'chat' ? 'active' : ''}
          onClick={() => setActiveTab('chat')}
        >
          Chat
        </button>
        <button
          className={activeTab === 'journal' ? 'active' : ''}
          onClick={() => setActiveTab('journal')}
        >
          Journal
        </button>
        <button
          className={activeTab === 'reflect' ? 'active' : ''}
          onClick={() => setActiveTab('reflect')}
        >
          Reflect
        </button>
        <button
          className={activeTab === 'shop' ? 'active' : ''}
          onClick={() => setActiveTab('shop')}
        >
          Shop
        </button>
      </nav>
      <main>
        {message && (
          <div className="message">
            {message}
            <button onClick={() => setMessage('')}>×</button>
          </div>
        )}
        {isLoading && affirmationsList.map((aff) => (
          <div key={aff.id} className={`affirmation ${aff.position}`}>
            {aff.text}
          </div>
        ))}
        {activeTab === 'chat' && (
          <div className="chat-tab">
            {!isChatActive ? (
              <>
                <button onClick={handleStartQuiz} disabled={isLoading}>
                  Start New Chat
                </button>
                <button
                  onClick={handleGenerateDailyAffirmations}
                  disabled={isLoading || (dailyAffirmations && new Date(dailyAffirmations.validUntil) > new Date())}
                >
                  Generate Daily Affirmations
                </button>
                {dailyAffirmations && new Date(dailyAffirmations.validUntil) > new Date() && (
                  <button onClick={() => setShowDailyAffirmationsModal(true)}>
                    View Daily Affirmations
                  </button>
                )}
              </>
            ) : (
              <>
                <div className="chat-box" ref={chatBoxRef}>
                  {chat.map((msg, index) => (
                    <div key={index} className={`chat-message ${msg.sender}`}>
                      <span>{msg.text}</span>
                      <span className="timestamp">
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="chat-controls">
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleChat(chatInput)}
                    placeholder="Type your message..."
                    disabled={timeLeft <= 0}
                  />
                  <button
                    onClick={() => handleChat(chatInput)}
                    disabled={timeLeft <= 0 || !chatInput || isLoading}
                  >
                    Send
                  </button>
                  <button
                    onClick={handleExtendChat}
                    disabled={extendCount >= 3 || timeLeft <= 0 || isLoading}
                  >
                    Extend Chat
                  </button>
                  <button onClick={handleEndChat} disabled={isLoading}>
                    End Chat
                  </button>
                  <p>Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                </div>
              </>
            )}
          </div>
        )}
        {activeTab === 'journal' && (
          <div className="journal-tab">
            <h2>Journal</h2>
            <div className="journal-options">
              <button onClick={() => handleOpenJournal('daily')} disabled={isLoading}>
                Daily Journal
              </button>
              <button onClick={() => handleOpenJournal('dream')} disabled={isLoading}>
                Dream Journal
              </button>
              <button onClick={() => handleOpenJournal('freestyle')} disabled={isLoading}>
                Freestyle Journal
              </button>
            </div>
            <div className="journal-entries">
              {paginatedJournal.map(renderJournalEntry)}
            </div>
            <div className="pagination">
              <button
                onClick={() => setJournalPage((prev) => Math.max(prev - 1, 1))}
                disabled={journalPage === 1}
              >
                Previous
              </button>
              <span>Page {journalPage}</span>
              <button
                onClick={() => setJournalPage((prev) => prev + 1)}
                disabled={journalPage * 5 >= journal.length}
              >
                Next
              </button>
            </div>
          </div>
        )}
        {activeTab === 'reflect' && (
          <div className="reflect-tab">
            <h2>Reflect</h2>
            {isDesktop ? (
              <div className="reflect-content">
                <div className="reflect-sidebar">
                  <button onClick={() => handleOpenNotepad('reports')}>
                    View Reports
                  </button>
                  <button onClick={() => handleOpenNotepad('weekly')}>
                    Weekly Mood
                  </button>
                </div>
                <div className="reflect-main">
                  {openNotepadSection === 'reports' && (
                    <div className="reports">
                      {paginatedReports.map((report) => (
                        <div key={report._id} className="report">
                          <p>{new Date(report.date).toLocaleDateString()}</p>
                          <button onClick={() => handleViewReport(report)}>
                            View
                          </button>
                          <button
                            onClick={() => setDeleteConfirm({ type: 'report', id: report._id })}
                          >
                            Delete
                          </button>
                        </div>
                      ))}
                      <div className="pagination">
                        <button
                          onClick={() => setReflectPage((prev) => Math.max(prev - 1, 1))}
                          disabled={reflectPage === 1}
                        >
                          Previous
                        </button>
                        <span>Page {reflectPage}</span>
                        <button
                          onClick={() => setReflectPage((prev) => prev + 1)}
                          disabled={reflectPage * 5 >= reports.length}
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}
                  {openNotepadSection === 'weekly' && (
                    <div className="weekly-mood">
                      <h3>Weekly Mood Trends</h3>
                      <div className="chart-container">
                        <Line
                          data={weeklyMoodChartData}
                          options={weeklyMoodChartData.options}
                        />
                      </div>
                      <h3>Weekly Summary</h3>
                      <ul>
                        {weeklyMoodSummary.map((summary, index) => (
                          <li key={index}>{summary}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {selectedReport && (
                    <div className="report-details" ref={reportDetailsRef}>
                      <h3>Session on {new Date(selectedReport.date).toLocaleDateString()}</h3>
                      {barChartData && (
                        <div className="chart-container">
                          <Bar data={barChartData} options={barChartData.options} />
                        </div>
                      )}
                      <h4>What We Discussed</h4>
                      <p>{selectedReport.summary.discussed}</p>
                      <h4>Your Thoughts & Feelings</h4>
                      <p>{selectedReport.summary.thoughtsFeelings}</p>
                      <h4>Insights Uncovered</h4>
                      <p>{selectedReport.summary.insights}</p>
                      <h4>Mood Reflection</h4>
                      <p>{selectedReport.summary.moodReflection}</p>
                      <h4>Recommendations</h4>
                      <p>{selectedReport.summary.recommendations}</p>
                      <button onClick={() => setSelectedReport(null)}>Close</button>
                    </div>
                  )}
                  {selectedJournalEntry && (
                    <div className="journal-details">
                      <h3>
                        {selectedJournalEntry.type.charAt(0).toUpperCase() +
                          selectedJournalEntry.type.slice(1)}{' '}
                        Journal - {new Date(selectedJournalEntry.date).toLocaleDateString()}
                      </h3>
                      {renderJournalResponses(selectedJournalEntry)}
                      <button onClick={handleCloseJournalEntry}>Close</button>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <button onClick={() => handleOpenNotepad('reports')}>
                  View Reports
                </button>
                <button onClick={() => handleOpenNotepad('weekly')}>
                  Weekly Mood
                </button>
                {openNotepadSection === 'reports' && (
                  <div className="reports">
                    {paginatedReports.map((report) => (
                      <div key={report._id} className="report">
                        <p>{new Date(report.date).toLocaleDateString()}</p>
                        <button onClick={() => handleViewReport(report)}>
                          View
                        </button>
                        <button
                          onClick={() => setDeleteConfirm({ type: 'report', id: report._id })}
                        >
                          Delete
                        </button>
                      </div>
                    ))}
                    <div className="pagination">
                      <button
                        onClick={() => setReflectPage((prev) => Math.max(prev - 1, 1))}
                        disabled={reflectPage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {reflectPage}</span>
                      <button
                        onClick={() => setReflectPage((prev) => prev + 1)}
                        disabled={reflectPage * 5 >= reports.length}
                      >
                        Next
                      </button>
                    </div>
                  </div>
                )}
                {openNotepadSection === 'weekly' && (
                  <div className="weekly-mood">
                    <h3>Weekly Mood Trends</h3>
                    <div className="chart-container">
                      <Line
                        data={weeklyMoodChartData}
                        options={weeklyMoodChartData.options}
                      />
                    </div>
                    <h3>Weekly Summary</h3>
                    <ul>
                      {weeklyMoodSummary.map((summary, index) => (
                        <li key={index}>{summary}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {selectedReport && (
                  <div className="report-details" ref={reportDetailsRef}>
                    <h3>Session on {new Date(selectedReport.date).toLocaleDateString()}</h3>
                    {barChartData && (
                      <div className="chart-container">
                        <Bar data={barChartData} options={barChartData.options} />
                      </div>
                    )}
                    <h4>What We Discussed</h4>
                    <p>{selectedReport.summary.discussed}</p>
                    <h4>Your Thoughts & Feelings</h4>
                    <p>{selectedReport.summary.thoughtsFeelings}</p>
                    <h4>Insights Uncovered</h4>
                    <p>{selectedReport.summary.insights}</p>
                    <h4>Mood Reflection</h4>
                    <p>{selectedReport.summary.moodReflection}</p>
                    <h4>Recommendations</h4>
                    <p>{selectedReport.summary.recommendations}</p>
                    <button onClick={() => setSelectedReport(null)}>Close</button>
                  </div>
                )}
                {selectedJournalEntry && (
                  <div className="journal-details">
                    <h3>
                      {selectedJournalEntry.type.charAt(0).toUpperCase() +
                        selectedJournalEntry.type.slice(1)}{' '}
                      Journal - {new Date(selectedJournalEntry.date).toLocaleDateString()}
                    </h3>
                    {renderJournalResponses(selectedJournalEntry)}
                    <button onClick={handleCloseJournalEntry}>Close</button>
                  </div>
                )}
              </>
            )}
          </div>
        )}
        {activeTab === 'shop' && (
          <div className="shop-tab">
            <h2>Shop Tranquil Tokens</h2>
            <div className="shop-items">
              <div className="shop-item">
                <h3>1 Tranquil Token</h3>
                <p>£0.99</p>
                <button
                  onClick={() => handlePurchaseTokens(1, 'tranquil_tokens_1')}
                  disabled={isLoading}
                >
                  Buy Now
                </button>
              </div>
              <div className="shop-item">
                <h3>5 Tranquil Tokens</h3>
                <p>£3.99</p>
                <button
                  onClick={() => handlePurchaseTokens(5, 'tranquil_tokens_5')}
                  disabled={isLoading}
                >
                  Buy Now
                </button>
              </div>
              <div className="shop-item">
                <h3>10 Tranquil Tokens</h3>
                <p>£6.99</p>
                <button
                  onClick={() => handlePurchaseTokens(10, 'tranquil_tokens_10')}
                  disabled={isLoading}
                >
                  Buy Now
                </button>
              </div>
              <div className="shop-item">
                <h3>50 Tranquil Tokens</h3>
                <p>£19.99</p>
                <button
                  onClick={() => handlePurchaseTokens(50, 'tranquil_tokens_50')}
                  disabled={isLoading}
                >
                  Buy Now
                </button>
              </div>
              <div className="shop-item">
                <h3>100 Tranquil Tokens</h3>
                <p>£29.99</p>
                <button
                  onClick={() => handlePurchaseTokens(100, 'tranquil_tokens_100')}
                  disabled={isLoading}
                >
                  Buy Now
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
