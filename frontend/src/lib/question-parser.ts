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
  const lines = text
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

  const finalizeQuestion = (q: Partial<ParsedQuestion>) => {
    if (!q.question_text) return; // Skip empty

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
