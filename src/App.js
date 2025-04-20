import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import axios from 'axios';
import './App.css';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, BarElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js';

ChartJS.register(BarElement, CategoryScale, LinearScale, Tooltip, Legend);

function App() {
  const API_URL = process.env.REACT_APP_API_URL || 'https://mindsprout-backend-new.onrender.com';

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
  const [timeLeft, setTimeLeft] = useState(10 * 60);
  const [lastChatTimestamp, setLastChatTimestamp] = useState(null);
  const [chatTokens, setChatTokens] = useState(3);
  const [goals, setGoals] = useState([]);
  const [reports, setReports] = useState([]);
  const [journal, setJournal] = useState([]);
  const [journalInsights, setJournalInsights] = useState([]);
  const [activeTab, setActiveTab] = useState('chat');
  const [selectedReport, setSelectedReport] = useState(null);
  const [selectedJournalEntry, setSelectedJournalEntry] = useState(null);
  const [showBreathe, setShowBreathe] = useState(false);
  const [breatheCount, setBreatheCount] = useState(3);
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
  const [currentAffirmation, setCurrentAffirmation] = useState('');
  const [affirmationPosition, setAffirmationPosition] = useState({ top: '50%', left: '50%' });

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
    "You have the power to change your story.",
    "You are resilient and strong.",
    "Your dreams are valid.",
    "You bring light to those around you.",
    "You are in control of your happiness.",
    "You are brave for trying.",
    "Your heart is full of courage.",
    "You are a gift to the world.",
    "You are making a difference.",
    "You are surrounded by love.",
    "You are stronger than you know.",
    "Your journey is beautiful.",
    "You are allowed to take up space.",
    "You are learning and growing.",
    "You are a masterpiece in progress.",
    "You have the courage to face anything.",
    "You are deserving of all good things.",
    "Your kindness changes lives.",
    "You are unstoppable.",
    "You are creating a beautiful life.",
    "You are full of potential.",
    "You are a beacon of hope.",
    "You are worthy of success.",
    "You are loved beyond measure.",
    "You have the strength to overcome.",
    "You are a unique and wonderful soul.",
    "You are capable of great things.",
    "Your presence is powerful.",
    "You are on the right path.",
    "You are a force for good.",
    "You are blooming beautifully.",
    "You have everything you need within you.",
    "You are a spark of divine light.",
    "You are worthy of your dreams.",
    "You are enough, always.",
    "You are a warrior of love.",
    "You are creating your own magic.",
    "You are a blessing to others.",
    "You are growing into your best self.",
    "You are surrounded by abundance.",
    "You are a source of inspiration.",
    "You are free to be yourself.",
    "You are a beautiful soul.",
    "You are capable of anything.",
    "You are a light in the darkness.",
    "You are worthy of every opportunity.",
    "You are stronger every day.",
    "You are a masterpiece.",
    "You are loved for who you are.",
    "You are building a bright future.",
    "You are a gift to those around you.",
    "You are full of courage and grace.",
    "You are exactly where you need to be.",
    "You are a radiant being.",
    "You are making the world better.",
    "You are worthy of all your desires.",
    "You are a powerful creator.",
    "You are filled with infinite potential.",
    "You are a beautiful work in progress.",
    "You are deserving of joy.",
    "You are a shining star.",
    "You are stronger than any challenge.",
    "You are a unique treasure.",
    "You are creating a life you love.",
    "You are surrounded by positivity.",
    "You are a source of joy.",
    "You are worthy of greatness.",
    "You are a beautiful spirit.",
    "You are capable of miracles.",
    "You are a light for others.",
    "You are growing stronger every day.",
    "You are a blessing to the world.",
    "You are full of love and kindness.",
    "You are on a path to greatness.",
    "You are a radiant soul.",
    "You are worthy of every dream.",
    "You are a powerful force.",
    "You are creating a legacy of love.",
    "You are a beautiful being.",
    "You are deserving of peace.",
    "You are a spark of brilliance.",
    "You are stronger than you realize.",
    "You are a unique gift.",
    "You are building a life of purpose.",
    "You are surrounded by love and light.",
    "You are a source of strength.",
    "You are worthy of every happiness."
  ];

  const showRandomAffirmation = useCallback(() => {
    const randomIndex = Math.floor(Math.random() * affirmations.length);
    const randomTop = `${Math.random() * 80 + 10}%`;
    const randomLeft = `${Math.random() * 80 + 10}%`;
    setCurrentAffirmation(affirmations[randomIndex]);
    setAffirmationPosition({ top: randomTop, left: randomLeft });
  }, [affirmations]);

  useEffect(() => {
    if (isLoading && !showSummaryBuffer) {
      showRandomAffirmation();
      const interval = setInterval(showRandomAffirmation, 4000);
      return () => clearInterval(interval);
    }
  }, [isLoading, showSummaryBuffer, showRandomAffirmation]);

  useEffect(() => {
    const handleResize = () => setIsDesktop(window.innerWidth > 768);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const emotionDescriptions = {
    happiness: {
      question: "How happy are you right now?",
      feedback: value => ["Really Unhappy", "Somewhat Unhappy", "Mildly Happy", "Quite Happy", "Very Happy"][value - 1],
      emojis: ['😢', '😣', '😊', '😊', '🥰']
    },
    anger: {
      question: "How angry are you right now?",
      feedback: value => ["Really Calm", "Somewhat Calm", "Mildly Angry", "Quite Angry", "Extremely Angry"][value - 1],
      emojis: ['😊', '😐', '😣', '😤', '😡']
    },
    stress: {
      question: "How stressed are you right now?",
      feedback: value => ["Really Relaxed", "Somewhat Relaxed", "Mildly Stressed", "Quite Stressed", "Extremely Stressed"][value - 1],
      emojis: ['😊', '😐', '😣', '😓', '😰']
    },
    energy: {
      question: "How energized are you right now?",
      feedback: value => ["Really Drained", "Somewhat Tired", "Mildly Energized", "Quite Energized", "Very Energized"][value - 1],
      emojis: ['😴', '😪', '😐', '😊', '⚡']
    },
    confidence: {
      question: "How confident are you right now?",
      feedback: value => ["Really Unsure", "Somewhat Doubtful", "Mildly Confident", "Quite Confident", "Extremely Confident"][value - 1],
      emojis: ['😟', '😣', '😐', '😊', '💪']
    }
  };

  const quizQuestions = Object.keys(emotionDescriptions);

  const journalPrompts = {
    daily: [
      { heading: "Highlights of My Day", subheading: "Reflect on the moments that brought you joy or satisfaction.", key: "highlights" },
      { heading: "What I Learned About Myself", subheading: "Consider any new insights or realizations you had.", key: "learned" },
      { heading: "Challenges I Faced", subheading: "Analyze your reactions and what you can learn from them.", key: "challenges" },
      { heading: "Emotions I Experienced", subheading: "Explore the feelings you had and their sources.", key: "emotions" }
    ],
    dream: [
      { heading: "My Dream Last Night", subheading: "Capture the key components of your dream, including characters and settings.", key: "dreamDescription" },
      { heading: "Emotions in the Dream", subheading: "Reflect on how the dream made you feel and what that might signify.", key: "dreamEmotions" },
      { heading: "Recurring Themes or Symbols", subheading: "Identify any patterns that might connect to your waking life.", key: "themes" },
      { heading: "Which part of the dream stands out the most?", subheading: "Focus on the most vivid or impactful moment and why it resonates.", key: "standout" }
    ],
    freestyle: [
      { heading: "My Thoughts", subheading: "Write whatever is on your mind, no structure needed.", key: "thoughts" }
    ]
  };

  const fetchUserData = async (authToken) => {
    setIsLoading(true);
    try {
      const [goalsRes, reportsRes, lastChatRes, journalRes, insightsRes] = await Promise.all([
        axios.get(`${API_URL}/api/regular/goals`, { headers: { Authorization: authToken } }),
        axios.get(`${API_URL}/api/regular/reports`, { headers: { Authorization: authToken } }),
        axios.get(`${API_URL}/api/regular/last-chat`, { headers: { Authorization: authToken } }),
        axios.get(`${API_URL}/api/regular/journal`, { headers: { Authorization: authToken } }),
        axios.get(`${API_URL}/api/regular/journal-insights`, { headers: { Authorization: authToken } })
      ]);
      setGoals(goalsRes.data || []);
      setReports(reportsRes.data || []);
      setLastChatTimestamp(lastChatRes.data.lastChatTimestamp ? new Date(lastChatRes.data.lastChatTimestamp) : null);
      setChatTokens(lastChatRes.data.chatTokens || 3);
      setJournal(journalRes.data || []);
      setJournalInsights(insightsRes.data || []);
    } catch (err) {
      console.error('Error fetching user data:', err);
      setMessage('Error loading your data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (token && role === 'regular') {
      fetchUserData(token);
    }
  }, [token, role]);

  useEffect(() => {
    if (isChatActive && timeLeft > 0) {
      const timer = setInterval(() => setTimeLeft(prev => {
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
      setBreatheCount(3);
      const countdown = setInterval(() => {
        setBreatheCount(prev => {
          if (prev <= 1) {
            clearInterval(countdown);
            setShowBreathe(false);
            setIsChatActive(true);
            setChat([{ sender: 'pal', text: 'Hello, welcome to this safe space, what is on your mind today?', timestamp: new Date() }]);
            setTimeLeft(10 * 60);
            setMessage('Let’s chat.');
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
      return () => clearInterval(countdown);
    }
  }, [showBreathe]);

  useEffect(() => {
    if (chatBoxRef.current) {
      chatBoxRef.current.scrollTop = chatBoxRef.current.scrollHeight;
    }
  }, [chat]);

  const getBarChartData = useMemo(() => {
    return (quizData) => {
      const pre = quizData.find(q => !q.isPostChat) || { happiness: 0, anger: 0, stress: 0, energy: 0, confidence: 0 };
      return {
        labels: ['Happiness', 'Anger', 'Stress', 'Energy', 'Confidence'],
        datasets: [{ label: 'Before Chat', data: [pre.happiness, pre.anger, pre.stress, pre.energy, pre.confidence], backgroundColor: '#36A2EB' }],
        options: { scales: { y: { beginAtZero: true, max: 5 } } }
      };
    };
  }, []);

  const barChartData = useMemo(() => selectedReport ? getBarChartData(selectedReport.quizData) : null, [selectedReport, getBarChartData]);

  const handleRegularSignup = (e) => {
    e.preventDefault();
    setIsLoading(true);
    axios.post(`${API_URL}/api/regular/signup`, regularSignupForm)
      .then(res => {
        setMessage(res.data.message);
        setToken(res.data.token);
        setRole('regular');
        fetchUserData(res.data.token);
      })
      .catch(err => setMessage(err.response?.data?.error || 'Signup failed'))
      .finally(() => setIsLoading(false));
  };

  const handleRegularLogin = (e) => {
    e.preventDefault();
    setIsLoading(true);
    const loginData = { ...regularLoginForm, email: regularLoginForm.email.toLowerCase() };
    axios.post(`${API_URL}/api/regular/login`, loginData)
      .then(res => {
        setToken(res.data.token);
        setRole('regular');
        setMessage(`Welcome, ${res.data.name || 'User'}!`);
        fetchUserData(res.data.token);
      })
      .catch(err => setMessage(err.response?.data?.error || 'Login failed'))
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

  const debounce = (func, wait) => {
    let timeout;
    return (...args) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const handleChat = useCallback(debounce(async (text) => {
    if (timeLeft <= 0 || text.length > 500) return;
    const newUserMessage = { sender: 'user', text, timestamp: new Date() };
    setChat(prev => [...prev, newUserMessage]);
    setChatInput('');
    try {
      const lowerText = text.toLowerCase();
      if (lowerText.includes('kill myself') || lowerText.includes('killing myself') || lowerText.includes('suicide') || lowerText.includes('end my life')) {
        const helpline = "If you're in the UK, please call Samaritans at 116 123. In the US, call 988. You're not alone, and help is available.";
        setChat(prev => [...prev, { sender: 'pal', text: helpline, timestamp: new Date() }]);
        return;
      }
      const response = await axios.post(`${API_URL}/api/regular/chat`, { message: text, chatHistory: chat }, { headers: { Authorization: token } });
      setChat(prev => [...prev, { sender: 'pal', text: response.data.text, timestamp: new Date(response.data.timestamp) }]);
    } catch (error) {
      console.error('Error chatting:', error);
      setMessage('Error chatting: ' + (error.response?.data?.error || error.message));
    }
  }, 300), [chat, timeLeft, token]);

  const handleEndChat = async () => {
    setTimeLeft(0);
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/regular/end-chat`, { chatHistory: chat, quiz }, { headers: { Authorization: token } });
      const newReport = response.data;
      setReports(prev => [...prev, newReport]);
      setLastChatTimestamp(new Date());
      setChatTokens(prev => Math.max(prev - 1, 0));
      setChat([]);
      setIsChatActive(false);
      setShowSummaryBuffer(true);
      setTimeout(() => {
        setShowSummaryBuffer(false);
        setActiveTab('reflect');
        setSelectedReport(newReport);
        setMessage('Session complete! Check your Reflect tab for the summary.');
        fetchUserData(token);
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
    setJournalResponses(prev => ({ ...prev, [key]: value }));
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
      responses: { ...journalResponses }
    };
    try {
      const response = await axios.post(`${API_URL}/api/regular/insights`, journalData, {
        headers: { Authorization: token }
      });
      const newJournalEntry = { _id: response.data._id, date: new Date(journalData.date), type: journalData.type, responses: journalData.responses };
      setJournal(prev => [...prev, newJournalEntry]);
      setOpenJournalType(null);
      setJournalResponses({});
      setActiveTab('journal');
      setSelectedJournalEntry(newJournalEntry);
      setMessage('Journal saved! Check your journal tab.');
      await fetchUserData(token);
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
        headers: { Authorization: token }
      });
      setJournal(prev => prev.filter(entry => entry._id !== entryId));
      setJournalInsights(prev => prev.filter(insight => {
        const journalDate = journal.find(entry => entry._id === entryId)?.date;
        return journalDate ? new Date(insight.journalDate).getTime() !== new Date(journalDate).getTime() : true;
      }));
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
        headers: { Authorization: token }
      });
      setReports(prev => prev.filter(report => report._id !== reportId));
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

  const handleGenerateInsight = async (entry) => {
    setIsLoading(true);
    try {
      const response = await axios.post(`${API_URL}/api/regular/journal-insights`, {
        journalDate: entry.date,
        responses: entry.responses
      }, { headers: { Authorization: token } });
      const newInsight = {
        journalDate: new Date(entry.date),
        insight: response.data.insight,
        createdAt: new Date()
      };
      setJournalInsights(prev => [...prev, newInsight]);
      setMessage('Insight generated! View it in the notepad.');
    } catch (err) {
      console.error('Error generating insight:', err);
      setMessage('Error generating insight: ' + (err.response?.data?.error || err.message));
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    setToken(null);
    localStorage.removeItem('token');
    setRole(null);
    setIsQuizActive(false);
    setIsChatActive(false);
    setQuiz({ happiness: 0, anger: 0, stress: 0, energy: 0, confidence: 0, isPostChat: false });
    setChat([]);
    setTimeLeft(10 * 60);
    setLastChatTimestamp(null);
    setChatTokens(3);
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
    setCurrentAffirmation('');
    setAffirmationPosition({ top: '50%', left: '50%' });
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

  const renderJournalResponses = (entry) => {
    const responses = entry.responses;
    const insight = journalInsights.find(i => new Date(i.journalDate).getTime() === new Date(entry.date).getTime());
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

  return (
    <div className="app">
      {(isLoading || showSummaryBuffer) && (
        <div className="loading-overlay">
          <div className="spinner"></div>
          {showSummaryBuffer ? (
            <p>Preparing your summary...</p>
          ) : (
            <p
              className="affirmation"
              style={{
                position: 'absolute',
                top: affirmationPosition.top,
                left: affirmationPosition.left,
                transform: 'translate(-50%, -50%)'
              }}
            >
              {currentAffirmation}
            </p>
          )}
        </div>
      )}
      {deleteConfirm && (
        <div className={`delete-confirm-modal ${deleteConfirm ? 'active' : ''}`}>
          <div className="delete-confirm-content">
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
          </div>
        </div>
      )}
      <div className="canvas">
        {!token ? (
          <div className="auth">
            <img src="/logo.png" alt="MindSprout Logo" className="logo" />
            <h1>Welcome to MindSprout</h1>
            <p className="tagline">Planting Seeds of Mindfulness!</p>
            {message && <p className="message">{message}</p>}
            <div className="standard-auth">
              <h2>{isDesktop ? 'Sign Up or Log In' : showSignup ? 'Sign Up' : 'Log In'}</h2>
              {!isDesktop && (
                <div className="auth-toggle">
                  <button
                    className="toggle-btn"
                    onClick={() => setShowSignup(!showSignup)}
                  >
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
                        onChange={e => setRegularSignupForm({ ...regularSignupForm, name: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Email"
                        type="email"
                        value={regularSignupForm.email}
                        onChange={e => setRegularSignupForm({ ...regularSignupForm, email: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Username"
                        value={regularSignupForm.username}
                        onChange={e => setRegularSignupForm({ ...regularSignupForm, username: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Password"
                        type="password"
                        value={regularSignupForm.password}
                        onChange={e => setRegularSignupForm({ ...regularSignupForm, password: e.target.value })}
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
                        onChange={e => setRegularLoginForm({ ...regularLoginForm, email: e.target.value })}
                        required
                      />
                      <input
                        placeholder="Password"
                        type="password"
                        value={regularLoginForm.password}
                        onChange={e => setRegularLoginForm({ ...regularLoginForm, password: e.target.value })}
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
                <button onClick={handleLogout} className="logout-btn">
                  <img src="/icons/logout.png" alt="Logout" className="icon" />
                  Log Out
                </button>
              </div>
            ) : activeTab === 'chat' ? (
              <>
                {isQuizActive ? (
                  <div className={`quiz-fullscreen ${isQuizActive ? 'active' : ''}`}>
                    <h3 className="quiz-question">{emotionDescriptions[quizQuestions[currentQuizQuestion]].question}</h3>
                    <div className="quiz-options">
                      {[1, 2, 3, 4, 5].map(value => (
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
                      {selectedAnswer !== null && (
                        currentQuizQuestion < quizQuestions.length - 1 ? (
                          <button onClick={handleQuizNext}>Next</button>
                        ) : (
                          <button onClick={handleStartChat}>Start Chat</button>
                        )
                      )}
                    </div>
                  </div>
                ) : showBreathe ? (
                  <div className={`breathe-overlay ${showBreathe ? 'active' : ''}`}>
                    <div className="breathe-animation">
                      <h2>Take this moment to breathe...</h2>
                      <p className="breathe-count">{breatheCount}</p>
                    </div>
                  </div>
                ) : isChatActive ? (
                  <div className="chat">
                    <h2>Chat with Pal</h2>
                    <p>Time left: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
                    <p>Tokens remaining: {chatTokens}</p>
                    <div className="chat-box" ref={chatBoxRef}>
                      {chat.slice().reverse().map((msg, i) => (
                        <p key={i} className={msg.sender === 'pal' ? 'pal' : 'user'}>{msg.text}</p>
                      ))}
                    </div>
                    {timeLeft > 0 ? (
                      <div className="chat-input-container">
                        <input
                          placeholder="Talk to Pal... (max 500 characters)"
                          value={chatInput}
                          onChange={e => setChatInput(e.target.value.slice(0, 500))}
                          onKeyPress={e => {
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
                    {timeLeft > 0 && <button onClick={handleEndChat}>End Chat</button>}
                  </div>
                ) : (
                  <div className="quiz">
                    <h2>Chat</h2>
                    <p>You have {chatTokens} chat tokens left today. Tokens regenerate every 3 hours.</p>
                    {chatTokens > 0 ? (
                      <button onClick={handleStartQuiz}>Start Quiz</button>
                    ) : (
                      <p>Come back later for a new token!</p>
                    )}
                  </div>
                )}
              </>
            ) : activeTab === 'journal' ? (
              <div className="journal">
                <h2>Journal</h2>
                <div className="journal-options">
                  <button
                    className="journal-button image-button"
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
                    className="journal-button image-button"
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
                    className="journal-button image-button"
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
                      <button className="close-btn" onClick={handleCloseJournal}>X</button>
                      <h3>{openJournalType === 'daily' ? 'Daily Journal' : openJournalType === 'dream' ? 'Dream Journal' : 'Freestyle Journal'}</h3>
                      {journalPrompts[openJournalType].map(prompt => (
                        <div key={prompt.key} className="journal-prompt">
                          <h2>{prompt.heading}</h2>
                          <p>{prompt.subheading}</p>
                          <textarea
                            placeholder="Write your response..."
                            value={journalResponses[prompt.key] || ''}
                            onChange={e => handleJournalInput(prompt.key, e.target.value)}
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
                            <td>{entry.type === 'daily' ? 'Daily Journal' : entry.type === 'dream' ? 'Dream Journal' : 'Freestyle Journal'}</td>
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
                        onClick={() => setJournalPage(prev => Math.max(prev - 1, 1))}
                        disabled={journalPage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {journalPage} of {journalPageCount}</span>
                      <button
                        onClick={() => setJournalPage(prev => Math.min(prev + 1, journalPageCount))}
                        disabled={journalPage === journalPageCount}
                      >
                        Next
                      </button>
                    </div>
                    {selectedJournalEntry && openNotepadSection === 'reflect' && (
                      <div className={`notepad-modal ${openNotepadSection ? 'active' : ''}`}>
                        <div className="notepad-content">
                          <button className="close-btn" onClick={handleCloseJournalEntry}>X</button>
                          <div className="notepad-text">
                            <h3>Entry: {new Date(selectedJournalEntry.date).toLocaleDateString()} ({selectedJournalEntry.type === 'daily' ? 'Daily Journal' : selectedJournalEntry.type === 'dream' ? 'Dream Journal' : 'Freestyle Journal'})</h3>
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
                        onClick={() => setReflectPage(prev => Math.max(prev - 1, 1))}
                        disabled={reflectPage === 1}
                      >
                        Previous
                      </button>
                      <span>Page {reflectPage} of {reflectPageCount}</span>
                      <button
                        onClick={() => setReflectPage(prev => Math.min(prev + 1, reflectPageCount))}
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
                          {['discussed', 'thoughtsFeelings', 'insights', 'moodReflection', 'recommendations'].map(section => (
                            <div
                              key={section}
                              className="summary-card"
                              onClick={() => handleOpenNotepad(section)}
                            >
                              <div className="summary-front">
                                <h4>{section === 'discussed' ? 'What We Discussed' : 
                                     section === 'thoughtsFeelings' ? 'Your Thoughts & Feelings' : 
                                     section === 'insights' ? 'Insights Uncovered' : 
                                     section === 'moodReflection' ? 'Mood Reflection' : 'Recommendations'}</h4>
                              </div>
                            </div>
                          ))}
                        </div>
                        {openNotepadSection && (
                          <div className={`notepad-modal ${openNotepadSection ? 'active' : ''}`}>
                            <div className="notepad-content">
                              <button className="close-btn" onClick={handleCloseNotepad}>X</button>
                              <div className="notepad-text">
                                <h3>
                                  {openNotepadSection === 'discussed' ? 'What We Discussed' : 
                                   openNotepadSection === 'thoughtsFeelings' ? 'Your Thoughts & Feelings' : 
                                   openNotepadSection === 'insights' ? 'Insights Uncovered' : 
                                   openNotepadSection === 'moodReflection' ? 'Mood Reflection' : 'Recommendations'}
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
                  <p>No sessions yet. Start a chat to save one!</p>
                )}
              </div>
            ) : null}
            <div className="menu-bar">
              <button
                className={activeTab === 'profile' ? 'active' : ''}
                onClick={() => setActiveTab('profile')}
              >
                <img src="/icons/profile.png" alt="Profile" className="icon" />
                <span>Profile</span>
              </button>
              <button
                className={activeTab === 'chat' ? 'active' : ''}
                onClick={() => setActiveTab('chat')}
              >
                <img src="/icons/chat.png" alt="Chat" className="icon" />
                <span>Chat</span>
              </button>
              <button
                className={activeTab === 'journal' ? 'active' : ''}
                onClick={() => setActiveTab('journal')}
              >
                <img src="/icons/journal.png" alt="Journal" className="icon" />
                <span>Journal</span>
              </button>
              <button
                className={activeTab === 'reflect' ? 'active' : ''}
                onClick={() => setActiveTab('reflect')}
              >
                <img src="/icons/reflect.png" alt="Reflect" className="icon" />
                <span>Reflect</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
