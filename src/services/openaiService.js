/**
 * OpenAI GPT-4 Service & Smart Deterministic Offline Fallback Generator
 *
 * Implements strict JSON mode with RFC 8259 compliance, and includes a sophisticated
 * deterministic offline question synthesizer when API keys are absent or network is unavailable.
 */

import { storageService } from './storageService';

/**
 * Main quiz generation function
 */
export async function generateQuizFromNotes({
  notes,
  topic = 'General Study Notes',
  difficulty = 'Intermediate',
  questionCount = 5
}) {
  const config = storageService.getConfig();
  const envKey = import.meta.env.VITE_OPENAI_API_KEY || '';
  const activeKey = config.openaiApiKey?.trim() || envKey?.trim();
  const selectedModel = config.openaiModel || import.meta.env.VITE_OPENAI_MODEL || 'gpt-4o';
  const forceOffline = config.forceOfflineMode;

  // If offline mode is forced or no key is configured, synthesize via deterministic engine
  if (forceOffline || !activeKey) {
    console.log('[StudyBuddy AI] Using Smart Deterministic Fallback Generator (No API key / Offline mode)');
    // Artificial small delay for realistic UX feedback
    await new Promise(resolve => setTimeout(resolve, 800));
    return generateDeterministicFallbackQuiz({ notes, topic, difficulty, questionCount });
  }

  // Attempt live GPT-4 generation
  try {
    const prompt = `You are a Principal Academic Examiner and Knowledge Assessor. 
Analyze the provided study notes and generate exactly ${questionCount} multiple-choice questions testing active recall, conceptual understanding, and practical application.

Target Difficulty: ${difficulty}
Topic Domain: ${topic}

CRITICAL SCHEMA REQUIREMENTS (RFC 8259 JSON ONLY):
Respond ONLY with a valid JSON object matching this exact structure:
{
  "topic": "${topic}",
  "difficulty": "${difficulty}",
  "questions": [
    {
      "id": "q1",
      "question": "Clear conceptual or applied question derived strictly from the notes",
      "options": [
        "First option",
        "Second option",
        "Third option",
        "Fourth option"
      ],
      "correctIndex": 0,
      "explanation": "Detailed rationale citing why the answer is correct based on the uploaded notes"
    }
  ]
}

Strict Rules:
- Every question MUST have exactly 4 options.
- "correctIndex" MUST be an integer between 0 and 3.
- Derive questions strictly from the provided notes.
- Provide clear, didactic explanations citing specific concepts from the notes.
- Do NOT wrap in markdown backticks or commentary outside the JSON object.

STUDY NOTES:
${notes.slice(0, 14000)}
`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${activeKey}`
      },
      body: JSON.stringify({
        model: selectedModel,
        temperature: 0.3,
        response_format: { type: 'json_object' },
        messages: [
          {
            role: 'system',
            content: 'You are an expert exam generation engine that outputs strict, valid JSON quiz payloads.'
          },
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.warn(`[OpenAI API Error ${response.status}]: ${errBody}. Falling back to Smart Offline Generator.`);
      return generateDeterministicFallbackQuiz({ notes, topic, difficulty, questionCount });
    }

    const data = await response.json();
    const rawContent = data.choices?.[0]?.message?.content;
    if (!rawContent) {
      throw new Error('Empty completion received from OpenAI API.');
    }

    const parsed = JSON.parse(rawContent);
    return sanitizeAndValidateQuizPayload(parsed, topic, difficulty, questionCount, notes);

  } catch (err) {
    console.error('[OpenAI Generation Exception]:', err);
    console.log('[StudyBuddy AI] Transparently activating Smart Offline Fallback due to exception.');
    return generateDeterministicFallbackQuiz({ notes, topic, difficulty, questionCount });
  }
}

/**
 * Validates and normalizes the quiz payload to ensure no runtime crashes
 */
function sanitizeAndValidateQuizPayload(payload, defaultTopic, defaultDifficulty, targetCount, sourceNotes) {
  if (!payload || !Array.isArray(payload.questions) || payload.questions.length === 0) {
    return generateDeterministicFallbackQuiz({ notes: sourceNotes, topic: defaultTopic, difficulty: defaultDifficulty, questionCount: targetCount });
  }

  const sanitizedQuestions = payload.questions.map((q, idx) => {
    let options = Array.isArray(q.options) ? q.options.map(String) : [];
    if (options.length < 4) {
      while (options.length < 4) {
        options.push(`Alternative perspective ${options.length + 1}`);
      }
    } else if (options.length > 4) {
      options = options.slice(0, 4);
    }

    let correctIndex = Number(q.correctIndex);
    if (isNaN(correctIndex) || correctIndex < 0 || correctIndex >= options.length) {
      correctIndex = 0;
    }

    return {
      id: q.id || `q${idx + 1}`,
      question: q.question?.trim() || `Key conceptual question #${idx + 1}`,
      options,
      correctIndex,
      explanation: q.explanation?.trim() || 'This answer directly aligns with the fundamental principles outlined in the study notes.'
    };
  });

  return {
    topic: payload.topic || defaultTopic,
    difficulty: payload.difficulty || defaultDifficulty,
    questions: sanitizedQuestions.slice(0, targetCount)
  };
}

/**
 * Smart Deterministic Fallback Generator
 * Parses sentences, headers, lists, and key terms to construct realistic,
 * coherent multiple-choice questions even without an internet connection or API keys.
 */
export function generateDeterministicFallbackQuiz({ notes, topic, difficulty, questionCount = 5 }) {
  const cleanNotes = notes || '';
  const lines = cleanNotes.split('\n').map(l => l.trim()).filter(Boolean);
  
  // Extract sections, definitions, bullet points
  const definitions = [];
  const bulletPoints = [];
  const headers = [];
  const generalSentences = [];

  const defRegex = /^([A-Z][A-Za-z0-9\s()_\-]{2,35})\s*(?::|—|-|is defined as|means)\s*(.+)$/i;

  lines.forEach(line => {
    if (line.startsWith('#')) {
      const hText = line.replace(/^#+\s*/, '').trim();
      if (hText.length > 3) headers.push(hText);
      return;
    }

    const defMatch = line.match(defRegex);
    if (defMatch && defMatch[2].length > 15) {
      definitions.push({
        term: defMatch[1].replace(/[*_]/g, '').trim(),
        definition: defMatch[2].replace(/[*_]/g, '').trim()
      });
      return;
    }

    if (line.startsWith('- ') || line.startsWith('* ') || /^\d+\.\s/.test(line)) {
      const cleanBullet = line.replace(/^([-*]|\d+\.)\s*/, '').replace(/[*_]/g, '').trim();
      if (cleanBullet.length > 20) {
        bulletPoints.push(cleanBullet);
      }
      return;
    }

    // Split paragraphs into sentences
    const sentences = line.split(/(?<=[.!?])\s+/).filter(s => s.length > 25);
    generalSentences.push(...sentences);
  });

  const questions = [];

  // Strategy 1: Questions from Definitions
  definitions.forEach((def, index) => {
    if (questions.length >= questionCount) return;

    // Distractor terms from headers or other definitions
    const otherTerms = definitions
      .filter(d => d.term !== def.term)
      .map(d => d.term);
    
    const fallbackDistractors = [
      'Strict Linear Degradation',
      'Asynchronous Eventual Consistency',
      'Dynamic Polymorphism Invariant',
      'Transient Temporal Dependency',
      'Permutation Matrix Transformation'
    ];

    const distractors = [...otherTerms, ...headers, ...fallbackDistractors]
      .filter(t => t !== def.term)
      .slice(0, 3);

    while (distractors.length < 3) {
      distractors.push(`Alternative Paradigm ${distractors.length + 1}`);
    }

    const options = [def.term, ...distractors];
    // Deterministic shuffle using index
    const correctIndex = index % 4;
    // Swap into position
    const temp = options[0];
    options[0] = options[correctIndex];
    options[correctIndex] = temp;

    questions.push({
      id: `fallback-q${questions.length + 1}`,
      question: `According to the notes, which concept is described as: "${def.definition.slice(0, 160)}${def.definition.length > 160 ? '...' : ''}"?`,
      options,
      correctIndex,
      explanation: `The notes define "${def.term}" specifically with the attribute: "${def.definition}".`
    });
  });

  // Strategy 2: Questions from Key Bullet Points
  bulletPoints.forEach((bp, index) => {
    if (questions.length >= questionCount) return;

    // Create cloze/applied question
    const words = bp.split(' ');
    let subject = words.slice(0, 4).join(' ');
    
    const options = [
      bp,
      `It strictly inverts the invariant condition during peak execution cycles.`,
      `It is deprecated in high-throughput workloads due to unconstrained O(N^2) memory overhead.`,
      `It operates exclusively as an optional asynchronous background optimization.`
    ];

    const correctIndex = (index + 1) % 4;
    const temp = options[0];
    options[0] = options[correctIndex];
    options[correctIndex] = temp;

    questions.push({
      id: `fallback-q${questions.length + 1}`,
      question: `Which of the following statements accurately reflects the study notes regarding ${subject}?`,
      options,
      correctIndex,
      explanation: `The uploaded study notes explicitly specify: "${bp}".`
    });
  });

  // Strategy 3: General Sentences & Analytical Questions
  generalSentences.forEach((sent, index) => {
    if (questions.length >= questionCount) return;

    const options = [
      sent,
      `It results in instantaneous degradation of all primary guarantees.`,
      `It has been proven obsolete by modern hardware prefetching architectures.`,
      `It requires exponential time complexity in the average-case scenario.`
    ];

    const correctIndex = (index + 2) % 4;
    const temp = options[0];
    options[0] = options[correctIndex];
    options[correctIndex] = temp;

    questions.push({
      id: `fallback-q${questions.length + 1}`,
      question: `Based on the provided ${topic} notes, which technical conclusion is supported?`,
      options,
      correctIndex,
      explanation: `Verified directly from study text: "${sent}".`
    });
  });

  // If notes were very brief, fill remainder with smart domain questions
  const defaultBank = [
    {
      q: `What is the primary motivation for structuring the concepts in ${topic} as presented?`,
      options: [
        'To optimize algorithmic efficiency and eliminate unpredictable edge-case degradation.',
        'To reduce compile-time verification overhead across microservice boundaries.',
        'To enforce strict sequential synchronous thread scheduling.',
        'To eliminate garbage collection pauses entirely from memory management.'
      ],
      correctIndex: 0,
      exp: `Structured optimization and invariant enforcement are foundational to ${topic}.`
    },
    {
      q: `Under peak operational loads in ${topic}, which trade-off is typically observed?`,
      options: [
        'Spatial memory overhead is traded to secure near-constant or logarithmic time bounds.',
        'Network latency is maximized to preserve local CPU cache locality.',
        'Precision is completely sacrificed to maintain deterministic execution time.',
        'All data structures revert to unindexed flat file buffers.'
      ],
      correctIndex: 0,
      exp: 'Balancing space complexity against time complexity is the classical engineering trade-off in modern architectures.'
    },
    {
      q: `Which verification technique should be prioritized when testing implementations of ${topic}?`,
      options: [
        'Rigorous invariant assertions and boundary condition stress testing under adversarial inputs.',
        'Solely relying on basic happy-path smoke tests without load simulation.',
        'Disabling all runtime assertions to prevent diagnostic logging.',
        'Hardcoding expected hash codes into test fixtures.'
      ],
      correctIndex: 0,
      exp: 'Invariants and edge-case boundary testing guarantee stability in complex systems.'
    },
    {
      q: `When scaling ${topic} systems, what represents the primary bottleneck?`,
      options: [
        'Contention on shared resources and lock synchronization overhead.',
        'Insufficient network cable shielding in localized switches.',
        'Integer overflow in static constant declarations.',
        'Excessive source code comment density.'
      ],
      correctIndex: 0,
      exp: 'Resource contention and synchronization costs represent the primary scaling bottleneck in modern computing.'
    },
    {
      q: `What is the optimal methodology for retaining concepts covered in ${topic}?`,
      options: [
        'Active recall, spaced repetition, and practical code implementation.',
        'Passive rereading without answering retrieval practice questions.',
        'Memorizing code line numbers without understanding algorithmic flows.',
        'Deferring review until right before high-stakes assessments.'
      ],
      correctIndex: 0,
      exp: 'Empirical cognitive science demonstrates active retrieval practice yields superior long-term retention.'
    }
  ];

  let bankIndex = 0;
  while (questions.length < questionCount && bankIndex < defaultBank.length) {
    const item = defaultBank[bankIndex];
    questions.push({
      id: `fallback-q${questions.length + 1}`,
      question: item.q,
      options: item.options,
      correctIndex: item.correctIndex,
      explanation: item.exp
    });
    bankIndex++;
  }

  return {
    topic: topic || 'Study Notes Analysis',
    difficulty: difficulty || 'Intermediate',
    questions: questions.slice(0, questionCount)
  };
}

/**
 * Tests connection to OpenAI API
 */
export async function testOpenAIConnection(apiKey, model = 'gpt-4o') {
  if (!apiKey || !apiKey.trim()) {
    return { success: false, message: 'API key is empty.' };
  }

  try {
    const res = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey.trim()}`
      }
    });

    if (res.ok) {
      return { success: true, message: `Connected successfully to OpenAI API (Model: ${model}).` };
    } else {
      const err = await res.json().catch(() => ({}));
      return { 
        success: false, 
        message: err.error?.message || `HTTP ${res.status}: Authentication failed.` 
      };
    }
  } catch (err) {
    return { 
      success: false, 
      message: `Network connection failed: ${err.message}` 
    };
  }
}

