import { useState, useEffect } from "react";
import { useLocalStorage } from "@mantine/hooks";
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
  Center
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconX, IconPhoto, IconTrash } from "@tabler/icons-react";
import { parseQuestionText, ParsedQuestion } from "@/lib/question-parser";
import { notifications } from "@mantine/notifications";

interface QuickImportPanelProps {
  bankId: string | number; // Added bankId
  onSave: (questions: ParsedQuestion[]) => Promise<void>;
  onCancel: () => void;
}

export function QuickImportPanel({ bankId, onSave, onCancel }: QuickImportPanelProps) {
  const storageKey = `draft-quick-import-qbank-${bankId}`;
  const [text, setText, removeText] = useLocalStorage({
    key: storageKey,
    defaultValue: "",
    getInitialValueInEffect: false,
  });
  
  const [parsedQuestions, setParsedQuestions] = useState<ParsedQuestion[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const parsed = parseQuestionText(text);
    
    setParsedQuestions(prev => {
      return parsed.map((newQ, i) => {
        // Check if we had a question at this index previously
        const existingQ = prev[i];
        
        // If yes, PRESERVE the image data
        if (existingQ && existingQ.imageFile) {
          return {
            ...newQ,
            imageFile: existingQ.imageFile,
            imagePreviewUrl: existingQ.imagePreviewUrl
          };
        }
        return newQ;
      });
    });
    
    setErrorCount(parsed.filter((q) => !q.isValid).length);
  }, [text]);

  const handleFileChange = (index: number, file: File | null) => {
    setParsedQuestions(prev => {
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

  const handleSave = async () => {
    if (errorCount > 0) return;

    setIsSaving(true);
    try {
      await onSave(parsedQuestions);
      setText(""); // Reset form on success (also updates localStorage to empty string)
      removeText(); // Explicitly remove from storage
      onCancel();
    } catch (error) {
      // Error handling is done in parent or global handler
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Stack h="100%">
      <SimpleGrid cols={2} spacing="md" style={{ flex: 1, minHeight: 0 }}>
        <Stack h="100%">
          <Text fw={500}>Paste Text Soal di Sini:</Text>
          <Textarea 
            placeholder={`Format A (Suffix):
1. Ibukota Indonesia adalah...
a. Bandung
b. Jakarta ##
c. Surabaya

Format B (Answer Line):
1. Ibukota Indonesia adalah...
A. Bandung
B. Jakarta
ANSWER: B`}
            value={text}
            onChange={(e) => setText(e.currentTarget.value)}
            style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
            styles={{ wrapper: { flex: 1 }, input: { height: '100%' } }}
          />
        </Stack>

        <Stack h="100%" style={{ overflowY: 'auto' }}>
          <Group justify="space-between">
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

      <Group justify="flex-end">
        <Button variant="default" onClick={onCancel}>Batal</Button>
        <Button 
          onClick={handleSave} 
          disabled={errorCount > 0 || parsedQuestions.length === 0}
        >
          Simpan Semua ({parsedQuestions.length})
        </Button>
      </Group>
    </Stack>
  );
}
