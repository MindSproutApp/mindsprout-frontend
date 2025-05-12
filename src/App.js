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
  const [showInsightBuffer, setShowInsightBuffer] = useState(false);
  const [starlitGuidance, setStarlitGuidance] = useState(null);

  useEffect(() => {
    const fetchStarlitGuidance = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/regular/starlit-guidance`, {
          headers: { Authorization: token },
        });
        console.log('Starlit Guidance:', response.data); // Debug
        setStarlitGuidance(response.data);
      } catch (error) {
        console.error('Error fetching Starlit Guidance:', error);
        setMessage('Failed to fetch Starlit Guidance.');
      }
    };
  
    if (token) {
      fetchStarlitGuidance();
    }
  }, [token, API_URL]);

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
        // Load cached data as fallback
        const cachedData = JSON.parse(localStorage.getItem('userData') || '{}');
        if (cachedData.goals) setGoals(cachedData.goals);
        if (cachedData.reports) setReports(cachedData.reports);
        if (cachedData.journal) setJournal(cachedData.journal);
        if (cachedData.journalInsights) setJournalInsights(cachedData.journalInsights);

        // Fetch all user data from the new endpoint
        const response = await axios.get(`${API_URL}/api/regular/user-data`, {
          headers: { Authorization: authToken }
        });

        const {
          goals,
          reports,
          lastChatTimestamp,
          tranquilTokens,
          lastTokenRegen,
          journal,
          journalInsights,
          starlitGuidance
        } = response.data;

        // Update state with fetched data
        setGoals(goals || []);
        setReports(reports || []);
        setLastChatTimestamp(lastChatTimestamp ? new Date(lastChatTimestamp) : null);
        setTranquilTokens(tranquilTokens || 1);
        setTokenRegenTime(
          lastTokenRegen
            ? new Date(new Date(lastTokenRegen).getTime() + 24 * 60 * 60 * 1000)
            : null
        );
        setJournal(journal || []);
        setJournalInsights(journalInsights || []);
        setStarlitGuidance(starlitGuidance || null);

        // Cache the fetched data
        localStorage.setItem('userData', JSON.stringify({
          goals,
          reports,
          lastChatTimestamp,
          tranquilTokens,
          lastTokenRegen,
          journal,
          journalInsights,
          starlitGuidance
        }));
      } catch (err) {
        console.error('Error fetching user data:', err);
        setMessage('Some data could not be loaded. Please try again.');
        // Use cached data as fallback
        const cachedData = JSON.parse(localStorage.getItem('userData') || '{}');
        setGoals(cachedData.goals || []);
        setReports(cachedData.reports || []);
        setLastChatTimestamp(cachedData.lastChatTimestamp ? new Date(cachedData.lastChatTimestamp) : null);
        setTranquilTokens(cachedData.tranquilTokens || 1);
        setTokenRegenTime(
          cachedData.lastTokenRegen
            ? new Date(new Date(cachedData.lastTokenRegen).getTime() + 24 * 60 * 60 * 1000)
            : null
        );
        setJournal(cachedData.journal || []);
        setJournalInsights(cachedData.journalInsights || []);
        setStarlitGuidance(cachedData.starlitGuidance || null);
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
      // Still need to fully integrate payment processing logic
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
              padding: { top: 10 }, // Add padding to prevent cutoff
            },
            ticks: {
              padding: 10, // Ensure labels have space
              maxRotation: 45, // Rotate labels if needed
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
            bottom: 20, // Extra padding to ensure dates are visible
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
    return <p>No responses available</p>;
  };

  const entriesPerPage = 5;
  const sortedJournal = [...journal].sort((a, b) => new Date(b.date) - new Date(a.date));
  const journalPageCount = Math.ceil(sortedJournal.length / entriesPerPage);
  const journalStartIndex = (journalPage - 1) * entriesPerPage;
  const journalEndIndex = journalStartIndex + entriesPerPage;
  const paginatedJournal = sortedJournal.slice(journalStartIndex, journalEndIndex);

  const sortedReports = [...reports].sort((a, b) => new Date(b.date) - new Date(a.date));
  const reflectPageCount = Math.ceil(sortedReports.length / entriesPerPage);
  const reflectStartIndex = (reflectPage - 1) * entriesPerPage;
  const reflectEndIndex = reflectStartIndex + entriesPerPage;
  const paginatedReports = sortedReports.slice(reflectStartIndex, reflectEndIndex);

  const formatTime = (seconds) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="app">
      {(isLoading || showSummaryBuffer || showInsightBuffer) && (
        <div className={showInsightBuffer ? "insight-buffer-overlay" : "loading-overlay"}>
          <div className="spinner"></div>
          {showInsightBuffer ? (
            <p>Please wait whilst we gather your insights...</p>
          ) : showSummaryBuffer ? (
            <p>Preparing your summary...</p>
          ) : (
            affirmationsList.map((affirmation) => (
              <p
                key={affirmation.id}
                className={`affirmation ${affirmation.position}`}
              >
                {affirmation.text}
              </p>
            ))
          )}
        </div>
      )}
      {deleteConfirm && (
        <div className={`delete-confirm-modal ${deleteConfirm ? 'active' : ''}`}>
          <div className="delete-confirm-content">
            {deleteConfirm.type === 'account' ? (
              <>
                <h3>Are you sure you wish to delete your account?</h3>
                <p>All data involving your account will be deleted, this data is irretrievable</p>
                <div className="delete-confirm-buttons">
                  <button
                    onClick={handleDeleteAccount}
                    className="delete-account-btn"
                    aria-label="Confirm account deletion"
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setDeleteConfirm(null)}
                    aria-label="Cancel account deletion"
                  >
                    No
                  </button>
                </div>
              </>
            ) : (
              <>
                <h3>Are you sure you want to delete this entry?</h3>
                <p>This action cannot be undone.</p>
                <div className="delete-confirm-buttons">
                  <button
                    onClick={() => {
                      if (deleteConfirm.type === 'journal') {
                        handleDeleteJournal(deleteConfirm.id);
                      } else {
                        handleDeleteReport(deleteConfirm.id);
                      }
                    }}
                  >
                    Yes
                  </button>
                  <button onClick={() => setDeleteConfirm(null)}>No</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
      {tokenConfirm && (
        <div className={`token-confirm-modal ${tokenConfirm ? 'active' : ''}`}>
          <div className="token-confirm-content">
            <h3>Confirm Tranquil Token Usage</h3>
            <p>This feature will cost 1 Tranquil Token. Are you sure?</p>
            <div className="token-confirm-buttons">
              <button
                onClick={() => {
                  consumeToken(tokenConfirm.action, tokenConfirm.callback);
                  setTokenConfirm(null);
                }}
              >
                Yes
              </button>
              <button onClick={() => setTokenConfirm(null)}>No</button>
            </div>
          </div>
        </div>
      )}
      {showDailyAffirmationsModal && dailyAffirmations && (
        <div className="daily-affirmations-modal active">
          <div className="daily-affirmations-content">
            <button className="close-btn" onClick={() => setShowDailyAffirmationsModal(false)}>
              X
            </button>
            <h3>Daily Inspiration</h3>
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
      <div className="canvas">
        {token && (
          <div className="top-bar">
            <div className="token-section">
              <span>Tranquil Tokens: {tranquilTokens}</span>
              {tokenRegenTime && tranquilTokens < 1 && (
                <span className="regen-time">
                  (Next in {formatTime(Math.max(0, Math.floor((tokenRegenTime - new Date()) / 1000)))}
                  )
                </span>
              )}
              <button
                className="shop-nav-btn"
                onClick={() => setActiveTab('shop')}
                aria-label="Go to shop to purchase tokens"
              >
                +
              </button>
            </div>
          </div>
        )}
        {!token ? (
          <div className="auth">
            <img src="/logo.png" alt="MindSprout Logo" className="logo" />
            <h1>Welcome to MindSprout</h1>
            <p className="tagline">Planting Seeds of Mindfulness!</p>
            {message && <p className="message">{message}</p>}
 Reflect, Connect, Become            <div className="standard-auth">
              <h2>{isDesktop ? 'Sign Up or Log In' : showSignup ? 'Sign Up' : 'Log In'}</h2>
              {!isDesktop && (
                <div className="auth-toggle">
                  <button className="toggle-btn" on하시겠습니다click={() => setShowSignup(!showSignup)}>
                    {showSignup ? 'Switch to Log In' : 'Switch to Sign Up'}
                  </button>
                </div>
              )}
              <div className="form-container">
                {(isDesktop || showSignup) && (
                  <div className="signup-form">
                    <form onSubmit={handleRegularSignup}>
                      <input
                        placeholder="Name"
                        value={regularSignupForm.name}
                        onChange={(e) => setRegularSignupForm({ ...regularSignupForm, name: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Email"
                        type="email"
                        value={regularSignupForm.email}
                        onChange={(e) => setRegularSignupForm({ ...regularSignupForm, email: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Username"
                        value={regularSignupForm.username}
                        onChange={(e) => setRegularSignupForm({ ...regularSignupForm, username: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Password"
                        type="password"
                        value={regularSignupForm.password}
                        onChange={(e) => setRegularSignupForm({ ...regularSignupForm, password: e.target.value })}
                        required
                      />
                      <button type="submit" className="signup-btn">Sign Up</button>
                    </form>
                  </div>
                )}
                {(isDesktop || !showSignup) && (
                  <div className="login-form">
                    <form onSubmit={handleRegularLogin}>
                      <input
                        placeholder="Email"
                        value={regularLoginForm.email}
                        onChange={(e) => setRegularLoginForm({ ...regularLoginForm, email: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Password"
                        type="password"
                        value={regularLoginForm.password}
                        onChange={(e) => setRegularLoginForm({ ...regularLoginForm, password: e.target.value })}
                        required
                      />
                      <button type="submit">Log In</button>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="regular-dashboard">
            <img src="/logo.png" alt="MindSprout Logo" className="logo" />
            {message && <p className="message">{message}</p>}
            {activeTab === 'profile' ? (
              <div className="profile">
                <h2>Your Profile</h2>
                <div className="mood-trend">
                  <h3>Weekly Mood Trends</h3>
                  {reports.length > 0 ? (
                    <>
                      <Line data={weeklyMoodChartData} options={weeklyMoodChartData.options} />
                      <div className="mood-summary">
                        {weeklyMoodSummary.map((summary, index) => (
                          <p key={index}>{summary}</p>
                        ))}
                      </div>
                    </>
                  ) : (
                    <p>No mood data yet. Start a chat session to track your mood!</p>
                  )}
                </div>
            
                <div className="starlit-guidance">
  <h3>Starlit Guidance</h3>
  <div className="guidance-table-container">
    {starlitGuidance ? (
      <table className="guidance-table">
        <thead>
          <tr>
            <th>What Should I Embrace</th>
            <th>What Should I Let Go Of</th>
          </tr>
        </thead>
        <tbody>
          {starlitGuidance.embrace.slice(0, 3).map((embraceWord, index) => (
            <tr key={index}>
              <td>{embraceWord}</td>
              <td>{starlitGuidance.letGo[index] || 'N/A'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    ) : (
      <p>Loading guidance...</p>
    )}
  </div>
</div>
                <button onClick={handleLogout} className="logout-btn">
                  <img src="/icons/logout.png" alt="Logout" className="icon" />
                  Log Out
                </button>
                <button
                  onClick={() => setDeleteConfirm({ type: 'account' })}
                  className="delete-account-btn"
                  aria-label="Delete account"
                >
                  <img src="/icons/delete.png" alt="Delete Account" className="icon" />
                  Delete Account
                </button>
              </div>
            ) : activeTab === 'chat' ? (
              <>
                {isQuizActive ? (
                  <div className={`quiz-fullscreen ${isQuizActive ? 'active' : ''}`}>
                    <div className="quiz-content">
                      <h3 className="quiz-question">{emotionDescriptions[quizQuestions[currentQuizQuestion]].question}</h3>
                      <div className="quiz-options">
                        {[1, 2, 3, 4, 5].map((value) => (
                          <button
                            key={value}
                            className={`quiz-option-box ${selectedAnswer === value ? 'selected' : ''}`}
                            onClick={() => handleQuizAnswer(value)}
                            onKeyPress={(e) => handleQuizKeyPress(e, value)}
                            tabIndex={0}
                            role="radio"
                            aria-checked={selectedAnswer === value}
                            aria-label={`${emotionDescriptions[quizQuestions[currentQuizQuestion]].feedback(value)} (${value}/5)`}
                          >
                            <span className="quiz-value">{value}</span>
                            <span className="quiz-feedback">{emotionDescriptions[quizQuestions[currentQuizQuestion]].feedback(value)}</span>
                            <span className="quiz-emoji">{emotionDescriptions[quizQuestions[currentQuizQuestion]].emojis[value - 1]}</span>
                          </button>
                        ))}
                      </div>
                      <div className="quiz-nav">
                        {selectedAnswer !== null &&
                          (currentQuizQuestion < quizQuestions.length - 1 ? (
                            <button onClick={handleQuizNext}>Next</button>
                          ) : (
                            <button onClick={handleStartChat}>Start Chat</button>
                          ))}
                      </div>
                    </div>
                  </div>
                ) : showBreathe ? (
                  <div className={`breathe-overlay ${showBreathe ? 'active' : ''}`}>
                    <div className="breathe-animation">
                      <h2>Take this moment to breathe...</h2>
                      <p className={`breathe-count ${breatheCount === 4 ? 'fade-in' : 'fade-out'}`}>
                        {breatheCount}
                      </p>
                    </div>
                  </div>
                ) : isChatActive ? (
                  <div className="chat">
                    <h2>Chat with Pal</h2>
                    <p>Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                    <p>Extensions used: {extendCount}/3</p>
                    <div className="chat-box" ref={chatBoxRef}>
                      {chat.slice().reverse().map((msg, i) => (
                        <p key={i} className={msg.sender === 'pal' ? 'pal' : 'user'}>
                          {msg.text}
                        </p>
                      ))}
                    </div>
                    {timeLeft > 0 ? (
                      <div className="chat-input-container">
                        <input
                          placeholder="Talk to Pal... (max 500 characters)"
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value.slice(0, 500))}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && chatInput.trim()) {
                              handleChat(chatInput);
                            }
                          }}
                        />
                        <button
                          className="send-btn"
                          onClick={() => chatInput.trim() && handleChat(chatInput)}
                          disabled={!chatInput.trim()}
                        >
                          Send
                        </button>
                        <p className="char-counter">{chatInput.length}/500</p>
                      </div>
                    ) : (
                      <div>
                        <h2>Session Complete</h2>
                        <p>Check your Reflect tab for your summary!</p>
                        <button onClick={() => setActiveTab('reflect')}>View Reflect</button>
                      </div>
                    )}
                    {timeLeft > 0 && (
                      <>
                        <button onClick={handleEndChat}>End Chat</button>
                        {timeLeft < 30 && extendCount < 3 && (
                          <button onClick={handleExtendChat}>Extend Chat (+5 min)</button>
                        )}
                      </>
                    )}
                  </div>
                ) : (
                  <div className="quiz">
                    <h2>Chat</h2>
                    <p>
                  <h3 className="chat-subheading">Chat With Pal</h3>
    <p className="chat-description">
      Complete the quiz to have an in-depth chat with Pal. Make sure to check your summaries to gain profound insights into your chat session.
    </p>
                      You have {tranquilTokens} Tranquil Tokens.{' '}
                      {tranquilTokens < 1 && tokenRegenTime
                        ? `Next token in ${formatTime(
                            Math.max(0, Math.floor((tokenRegenTime - new Date()) / 1000))
                          )}`
                        : 'Tokens regenerate every 24 hours.'}
                    </p>
                    {tranquilTokens > 0 ? (
                      <button onClick={handleStartQuiz}>Start Quiz</button>
                    ) : (
                      <p>Purchase more tokens or wait for a new token!</p>
                    )}
                  </div>
                )}
              </>
            ) : activeTab === 'journal' ? (
              <div className="journal">
                <h2>Journal</h2>
                <div className="journal-options">
                  <button
                    className="journal-button"
                    onClick={() => handleOpenJournal('daily')}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handleOpenJournal('daily')}
                    aria-label="Open Daily Journal"
                  >
                    <img src="/personal.png" alt="Daily Journal" />
                    <span>Daily Journal</span>
                  </button>
                  <button
                    className="journal-button"
                    onClick={() => handleOpenJournal('dream')}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handleOpenJournal('dream')}
                    aria-label="Open Dream Journal"
                  >
                    <img src="/dream1.png" alt="Dream Journal" />
                    <span>Dream Journal</span>
                  </button>
                  <button
                    className="journal-button"
                    onClick={() => handleOpenJournal('freestyle')}
                    role="button"
                    tabIndex={0}
                    onKeyPress={(e) => e.key === 'Enter' && handleOpenJournal('freestyle')}
                    aria-label="Open Freestyle Journal"
                  >
                    <img src="/freestyle.png" alt="Freestyle Journal" />
                    <span>Freestyle Journal</span>
                  </button>
                </div>
                {openJournalType && (
                  <div className={`journal-modal ${openJournalType ? 'active' : ''}`}>
                    <div className="journal-content">
                      <button className="close-btn" onClick={handleCloseJournal}>
                        X
                      </button>
                      <h3>
                        {openJournalType === 'daily'
                          ? 'Daily Journal'
                          : openJournalType === 'dream'
                          ? 'Dream Journal'
                          : 'Freestyle Journal'}
                      </h3>
                      {journalPrompts[openJournalType].map((prompt) => (
                        <div key={prompt.key} className="journal-prompt">
                          <h2>{prompt.heading}</h2>
                          <p>{prompt.subheading}</p>
                          <textarea
                            placeholder="Write your response..."
                            value={journalResponses[prompt.key] || ''}
                            onChange={(e) => handleJournalInput(prompt.key, e.target.value)}
                          />
                        </div>
                      ))}
                      <div className="journal-actions">
                        <button onClick={handleSaveJournal}>Save Journal</button>
                      </div>
                    </div>
                  </div>
                )}
                <h3>Past Journal Entries</h3>
                {journal.length > 0 ? (
                  <div className="journal-tables">
                    <table className="gradient-table">
                      <thead>
                        <tr>
                          <th>Journal Type</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedJournal.map((entry, i) => (
                          <tr key={i}>
                            <td>
                              {entry.type === 'daily'
                                ? 'Daily Journal'
                                : entry.type === 'dream'
                                ? 'Dream Journal'
                                : 'Freestyle Journal'}
                            </td>
                            <td>{new Date(entry.date).toLocaleDateString()}</td>
                            <td>
                              <button onClick={() => handleOpenJournalEntry(entry)}>Open</button>
                              <button
                                className="delete-btn"
                                onClick={() => setDeleteConfirm({ type: 'journal', id: entry._id })}
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
                        Page {journalPage} of {journalPageCount}
                      </span>
                      <button
                        onClick={() => setJournalPage((prev) => Math.min(prev + 1, journalPageCount))}
                        disabled={journalPage === journalPageCount}
                      >
                        Next
                      </button>
                    </div>
                    {selectedJournalEntry && openNotepadSection === 'reflect' && (
                      <div className={`notepad-modal ${openNotepadSection ? 'active' : ''}`}>
                        <div className="notepad-content">
                          <button className="close-btn" onClick={handleCloseJournalEntry}>
                            X
                          </button>
                          <div className="notepad-text">
                            <h3>
                              Entry: {new Date(selectedJournalEntry.date).toLocaleDateString()} (
                              {selectedJournalEntry.type === 'daily'
                                ? 'Daily Journal'
                                : selectedJournalEntry.type === 'dream'
                                ? 'Dream Journal'
                                : 'Freestyle Journal'}
                              )
                            </h3>
                            {renderJournalResponses(selectedJournalEntry)}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p>No journal entries yet. Start writing to save one!</p>
                )}
              </div>
            ) : activeTab === 'reflect' ? (
              <div className="reflect">
                <h2>Reflect</h2>
                <h3>Past Chat Sessions</h3>
                {reports.length > 0 ? (
                  <>
                    <table className="gradient-table">
                      <thead>
                        <tr>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedReports.map((report, i) => (
                          <tr key={i}>
                            <td>{new Date(report.date).toLocaleDateString()}</td>
                            <td>
                              <button
                                onClick={() => handleViewReport(report)}
                                className={selectedReport?._id === report._id ? 'active' : ''}
                              >
                                View
                              </button>
                              <button
                                className="delete-btn"
                                onClick={() => setDeleteConfirm({ type: 'report', id: report._id })}
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
                        onClick={() => setReflectPage((prev) => Math.max(prev - 1, 1))}
                        disabled={reflectPage === 1}
                      >
                        Previous
                      </button>
                      <span>
                        Page {reflectPage} of {reflectPageCount}
                      </span>
                      <button
                        onClick={() => setReflectPage((prev) => Math.min(prev + 1, reflectPageCount))}
                        disabled={reflectPage === reflectPageCount}
                      >
                        Next
                      </button>
                    </div>
                    {selectedReport && (
                      <div className="report-details" ref={reportDetailsRef}>
                        <h3>Session: {new Date(selectedReport.date).toLocaleDateString()}</h3>
                        <div className="bar-chart-container">
                          {barChartData && <Bar data={barChartData} options={barChartData.options} />}
                        </div>
                        <p className="feedback">Select to read your insights</p>
                        <div className="summary-container">
                          {['discussed', 'thoughtsFeelings', 'insights', 'moodReflection', 'recommendations'].map(
                            (section) => (
                              <div
                                key={section}
                                className="summary-card"
                                onClick={() => handleOpenNotepad(section)}
                              >
                                <div className="summary-front">
                                  <h4>
                                    {section === 'discussed'
                                      ? 'What We Discussed'
                                      : section === 'thoughtsFeelings'
                                      ? 'Your Thoughts & Feelings'
                                      : section === 'insights'
                                      ? 'Insights Uncovered'
                                      : section === 'moodReflection'
                                      ? 'Mood Reflection'
                                      : 'Recommendations'}
                                  </h4>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                        {openNotepadSection && (
                          <div className={`notepad-modal ${openNotepadSection ? 'active' : ''}`}>
                            <div className="notepad-content">
                              <button className="close-btn" onClick={handleCloseNotepad}>
                                X
                              </button>
                              <div className="notepad-text">
                                <h3>
                                  {openNotepadSection === 'discussed'
                                    ? 'What We Discussed'
                                    : openNotepadSection === 'thoughtsFeelings'
                                    ? 'Your Thoughts & Feelings'
                                    : openNotepadSection === 'insights'
                                    ? 'Insights Uncovered'
                                    : openNotepadSection === 'moodReflection'
                                    ? 'Mood Reflection'
                                    : 'Recommendations'}
                                </h3>
                                {openNotepadSection === 'reflect' && selectedJournalEntry
                                  ? renderJournalResponses(selectedJournalEntry)
                                  : selectedReport.summary?.[openNotepadSection] || 'Not available'}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <p>No chat sessions yet. Start chatting to save insights!</p>
                )}
              </div>
            ) : activeTab === 'shop' ? (
              <div className="shop">
                <h2>Shop</h2>
                <p>Purchase Tranquil Tokens to access features like chatting and generating insights.</p>
                <div className="token-packages">
                  <div className="token-card">
                    <h3>1 Token</h3>
                    <p>£0.99</p>
                    <button onClick={() => handlePurchaseTokens(1, 'tranquil_tokens_1')}>Buy Now</button>
                  </div>
                  <div className="token-card highlighted">
  <h3>5 Tokens</h3>
  <p className="original-price">£3.99</p>
  <p className="sale-price">£1.99</p>
  <p className="best-value">Sale - BEST VALUE</p>
  <button onClick={() => handlePurchaseTokens(5, 'tranquil_tokens_5')} disabled={isLoading}>
    Buy Now
  </button>
</div>
                  <div className="token-card">
                    <h3>10 Tokens</h3>
                    <p>£6.99</p>
                    <button onClick={() => handlePurchaseTokens(10, 'tranquil_tokens_10')}>Buy Now</button>
                  </div>
                  <div className="token-card">
                    <h3>50 Tokens</h3>
                    <p>£24.99</p>
                    <button onClick={() => handlePurchaseTokens(50, 'tranquil_tokens_50')}>Buy Now</button>
                  </div>
                  <div className="token-card">
                    <h3>100 Tokens</h3>
                    <p>£42.99</p>
                    <button onClick={() => handlePurchaseTokens(100, 'tranquil_tokens_100')}>Buy Now</button>
                  </div>
                </div>
              </div>
            ) : null}
            <div className="menu-bar">
              <button
                onClick={() => setActiveTab('profile')}
                className={activeTab === 'profile' ? 'active' : ''}
                aria-label="View Profile"
                aria-pressed={activeTab === 'profile'}
              >
                <img src="/icons/user.png" alt="Profile" className="icon" />
                <span>Profile</span>
              </button>
              <button
                onClick={() => setActiveTab('chat')}
                className={activeTab === 'chat' ? 'active' : ''}
                aria-label="Start Chat"
                aria-pressed={activeTab === 'chat'}
              >
                <img src="/icons/chat.png" alt="Chat" className="icon" />
                <span>Chat</span>
              </button>
              <button
                onClick={() => setActiveTab('journal')}
                className={activeTab === 'journal' ? 'active' : ''}
                aria-label="View Journal"
                aria-pressed={activeTab === 'journal'}
              >
                <img src="/icons/journal.png" alt="Journal" className="icon" />
                <span>Journal</span>
              </button>
              <button
                onClick={() => setActiveTab('reflect')}
                className={activeTab === 'reflect' ? 'active' : ''}
                aria-label="View Reflect"
                aria-pressed={activeTab === 'reflect'}
              >
                <img src="/icons/meditation.png" alt="Reflect" className="icon" />
                <span>Reflect</span>
              </button>
              <button
                onClick={() => setActiveTab('shop')}
                className={activeTab === 'shop' ? 'active' : ''}
                aria-label="View Shop"
                aria-pressed={activeTab === 'shop'}
              >
                <img src="/icons/shop.png" alt="Shop" className="icon" />
                <span>Shop</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
