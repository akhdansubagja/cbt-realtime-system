import { useState, useEffect } from "react";
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
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import { parseQuestionText, ParsedQuestion } from "@/lib/question-parser";
import { notifications } from "@mantine/notifications";

interface QuickImportModalProps {
  opened: boolean;
  onClose: () => void;
  onSave: (questions: ParsedQuestion[]) => Promise<void>;
}

export function QuickImportModal({
  opened,
  onClose,
  onSave,
}: QuickImportModalProps) {
  const [text, setText] = useState("");
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const parsed = parseQuestionText(text);
    setParsedQuestions(parsed);
    setErrorCount(parsed.filter((q) => !q.isValid).length);
  }, [text]);

  const handleSave = async () => {
    if (errorCount > 0) return;

    setIsSaving(true);
    try {
      await onSave(parsedQuestions);
      setText(""); // Reset form on success
      onClose();
    } catch (error) {
      // Error handling is done in parent or global handler
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Quick Question Import"
      size="90%"
      styles={{
        body: { height: "80vh", display: "flex", flexDirection: "column" },
      }}
      centered
    >
      <Group align="flex-start" grow style={{ flex: 1, overflow: "hidden" }}>
        {/* LEFT PANEL: INPUT */}
        <Stack style={{ height: "100%" }}>
          <Text size="sm" c="dimmed">
            Paste your questions here. Supported formats:
            <br />
            1. Suffix: "Option text ##" for correct answer.
            <br />
            2. Answer Line: "ANSWER: A" on a new line.
          </Text>
          <Textarea
            placeholder={`1. What is 2+2?
a. 3
b. 4 ##
c. 5

2. Capital of France?
A. London
B. Paris
ANSWER: B`}
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            style={{ flex: 1 }}
            styles={{ 
              input: { 
                height: "100%", 
                fontFamily: "monospace",
                resize: "vertical" 
              },
              wrapper: {
                height: "100%",
                display: "flex",
                flexDirection: "column"
              }
            }}
          />
        </Stack>

        {/* RIGHT PANEL: PREVIEW */}
        <Stack
          style={{
            height: "100%",
            borderLeft: "1px solid #eee",
            paddingLeft: "1rem",
          }}
        >
          <Group justify="space-between">
            <Text fw={700}>
              Live Preview ({parsedQuestions.length} Questions)
            </Text>
            {errorCount > 0 && (
              <Badge color="red" leftSection={<IconAlertCircle size={14} />}>
                {errorCount} Errors
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
                  style={{
                    borderColor: q.isValid
                      ? undefined
                      : "var(--mantine-color-red-5)",
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
      </Group>

      <Divider my="md" />

      <Group justify="flex-end">
        <Button variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleSave}
          disabled={parsedQuestions.length === 0 || errorCount > 0}
          loading={isSaving}
        >
          Save All ({parsedQuestions.length})
        </Button>
      </Group>
    </Modal>
  );
}
