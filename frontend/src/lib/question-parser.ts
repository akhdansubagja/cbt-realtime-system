export interface ParsedQuestion {
  id: string; // Temporary ID for UI
  question_text: string;
  options: { key: string; text: string }[];
  correct_answer: string;
  isValid: boolean;
  validationError?: string;
  imageFile?: File;
  imagePreviewUrl?: string;
}

export function parseQuestionText(text: string): ParsedQuestion[] {
  // 1. Separate "Answer Key Block" from "Questions Text"
  // Keywords: "Answer:", "Answers:", "Jawaban:", "Kunci Jawaban:", "Jwbn:"
  // Must be followed by a line break or start a new section at the end of the text.
  let questionBody = text;
  let answerBlock = "";

  const answerBlockRegex =
    /\n(?:Answer|Answers|Jawaban|Kunci Jawaban|Jwbn)[:\s]*\n([\s\S]*)$/i;
  const match = text.match(answerBlockRegex);

  if (match) {
    questionBody = text.substring(0, match.index).trim();
    answerBlock = match[1].trim();
  }

  // 2. Parse Answer Key Block into a Map
  // Format: "1. A", "2. b", "3 C"
  const answerMap = new Map<string, string>(); // Index/Number -> Answer Char
  if (answerBlock) {
    const answerLines = answerBlock.split("\n");
    const answerPairRegex = /^(\d+)[\.\)\s]+([a-eA-E])/;

    // Also support single line format: "1. A 2. B 3. C"
    // Split by numbers if necessary, but simple regex on lines is safest first.
    // Let's handle both line-based and space-separated flow.
    const tokens = answerBlock.split(/\s+/); // Split by whitespace to handle "1. A 2. B"

    // Improved logic: Match patterns in the whole block string
    const globalAnswerRegex = /(\d+)[\.\)\s]+([a-eA-E])/g;
    let m;
    while ((m = globalAnswerRegex.exec(answerBlock)) !== null) {
      answerMap.set(m[1], m[2].toUpperCase());
    }
  }

  const lines = questionBody
    .split("\n")
    .map((line) => line.trim())
    .filter((line) => line !== "");
  const questions: ParsedQuestion[] = [];

  let currentQuestion: Partial<ParsedQuestion> = {
    options: [],
  };

  // Regex patterns
  const questionStartRegex = /^(\d+[\.)])\s*(.+)/; // Matches "1. Question text"
  const optionRegex = /^([a-zA-Z])[\.\)]\s*(.+)/; // Matches "a. Option text" or "A) Option text"
  const answerLineRegex = /^ANSWER:\s*([a-zA-Z])/i; // Matches "ANSWER: A"

  let questionCounter = 0;

  const finalizeQuestion = (q: Partial<ParsedQuestion>) => {
    if (!q.question_text) return; // Skip empty

    questionCounter++;

    // If no correct answer explicitly marked, check the answer map
    if (!q.correct_answer) {
      const mappedAnswer = answerMap.get(String(questionCounter));
      if (mappedAnswer) {
        q.correct_answer = mappedAnswer;
      }
    }

    const isValid =
      !!q.question_text && (q.options?.length ?? 0) >= 2 && !!q.correct_answer;

    let validationError = undefined;
    if (!q.question_text) validationError = "Missing question text";
    else if ((q.options?.length ?? 0) < 2)
      validationError = "Must have at least 2 options";
    else if (!q.correct_answer) validationError = "No correct answer specified";

    questions.push({
      id: Math.random().toString(36).substr(2, 9),
      question_text: q.question_text,
      options: q.options || [],
      correct_answer: q.correct_answer || "",
      isValid,
      validationError,
    });
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Check for Answer Line (Format B)
    const answerMatch = line.match(answerLineRegex);
    if (answerMatch) {
      if (currentQuestion.question_text) {
        currentQuestion.correct_answer = answerMatch[1].toUpperCase();
      }
      continue;
    }

    // Check for Option
    const optionMatch = line.match(optionRegex);
    if (optionMatch) {
      const key = optionMatch[1].toUpperCase();
      let text = optionMatch[2];
      let isCorrect = false;

      // Check for Suffix (Format A)
      if (text.endsWith("##") || text.endsWith("**")) {
        isCorrect = true;
        text = text.replace(/##|\*\*/, "").trim();
      }

      if (currentQuestion.question_text) {
        currentQuestion.options?.push({ key, text });
        if (isCorrect) {
          currentQuestion.correct_answer = key;
        }
      }
      continue;
    }

    // Check for New Question Start
    const questionMatch = line.match(questionStartRegex);
    if (questionMatch) {
      // If we have a previous question accumulating, finalize it
      if (currentQuestion.question_text) {
        finalizeQuestion(currentQuestion);
        currentQuestion = { options: [] };
      }

      // Start new question (remove numbering)
      currentQuestion.question_text = questionMatch[2];
      continue;
    }

    // If line doesn't match anything specific, it might be:
    // 1. Continuation of previous question text
    // 2. Continuation of previous option text
    // 3. A question without numbering (if it's the start of a block or after a previous question finished)

    // Simple heuristic: if we have options, it's likely a new question without number
    // OR continuation of last option.
    // Let's assume if it doesn't look like an option and we already have options, it's a new question.
    if (currentQuestion.options && currentQuestion.options.length > 0) {
      // Finalize previous
      finalizeQuestion(currentQuestion);
      currentQuestion = { options: [], question_text: line };
    } else if (currentQuestion.question_text) {
      // Append to question text
      currentQuestion.question_text += " " + line;
    } else {
      // Start new question (no number)
      currentQuestion.question_text = line;
    }
  }

  // Finalize last question
  if (currentQuestion.question_text) {
    finalizeQuestion(currentQuestion);
  }

  return questions;
}
