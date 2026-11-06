/**
 * Storage Service & Gamification Engine
 * Provides persistence, streak calculation, XP leveling, and unlockable achievement badges.
 */

const STORAGE_KEYS = {
  CONFIG: 'studybuddy_config',
  ATTEMPTS: 'studybuddy_attempts',
  SAVED_QUIZZES: 'studybuddy_quizzes'
};

const DEFAULT_CONFIG = {
  openaiApiKey: '',
  openaiModel: 'gpt-4o',
  firebaseConfig: {
    apiKey: '',
    authDomain: '',
    projectId: '',
    storageBucket: '',
    messagingSenderId: '',
    appId: ''
  },
  forceOfflineMode: false,
  instantFeedback: true,
  timerEnabled: true
};

export const storageService = {
  // CONFIG MANAGEMENT
  getConfig() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) {
        return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
      }
    } catch (err) {
      console.warn('Failed reading config from localStorage:', err);
    }
    return DEFAULT_CONFIG;
  },

  saveConfig(newConfig) {
    try {
      const current = this.getConfig();
      const merged = { ...current, ...newConfig };
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(merged));
      return merged;
    } catch (err) {
      console.error('Failed saving config to localStorage:', err);
      return newConfig;
    }
  },

  // ATTEMPTS MANAGEMENT
  getAttempts() {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ATTEMPTS);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          return parsed;
        }
      }
    } catch (err) {
      console.warn('Failed reading attempts from localStorage:', err);
    }
    return [];
  },

  saveAttempt(attempt) {
    try {
      const attempts = this.getAttempts();
      const normalizedAttempt = {
        id: attempt.id || `att-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
        userId: attempt.userId || 'guest-user',
        quizId: attempt.quizId || `quiz-${Date.now()}`,
        topic: attempt.topic || 'General Studies',
        difficulty: attempt.difficulty || 'Intermediate',
        score: Number(attempt.score) || 0,
        totalQuestions: Number(attempt.totalQuestions) || 1,
        percentage: Number(attempt.percentage) || Math.round(((Number(attempt.score) || 0) / (Number(attempt.totalQuestions) || 1)) * 100),
        durationSeconds: Number(attempt.durationSeconds) || 0,
        timestamp: attempt.timestamp || new Date().toISOString(),
        userAnswers: attempt.userAnswers || [],
        questionsPayload: attempt.questionsPayload || []
      };

      const updated = [normalizedAttempt, ...attempts];
      localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(updated));
      return normalizedAttempt;
    } catch (err) {
      console.error('Failed saving attempt to localStorage:', err);
      return attempt;
    }
  },

  clearAttempts() {
    try {
      localStorage.removeItem(STORAGE_KEYS.ATTEMPTS);
      return true;
    } catch (err) {
      console.error('Failed clearing attempts:', err);
      return false;
    }
  },

  // SEED SAMPLE GAMIFIED DATA FOR INSTANT TESTING
  seedSampleAttempts() {
    const now = Date.now();
    const day = 86400000;

    const sampleAttempts = [
      {
        id: `demo-${now}-1`,
        userId: 'guest-user',
        quizId: 'quiz-dsa-trees',
        topic: 'Data Structures & Algorithms',
        difficulty: 'Intermediate',
        score: 5,
        totalQuestions: 5,
        percentage: 100,
        durationSeconds: 84,
        timestamp: new Date(now - day * 2).toISOString(),
        userAnswers: [
          {
            questionId: 'q1',
            questionText: 'What is the balance factor invariant in an AVL tree?',
            selectedOptionIndex: 0,
            correctOptionIndex: 0,
            isCorrect: true,
            explanation: 'The height difference between left and right subtrees must not exceed 1.',
            options: ['|Height(L) - Height(R)| <= 1', 'Height(L) == Height(R)', 'Depth <= log2(N)', 'Black-height is invariant']
          },
          {
            questionId: 'q2',
            questionText: 'Which rotation is required for a Left-Right (LR) imbalance?',
            selectedOptionIndex: 1,
            correctOptionIndex: 1,
            isCorrect: true,
            explanation: 'An LR imbalance requires a Left rotation on the child followed by a Right rotation on the parent.',
            options: ['Single Right', 'Left-Right Double Rotation', 'Single Left', 'Double Right']
          },
          {
            questionId: 'q3',
            questionText: 'What is the black-height property of Red-Black trees?',
            selectedOptionIndex: 2,
            correctOptionIndex: 2,
            isCorrect: true,
            explanation: 'Every simple path from a node to descendant leaves must contain the exact same number of black nodes.',
            options: ['Leaves are red', 'Root can be red', 'All root-to-leaf paths have identical black node counts', 'Nodes cannot have two children']
          },
          {
            questionId: 'q4',
            questionText: 'What problem does quadratic probing solve compared to linear probing?',
            selectedOptionIndex: 0,
            correctOptionIndex: 0,
            isCorrect: true,
            explanation: 'Quadratic probing eliminates primary clustering by using quadratic offsets.',
            options: ['Primary clustering', 'Hash table resizing', 'Memory fragmentation', 'Cache thrashing']
          },
          {
            questionId: 'q5',
            questionText: 'At what load factor does open addressing typically require resizing?',
            selectedOptionIndex: 3,
            correctOptionIndex: 3,
            isCorrect: true,
            explanation: 'Open addressing degrades significantly when alpha exceeds 0.7 to 0.8.',
            options: ['0.2 to 0.3', '0.5', '1.0', '0.7 to 0.8']
          }
        ]
      },
      {
        id: `demo-${now}-2`,
        userId: 'guest-user',
        quizId: 'quiz-os-paging',
        topic: 'Operating Systems: Virtual Memory',
        difficulty: 'Advanced',
        score: 4,
        totalQuestions: 5,
        percentage: 80,
        durationSeconds: 112,
        timestamp: new Date(now - day).toISOString(),
        userAnswers: [
          {
            questionId: 'q1',
            questionText: 'What is the primary role of the Translation Lookaside Buffer (TLB)?',
            selectedOptionIndex: 0,
            correctOptionIndex: 0,
            isCorrect: true,
            explanation: 'TLB is a fast associative cache that caches VPN to PFN translations.',
            options: ['Cache VPN to PFN translations', 'Store evicted page contents', 'Schedule user threads', 'Manage disk swap files']
          },
          {
            questionId: 'q2',
            questionText: 'In a 32-bit architecture with 4KB pages, how many bits represent the page offset?',
            selectedOptionIndex: 2,
            correctOptionIndex: 2,
            isCorrect: true,
            explanation: '2^12 = 4096 bytes (4KB), hence 12 bits are used for the offset.',
            options: ['8 bits', '10 bits', '12 bits', '20 bits']
          },
          {
            questionId: 'q3',
            questionText: 'Which page replacement policy is susceptible to Belady’s Anomaly?',
            selectedOptionIndex: 1,
            correctOptionIndex: 1,
            isCorrect: true,
            explanation: 'FIFO can suffer from more page faults as physical frame allocation increases.',
            options: ['LRU', 'FIFO', 'Optimal replacement', 'Clock algorithm']
          },
          {
            questionId: 'q4',
            questionText: 'Which of the following is NOT one of the Coffman conditions for deadlock?',
            selectedOptionIndex: 3,
            correctOptionIndex: 3,
            isCorrect: true,
            explanation: 'Preemptive resource allocation prevents deadlock; Coffman condition is No Preemption.',
            options: ['Mutual Exclusion', 'Hold and Wait', 'Circular Wait', 'Preemptive Allocation']
          },
          {
            questionId: 'q5',
            questionText: 'What is the purpose of Address Space Identifiers (ASID) in TLB entries?',
            selectedOptionIndex: 1,
            correctOptionIndex: 0,
            isCorrect: false,
            explanation: 'ASIDs prevent having to flush the entire TLB on context switches between processes.',
            options: ['Prevent full TLB flush on context switch', 'Encrypt page frames', 'Check write permissions', 'Increase virtual page sizes']
          }
        ]
      },
      {
        id: `demo-${now}-3`,
        userId: 'guest-user',
        quizId: 'quiz-ml-transformers',
        topic: 'Machine Learning: Attention & Transformers',
        difficulty: 'Intermediate',
        score: 5,
        totalQuestions: 5,
        percentage: 100,
        durationSeconds: 95,
        timestamp: new Date(now - 14400000).toISOString(),
        userAnswers: [
          {
            questionId: 'q1',
            questionText: 'Why is the dot-product scaled by sqrt(d_k) in Scaled Dot-Product Attention?',
            selectedOptionIndex: 0,
            correctOptionIndex: 0,
            isCorrect: true,
            explanation: 'Scaling prevents dot products from growing excessively large, which pushes softmax into regions with vanishing gradients.',
            options: ['Avoid vanishing gradients in softmax', 'Normalize word embeddings to unit length', 'Speed up matrix multiplication', 'Compress hidden states']
          },
          {
            questionId: 'q2',
            questionText: 'What is the key advantage of Multi-Head Attention over single-head attention?',
            selectedOptionIndex: 1,
            correctOptionIndex: 1,
            isCorrect: true,
            explanation: 'It allows the model to jointly attend to information from different representation subspaces and positions.',
            options: ['Reduces parameter count to zero', 'Attends to diverse representation subspaces simultaneously', 'Eliminates positional encodings', 'Ensures linear execution time']
          },
          {
            questionId: 'q3',
            questionText: 'Why do Transformers require positional encodings?',
            selectedOptionIndex: 2,
            correctOptionIndex: 2,
            isCorrect: true,
            explanation: 'Self-attention is permutation-equivariant; sequence order must be explicitly injected.',
            options: ['To initialize projection weights', 'To prevent catastrophic forgetting', 'Self-attention is permutation-invariant without them', 'To calculate loss functions']
          },
          {
            questionId: 'q4',
            questionText: 'What type of masking do decoder-only LLMs apply during generation?',
            selectedOptionIndex: 0,
            correctOptionIndex: 0,
            isCorrect: true,
            explanation: 'Causal upper-triangular masking ensures token t attends only to previous positions.',
            options: ['Causal upper-triangular autoregressive masking', 'Bidirectional random span masking', 'Sparse stride masking', 'Gradient checkpoint masking']
          },
          {
            questionId: 'q5',
            questionText: 'What does RoPE (Rotary Position Embedding) do?',
            selectedOptionIndex: 3,
            correctOptionIndex: 3,
            isCorrect: true,
            explanation: 'Encodes relative position by rotating queries and keys in 2D slices.',
            options: ['Normalizes layer weights', 'Clips gradients at token boundaries', 'Replaces feed-forward networks', 'Rotates query and key vectors in complex 2D planes']
          }
        ]
      },
      {
        id: `demo-${now}-4`,
        userId: 'guest-user',
        quizId: 'quiz-db-indexes',
        topic: 'Database Management & B+ Trees',
        difficulty: 'Intermediate',
        score: 4,
        totalQuestions: 5,
        percentage: 80,
        durationSeconds: 104,
        timestamp: new Date(now - 3600000).toISOString(),
        userAnswers: [
          {
            questionId: 'q1',
            questionText: 'Why are B+ Trees favored over standard Binary Search Trees for disk storage?',
            selectedOptionIndex: 0,
            correctOptionIndex: 0,
            isCorrect: true,
            explanation: 'High branching factor minimizes disk I/O seeks per lookup.',
            options: ['High fan-out minimizes costly disk I/O seeks', 'They consume zero memory', 'They require no locking under concurrency', 'They execute in O(1) time']
          },
          {
            questionId: 'q2',
            questionText: 'Where are actual data pointers stored in a B+ Tree?',
            selectedOptionIndex: 2,
            correctOptionIndex: 2,
            isCorrect: true,
            explanation: 'All records or row pointers reside exclusively in leaf nodes, linked sequentially.',
            options: ['In the root node only', 'Randomly distributed across internal nodes', 'Exclusively in leaf nodes', 'In external heap files only']
          },
          {
            questionId: 'q3',
            questionText: 'What does ACID stand for in database transaction theory?',
            selectedOptionIndex: 1,
            correctOptionIndex: 1,
            isCorrect: true,
            explanation: 'Atomicity, Consistency, Isolation, Durability.',
            options: ['Array, Cache, Index, Disk', 'Atomicity, Consistency, Isolation, Durability', 'Active, Concurrent, Independent, Durable', 'Algorithm, Core, Invariant, Data']
          },
          {
            questionId: 'q4',
            questionText: 'What isolation anomaly does Snapshot Isolation prevent?',
            selectedOptionIndex: 0,
            correctOptionIndex: 0,
            isCorrect: true,
            explanation: 'Snapshot isolation ensures reads observe a consistent point-in-time snapshot, preventing non-repeatable reads.',
            options: ['Non-repeatable reads and dirty reads', 'Write skew', 'Deadlock cycles', 'Buffer pool overflow']
          },
          {
            questionId: 'q5',
            questionText: 'What is write amplification in LSM (Log-Structured Merge) Trees?',
            selectedOptionIndex: 1,
            correctOptionIndex: 0,
            isCorrect: false,
            explanation: 'Multiple rewrites of data during compaction cycles result in write amplification.',
            options: ['Ratio of bytes written to storage vs logical write size', 'Increasing font size of logs', 'Replicating queries to secondary nodes', 'Memory cache fragmentation']
          }
        ]
      }
    ];

    localStorage.setItem(STORAGE_KEYS.ATTEMPTS, JSON.stringify(sampleAttempts));
    return sampleAttempts;
  },

  // GAMIFICATION: XP CALCULATION
  calculateXP(attempts, streak = 0) {
    if (!attempts || attempts.length === 0) return 0;

    let totalXP = 0;
    attempts.forEach(a => {
      const correct = Number(a.score) || 0;
      const total = Number(a.totalQuestions) || 1;
      const pct = Number(a.percentage) || Math.round((correct / total) * 100);

      // +15 XP for every correct answer
      totalXP += correct * 15;
      // +5 XP for attempting incorrect questions
      totalXP += (total - correct) * 5;

      // Accuracy bonus
      if (pct === 100) {
        totalXP += 75; // Flawless bonus!
      } else if (pct >= 80) {
        totalXP += 40; // Mastery bonus!
      } else if (pct >= 60) {
        totalXP += 20;
      }
    });

    // Daily Streak bonus (+30 XP per active streak day)
    totalXP += Math.min(streak, 30) * 30;

    return totalXP;
  },

  // GAMIFICATION: LEVEL & RANK PROGRESSION
  getLevel(xp) {
    const ranks = [
      { level: 1, title: 'Freshman Novice', emoji: '🌱', minXP: 0, maxXP: 150, color: 'text-emerald-600', bg: 'bg-emerald-50' },
      { level: 2, title: 'Curious Scholar', emoji: '📖', minXP: 150, maxXP: 350, color: 'text-sky-600', bg: 'bg-sky-50' },
      { level: 3, title: 'Coffee Crammer', emoji: '☕', minXP: 350, maxXP: 700, color: 'text-amber-600', bg: 'bg-amber-50' },
      { level: 4, title: 'Honor Roll Prodigy', emoji: '🎖️', minXP: 700, maxXP: 1200, color: 'text-indigo-600', bg: 'bg-indigo-50' },
      { level: 5, title: 'Dean’s List Legend', emoji: '👑', minXP: 1200, maxXP: 2000, color: 'text-purple-600', bg: 'bg-purple-50' },
      { level: 6, title: 'Academic Grandmaster', emoji: '⚡', minXP: 2000, maxXP: 5000, color: 'text-rose-600', bg: 'bg-rose-50' }
    ];

    let currentRank = ranks[0];
    for (let i = ranks.length - 1; i >= 0; i--) {
      if (xp >= ranks[i].minXP) {
        currentRank = ranks[i];
        break;
      }
    }

    const range = currentRank.maxXP - currentRank.minXP;
    const progressInLevel = Math.max(0, xp - currentRank.minXP);
    const progressPercent = Math.min(100, Math.round((progressInLevel / range) * 100));
    const xpToNext = Math.max(0, currentRank.maxXP - xp);

    return {
      level: currentRank.level,
      title: currentRank.title,
      emoji: currentRank.emoji,
      color: currentRank.color,
      bg: currentRank.bg,
      currentXP: xp,
      nextLevelXP: currentRank.maxXP,
      progressPercent,
      xpToNext
    };
  },

  // GAMIFICATION: UNLOCKABLE ACHIEVEMENT BADGES
  getBadges(attempts, streak = 0) {
    const list = attempts || [];
    const uniqueTopics = new Set();
    list.forEach(a => { if (a.topic) uniqueTopics.add(a.topic); });

    const badges = [
      {
        id: 'first_quest',
        name: 'First Quest 🎯',
        desc: 'Completed your first active-recall quiz',
        unlocked: list.length >= 1,
        color: 'from-amber-400 to-orange-500',
        progress: `${Math.min(list.length, 1)}/1`
      },
      {
        id: 'flawless',
        name: 'Flawless 100% 👑',
        desc: 'Scored a perfect 100% on any practice exam',
        unlocked: list.some(a => (Number(a.percentage) || 0) === 100),
        color: 'from-emerald-400 to-teal-500',
        progress: list.some(a => a.percentage === 100) ? 'Unlocked!' : 'Requires 100%'
      },
      {
        id: 'streak_fire',
        name: 'Daily Streak 🔥',
        desc: 'Active study streak for at least 2 days',
        unlocked: streak >= 2,
        color: 'from-rose-500 to-amber-500',
        progress: `${streak}/2 days`
      },
      {
        id: 'speed_demon',
        name: 'Speed Demon ⚡',
        desc: 'Completed an exam in under 2 minutes',
        unlocked: list.some(a => a.durationSeconds > 0 && a.durationSeconds <= 120),
        color: 'from-yellow-400 to-amber-500',
        progress: list.some(a => a.durationSeconds <= 120) ? 'Unlocked!' : '< 2 mins'
      },
      {
        id: 'polymath',
        name: 'Campus Polymath 📚',
        desc: 'Studied across 2 or more different subjects',
        unlocked: uniqueTopics.size >= 2,
        color: 'from-indigo-500 to-purple-600',
        progress: `${uniqueTopics.size}/2 subjects`
      },
      {
        id: 'high_roller',
        name: 'Quiz Master 🏆',
        desc: 'Completed 4 or more practice assessments',
        unlocked: list.length >= 4,
        color: 'from-sky-400 to-blue-600',
        progress: `${Math.min(list.length, 4)}/4 quizzes`
      }
    ];

    return badges;
  },

  // STREAK & ANALYTICS
  calculateStreak(attempts) {
    if (!attempts || attempts.length === 0) return 0;

    const activeDates = new Set();
    attempts.forEach(a => {
      if (a.timestamp) {
        const d = new Date(a.timestamp);
        if (!isNaN(d.getTime())) {
          activeDates.add(d.toISOString().split('T')[0]);
        }
      }
    });

    const sortedDates = Array.from(activeDates).sort().reverse();
    if (sortedDates.length === 0) return 0;

    const today = new Date().toISOString().split('T')[0];
    const yesterdayDate = new Date(Date.now() - 86400000);
    const yesterday = yesterdayDate.toISOString().split('T')[0];

    if (!activeDates.has(today) && !activeDates.has(yesterday)) {
      return 0;
    }

    let streak = 0;
    let checkDate = activeDates.has(today) ? new Date() : yesterdayDate;

    while (true) {
      const dateStr = checkDate.toISOString().split('T')[0];
      if (activeDates.has(dateStr)) {
        streak++;
        checkDate.setDate(checkDate.getDate() - 1);
      } else {
        break;
      }
    }

    return streak;
  },

  getAnalyticsSummary() {
    const attempts = this.getAttempts();
    const totalAttempts = attempts.length;
    const currentStreak = this.calculateStreak(attempts);
    const totalXP = this.calculateXP(attempts, currentStreak);
    const levelInfo = this.getLevel(totalXP);
    const badges = this.getBadges(attempts, currentStreak);

    if (totalAttempts === 0) {
      return {
        totalQuizzes: 0,
        averageAccuracy: 0,
        currentStreak: 0,
        bestTopic: 'No quizzes yet',
        totalQuestionsAnswered: 0,
        totalTimeSpentMinutes: 0,
        totalXP: 0,
        levelInfo,
        badges,
        topicBreakdown: {},
        scoreTrend: []
      };
    }

    let sumAccuracy = 0;
    let totalQuestions = 0;
    let totalDurationSeconds = 0;
    const topicStats = {};

    attempts.forEach(a => {
      const pct = Number(a.percentage) || 0;
      const qCount = Number(a.totalQuestions) || 0;
      const duration = Number(a.durationSeconds) || 0;
      const topic = a.topic || 'General';

      sumAccuracy += pct;
      totalQuestions += qCount;
      totalDurationSeconds += duration;

      if (!topicStats[topic]) {
        topicStats[topic] = { count: 0, totalPct: 0, highestScore: 0 };
      }
      topicStats[topic].count += 1;
      topicStats[topic].totalPct += pct;
      if (pct > topicStats[topic].highestScore) {
        topicStats[topic].highestScore = pct;
      }
    });

    const averageAccuracy = Math.round(sumAccuracy / totalAttempts);

    // Determine Best Topic
    let bestTopic = 'General';
    let highestAvg = -1;
    Object.entries(topicStats).forEach(([topic, stats]) => {
      const avg = stats.totalPct / stats.count;
      if (avg > highestAvg) {
        highestAvg = avg;
        bestTopic = topic;
      }
    });

    // Chronological trend
    const scoreTrend = [...attempts]
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime())
      .map((a, index) => {
        const d = new Date(a.timestamp);
        const dateLabel = isNaN(d.getTime()) 
          ? `Quiz #${index + 1}` 
          : `${d.getMonth() + 1}/${d.getDate()}`;
        return {
          id: a.id,
          dateLabel,
          timestamp: a.timestamp,
          percentage: Number(a.percentage) || 0,
          topic: a.topic || 'General',
          difficulty: a.difficulty || 'Intermediate',
          score: a.score,
          totalQuestions: a.totalQuestions
        };
      });

    return {
      totalQuizzes: totalAttempts,
      averageAccuracy,
      currentStreak,
      bestTopic,
      totalQuestionsAnswered: totalQuestions,
      totalTimeSpentMinutes: Math.round(totalDurationSeconds / 60),
      totalXP,
      levelInfo,
      badges,
      topicBreakdown: topicStats,
      scoreTrend
    };
  }
};
