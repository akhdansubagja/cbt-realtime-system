import { useState, useEffect, useRef } from "react";
// Remove useLocalStorage
import {
  Modal,
  Group,
  Button,
  Textarea,
  Box,
  Text,
  Stack,
  Paper,
  Badge,
  Alert,
  ScrollArea,
  SimpleGrid,
  Divider,
  ActionIcon,
  FileInput,
  Image,
  Center,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconX,
  IconPhoto,
  IconTrash,
  IconRefresh,
  IconInfoCircle,
} from "@tabler/icons-react";
import { parseQuestionText, ParsedQuestion } from "@/lib/question-parser";
import { notifications } from "@mantine/notifications";
import { saveDraft, loadDraft, deleteDraft } from "@/lib/indexed-db";
import { useDebouncedCallback } from "@mantine/hooks"; // Use Mantine's debounce hook if available, or custom timeout.
// Mantine has useDebouncedValue, let's check imports. User code had useDebouncedValue in page.tsx.
// Let's use a simple timeout for auto-saving or check if useDebouncedCallback is available in @mantine/hooks.
// To be safe and minimal dependency, I'll use a specific useEffect with setTimeout.

interface QuickImportPanelProps {
  bankId: string | number; // Added bankId
  onSave: (questions: ParsedQuestion[]) => Promise<void>;
  onCancel: () => void;
}

interface DraftData {
  text: string;
  parsedQuestions: ParsedQuestion[];
}

export function QuickImportPanel({
  bankId,
  onSave,
  onCancel,
}: QuickImportPanelProps) {
  const storageKey = `draft-quick-import-qbank-${bankId}`;

  // State for raw text
  const [text, setText] = useState("");

  // State for parsed questions (includes manuals image/files)
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [helpOpened, setHelpOpened] = useState(false);

  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const questionRefs = useRef<Record<number, HTMLDivElement | null>>({});

  const updateActiveQuestion = (
    e: React.SyntheticEvent<HTMLTextAreaElement>
  ) => {
    const textarea = e.currentTarget;
    const cursorPosition = textarea.selectionStart;
    const textBeforeCursor = textarea.value.substring(0, cursorPosition);

    // Regex to match question numbers (e.g. "1. ", "5) ")
    // We count how many question start markers exist before the cursor
    // This assumes the parser logic which usually keys on these
    const matches = textBeforeCursor.match(/^\s*\d+[\.\)]/gm);
    const count = matches ? matches.length : 0;
    
    // Index is count - 1 (if count 1, index 0). If 0, stays 0
    const newIndex = count > 0 ? count - 1 : 0;
    setActiveQuestionIndex(newIndex);
  };

  useEffect(() => {
    const element = questionRefs.current[activeQuestionIndex];
    if (element) {
      // Re-trigger scroll when content changes (parsedQuestions updates)
      // "nearest" ensures that if the card grows (e.g. adding options) and goes off-screen, it bumps into view.
      element.scrollIntoView({ behavior: "auto", block: "nearest" });
    }
  }, [activeQuestionIndex, parsedQuestions]);


  // 1. Load Draft on Mount
  useEffect(() => {
    const init = async () => {
      const draft = await loadDraft<DraftData>(storageKey);
      if (draft) {
        if (draft.text) setText(draft.text);
        // Restore images/previews if stored.
        // File objects stored in IDB will be retrieved as Files/Blobs.
        // We need to recreate object URLs for previews.
        if (draft.parsedQuestions) {
          const restored = draft.parsedQuestions.map((q) => ({
            ...q,
            imagePreviewUrl: q.imageFile
              ? URL.createObjectURL(q.imageFile)
              : undefined,
          }));
          setParsedQuestions(restored);
        }
      }
      setIsDraftLoaded(true);
    };
    init();
  }, [storageKey]);

  // 2. Parse Text Logic (Only runs after draft load to avoid overwriting with empty parsing)
  useEffect(() => {
    if (!isDraftLoaded) return;

    // Parse the text
    const parsed = parseQuestionText(text);

    setParsedQuestions((prev) => {
      return parsed.map((newQ, i) => {
        // PRESERVING IMAGES STRATEGY:
        // If the NEW parsed question matches the OLD one by index,
        // OR better, we try to preserve based on index stability which is what the user expects while typing.

        const existingQ = prev[i];

        // If existing question exists and has image, keep it
        if (existingQ && existingQ.imageFile) {
          return {
            ...newQ,
            imageFile: existingQ.imageFile,
            imagePreviewUrl: existingQ.imagePreviewUrl,
          };
        }
        return newQ;
      });
    });
  }, [text, isDraftLoaded]);

  // 3. Update Error Count
  useEffect(() => {
    setErrorCount(parsedQuestions.filter((q) => !q.isValid).length);
  }, [parsedQuestions]);

  // 4. Auto-Save Draft (Debounced)
  useEffect(() => {
    if (!isDraftLoaded) return;

    const timer = setTimeout(async () => {
      const isTextEmpty = !text || text.trim() === "";
      // Check if parsedQuestions has any valid data or images
      const isQuestionsEmpty = parsedQuestions.length === 0;

      if (isTextEmpty && isQuestionsEmpty) {
        await deleteDraft(storageKey);
      } else {
        // We save both text AND parsedQuestions to preserve the Files attached to them
        await saveDraft(storageKey, { text, parsedQuestions });
      }
    }, 1000);

    return () => clearTimeout(timer);
  }, [text, parsedQuestions, storageKey, isDraftLoaded]);

  const handleFileChange = (index: number, file: File | null) => {
    setParsedQuestions((prev) => {
      const newQuestions = [...prev];
      const question = { ...newQuestions[index] };

      if (file) {
        question.imageFile = file;
        question.imagePreviewUrl = URL.createObjectURL(file);
      } else {
        question.imageFile = undefined;
        question.imagePreviewUrl = undefined;
      }

      newQuestions[index] = question;
      return newQuestions;
    });
  };

  const handleReset = async () => {
    setText("");
    setParsedQuestions([]);
    // Clearing the DB is enough, state is cleared.
    await deleteDraft(storageKey);
    notifications.show({
      title: "Reset Berhasil",
      message: "Draft soal telah dikosongkan.",
      color: "blue",
      icon: <IconRefresh size={16} />,
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter") {
      const textarea = e.currentTarget;
      const cursor = textarea.selectionStart;
      const value = textarea.value;

      // Find start of current line
      const lastNewLine = value.lastIndexOf("\n", cursor - 1);
      const currentLine = value.substring(lastNewLine + 1, cursor);

      // Regex: Group 1=Space, Group 2=Marker(a,1), Group 3=Separator(.)
      // Added support for ')' as separator based on requirement (Patterns: "1) ", "a) ")
      const match = currentLine.match(/^(\s*)([a-zA-Z0-9]+)([\.\)])\s+(.*)$/);

      if (match) {
        // e.preventDefault(); // Don't prevent default yet, check logic below.
        // Actually we MUST prevent default because we are manually inserting newline+marker

        const [fullMatch, indent, marker, separator, content] = match;

        // If content is empty (double enter), stop the list
        if (!content.trim()) {
          e.preventDefault();
          const textBeforeLine = value.substring(0, lastNewLine + 1); // Keep previous newline
          const textAfter = value.substring(cursor);
          
          let newText = textBeforeLine + textAfter; // Default: Just remove the empty marker
          let newCursorPos = textBeforeLine.length;

          // SPECIAL FEATURE: If we are clearing a letter marker (a., b., c...), 
          // assumes we finished options, so auto-generate Next Question Number.
          const isLetterMarker = /^[a-zA-Z]+$/.test(marker);
          
          if (isLetterMarker) {
             // Look backwards for the last number marker (e.g. "1.")
             // Regex finds "Start of line, whitespace, digits, dot/paren"
             const questionMatches = [...textBeforeLine.matchAll(/^\s*(\d+)([\.\)])/gm)];
             
             if (questionMatches.length > 0) {
               const lastMatch = questionMatches[questionMatches.length - 1];
               const lastNumber = parseInt(lastMatch[1]);
               const matchedSeparator = lastMatch[2]; // Use same separator (. or ))
               
               const nextNumber = lastNumber + 1;
               // Add a blank line before the new question for better formatting
               const nextQuestionBlock = `\n${nextNumber}${matchedSeparator} `;
               
               newText = textBeforeLine + nextQuestionBlock + textAfter;
               newCursorPos = textBeforeLine.length + nextQuestionBlock.length;
             }
          }

          setText(newText);
          // Need to manually set cursor position after render
          setTimeout(() => {
            textarea.selectionStart = textarea.selectionEnd = newCursorPos;
          }, 0);
          return;
        }

        e.preventDefault();

        // Calculate next marker
        let nextMarker = "";
        const isNumber = /^\d+$/.test(marker);

        if (isNumber) {
          // If previous was a number (Question), next should be first Option 'a'
          nextMarker = "a";
        } else {
          // Handle alphabet (a->b, A->B)
          const charCode = marker.charCodeAt(0);
          nextMarker = String.fromCharCode(charCode + 1);
        }

        const insertion = `\n${indent}${nextMarker}${separator} `;

        // Insert text
        const newText =
          value.substring(0, cursor) + insertion + value.substring(cursor);
        setText(newText);

        // Move cursor
        setTimeout(() => {
          textarea.selectionStart = textarea.selectionEnd =
            cursor + insertion.length;
        }, 0);
      }
    }
  };

  const handleSave = async () => {
    if (errorCount > 0) return;

    setIsSaving(true);
    try {
      await onSave(parsedQuestions);
      // Clear Draft on Success
      await deleteDraft(storageKey);
      setText("");
      setParsedQuestions([]);
      onCancel();
    } catch (error) {
      // Error handling is done in parent or global handler
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack h="100%">
      <Modal
        opened={helpOpened}
        onClose={() => setHelpOpened(false)}
        title="Panduan Format Import Soal"
        size="lg"
      >
        <Stack gap="md">
          <Box>
            <Text fw={500} size="sm" mb="xs">
              Format Soal:
            </Text>
            <Paper withBorder p="xs" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))">
              <Text
                component="pre"
                size="xs"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {`1. Ibukota Indonesia adalah...
a. Jakarta
b. Bandung`}
              </Text>
            </Paper>
          </Box>
          <Box>
            <Text fw={500} size="sm" mb="xs">
              Kunci Jawaban Cara Inline #1 (Recomended):
            </Text>
            <Text size="sm" c="dimmed" mb="xs">
              Tambahkan ; (titik koma) di akhir opsi benar
            </Text>
            <Paper withBorder p="xs" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))">
              <Text
                component="pre"
                size="xs"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {`1. Ibukota Indonesia adalah...
A. Bandung
B. Jakarta;`}
              </Text>
            </Paper>
          </Box>
          <Box>
            <Text fw={500} size="sm" mb="xs">
              Kunci Jawaban Cara Inline #2:
            </Text>
            <Text size="sm" c="dimmed" mb="xs">
              Tambahkan "Answer: " di akhir soal
            </Text>
            <Paper withBorder p="xs" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))">
              <Text
                component="pre"
                size="xs"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {`1. Ibukota Indonesia adalah...
A. Bandung
B. Jakarta
ANSWER: B`}
              </Text>
            </Paper>
          </Box>
          <Box>
            <Text fw={500} size="sm" mb="xs">
              Kunci Jawaban Cara Blok:
            </Text>
            <Text size="sm" c="dimmed" mb="xs">
              Tulis Answer: atau Jawaban: di baris paling bawah
            </Text>
            <Paper withBorder p="xs" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))">
              <Text
                component="pre"
                size="xs"
                style={{ whiteSpace: "pre-wrap" }}
              >
                {`1. Ibukota Indonesia adalah...
A. Bandung
B. Jakarta

2. Ibukota Jawa Barat adalah...
A. Bandung
B. Jakarta

Answer:
1. b
2. a`}
              </Text>
            </Paper>
          </Box>
        </Stack>
      </Modal>

      <SimpleGrid cols={2} spacing="md" style={{ flex: 1, minHeight: 0 }}>
        <Stack h="100%" style={{ overflow: 'hidden' }}>
          <Group justify="space-between" h={40}>
            <Text fw={500}>Paste Text Soal di Sini:</Text>
            <ActionIcon
              variant="subtle"
              radius="xl"
              size="lg"
              onClick={() => setHelpOpened(true)}
            >
              <IconInfoCircle />
            </ActionIcon>
          </Group>
          <Textarea
            value={text}
            onChange={(e) => {
              setText(e.currentTarget.value);
              updateActiveQuestion(e);
            }}
            onKeyDown={handleKeyDown}
            onKeyUp={updateActiveQuestion}
            onClick={updateActiveQuestion}
            style={{ flex: 1, display: "flex", flexDirection: "column" }}
            styles={{ 
              wrapper: { flex: 1, display: 'flex', flexDirection: 'column' }, 
              input: { flex: 1, resize: "none", overflowY: "auto", height: "100%" } 
            }}
          />
        </Stack>

        <Stack h="100%" style={{ overflowY: "hidden" }}>
          <Group justify="space-between" h={40}>
            <Text fw={500}>Live Preview ({parsedQuestions.length} Soal)</Text>
            {errorCount > 0 && (
              <Badge color="red" leftSection={<IconAlertCircle size={14} />}>
                {errorCount} Error
              </Badge>
            )}
          </Group>

          <ScrollArea style={{ flex: 1 }} type="auto">
            <Stack gap="md" pb="md">
              {parsedQuestions.length === 0 && (
                <Text c="dimmed" ta="center" mt="xl">
                  Start typing to see preview...
                </Text>
              )}

              {parsedQuestions.map((q, i) => (
                <Paper
                  key={q.id}
                  withBorder
                  p="sm"
                  radius="md"
                  ref={(el) => {
                    questionRefs.current[i] = el;
                  }}
                  style={{
                    borderColor:
                      i === activeQuestionIndex
                        ? "var(--mantine-color-blue-5)"
                        : q.isValid
                        ? undefined
                        : "var(--mantine-color-red-5)",
                     transition: "border-color 0.2s ease",
                  }}
                >
                  <Group justify="space-between" mb="xs" align="flex-start">
                    <Group gap="xs">
                      <Badge variant="light" color="gray">
                        {i + 1}
                      </Badge>
                      <Text fw={500} style={{ flex: 1 }}>
                        {q.question_text}
                      </Text>
                    </Group>
                    {!q.isValid && (
                      <Badge color="red" variant="outline">
                        {q.validationError}
                      </Badge>
                    )}
                  </Group>

                  {q.imagePreviewUrl && (
                    <Box mb="sm">
                      <Image
                        src={q.imagePreviewUrl}
                        h={100}
                        w="auto"
                        fit="contain"
                        radius="sm"
                        mb="xs"
                      />
                      <Button
                        color="red"
                        variant="subtle"
                        size="xs"
                        onClick={() => handleFileChange(i, null)}
                        leftSection={<IconTrash size={14} />}
                      >
                        Remove Image
                      </Button>
                    </Box>
                  )}

                  {!q.imagePreviewUrl && (
                    <FileInput
                      placeholder="Attach Image (Optional)"
                      accept="image/*"
                      size="xs"
                      mb="sm"
                      leftSection={<IconPhoto size={14} />}
                      onChange={(file) => handleFileChange(i, file)}
                      clearable
                    />
                  )}

                  <Stack gap={4} ml="lg">
                    {q.options.map((opt) => (
                      <Group key={opt.key} gap="xs">
                        <Badge
                          size="sm"
                          variant={
                            opt.key === q.correct_answer ? "filled" : "outline"
                          }
                          color={
                            opt.key === q.correct_answer ? "green" : "gray"
                          }
                          circle
                        >
                          {opt.key}
                        </Badge>
                        <Text size="sm">{opt.text}</Text>
                      </Group>
                    ))}
                  </Stack>
                </Paper>
              ))}
            </Stack>
          </ScrollArea>
        </Stack>
      </SimpleGrid>

      <Divider />

      <Group justify="space-between">
        <Button
          variant="light"
          color="red"
          onClick={handleReset}
          leftSection={<IconRefresh size={16} />}
        >
          Reset
        </Button>
        <Group justify="flex-end">
          <Button variant="default" onClick={onCancel}>
            Batal
          </Button>
          <Button
            onClick={handleSave}
            disabled={errorCount > 0 || parsedQuestions.length === 0}
          >
            Simpan Semua ({parsedQuestions.length})
          </Button>
        </Group>
      </Group>
    </Stack>
  );
}
