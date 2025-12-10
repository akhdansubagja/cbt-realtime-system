import { useState, useEffect, useRef } from "react";
import {
  Group,
  Button,
  Textarea,
  Box,
  Text,
  Stack,
  Paper,
  Avatar,
  SimpleGrid,
  Divider,
  FileInput,
  Center,
  Badge,
  ScrollArea,
  ActionIcon,
} from "@mantine/core";
import { Batch } from "@/types/batch";
import {
  IconPhoto,
  IconTrash,
  IconUser,
  IconUpload,
  IconFilePlus,
  IconCamera,
  IconRefresh,
} from "@tabler/icons-react";
import { Dropzone, IMAGE_MIME_TYPE } from "@mantine/dropzone";
import { notifications } from "@mantine/notifications";
import { saveDraft, loadDraft, deleteDraft } from "@/lib/indexed-db";
import { Select } from "@mantine/core";

interface ParsedExaminee {
  id: string; // temp id for key
  index: number; // real line index
  name: string;
  imageFile?: File;
  imagePreviewUrl?: string; // Derived from indexed db or active file
  source: "text" | "image"; // Track origin for UX
}

interface DraftData {
  text: string;
  files: Record<number, File>; // Key = index
  batchId?: string | null;
}

interface QuickExamineeImportPanelProps {
  batchId?: string | number | null;
  batches?: Batch[];
  onSave: (formData: FormData) => Promise<void>;
  onCancel: () => void;
}

export function QuickExamineeImportPanel({
  batchId: initialBatchId,
  batches = [],
  onSave,
  onCancel,
}: QuickExamineeImportPanelProps) {
  const storageKey = `draft-examinee-import-v2`; // bumping version due to schema change

  const [text, setText] = useState("");
  // separate state for files: key is LINE INDEX
  const [attachedFiles, setAttachedFiles] = useState<Record<number, File>>({});
  const [selectedBatch, setSelectedBatch] = useState<string | null>(
    initialBatchId ? String(initialBatchId) : null
  );

  const [cards, setCards] = useState<ParsedExaminee[]>([]);
  const [isSaving, setIsSaving] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Hidden input refs
  const bulkInputRef = useRef<HTMLInputElement>(null);
  const manualInputRef = useRef<HTMLInputElement>(null);
  const activeManualIndex = useRef<number | null>(null);

  const previewUrlsRef = useRef<string[]>([]);
  const createPreview = (file: File) => {
    const url = URL.createObjectURL(file);
    previewUrlsRef.current.push(url);
    return url;
  };

  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  // 1. Load Draft
  useEffect(() => {
    const init = async () => {
      const draft = await loadDraft<DraftData>(storageKey);
      if (draft) {
        if (draft.text) setText(draft.text);
        if (draft.files) setAttachedFiles(draft.files);
        if (draft.batchId) setSelectedBatch(draft.batchId);
      }
      setIsDraftLoaded(true);
    };
    init();
  }, [storageKey]);

  // 2. Parse Text -> Cards
  // Re-runs whenever text changes OR attachedFiles changes
  useEffect(() => {
    // Basic lines
    let lines = text.split("\n").map((l) => l.trim());
    // Remove empty trailing lines, but keep empty middle lines to preserve index alignment?
    // UX Decision: User might leave empty lines. If we filter empties, indices shift.
    // User requirement: "Keep attachedFiles[5] as is".
    // So we must respect NEWLINES strictly.

    const newCards: ParsedExaminee[] = lines
      .map((line, index) => {
        const cleanName = line.replace(/^(\d+[\.\)]|\*|-)\s*/, "").trim();
        const file = attachedFiles[index];

        // Skip completely empty lines for preview?
        // Or show them as "Empty Row"?
        // Let's filter empties out of the *Preview*, but we need to track their original index
        // to map the file correctly.
        return {
          id: `line-${index}`,
          index: index, // keep tracking real index
          name: cleanName,
          imageFile: file,
          imagePreviewUrl: file ? createPreview(file) : undefined,
          source: (file ? "image" : "text") as "image" | "text",
        };
      })
      .filter((c) => c.name.length > 0);

    setCards(newCards);
  }, [text, attachedFiles]);

  // 3. Auto-Save
  useEffect(() => {
    if (!isDraftLoaded) return;
    const timer = setTimeout(async () => {
      const isTextEmpty = !text || text.trim() === "";
      const isFilesEmpty = Object.keys(attachedFiles).length === 0;

      if (isTextEmpty && isFilesEmpty) {
        await deleteDraft(storageKey);
      } else {
        await saveDraft(storageKey, {
          text,
          files: attachedFiles,
          batchId: selectedBatch,
        });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [text, attachedFiles, selectedBatch, isDraftLoaded, storageKey]);

  const processFiles = (files: File[]) => {
    let currentTextLines = text.split("\n"); // raw lines
    if (text === "") currentTextLines = [];

    const updates: Record<number, File> = {};
    const newNames: string[] = [];
    const newFilesForAppend: File[] = [];

    files.forEach((file) => {
      const name = file.name.replace(/\.[^/.]+$/, "").replace(/[_-]/g, " ");

      let matchedIndex = -1;
      // Find IN EXISTING
      currentTextLines.forEach((line, idx) => {
        const cleanLine = line.replace(/^(\d+[\.\)]|\*|-)\s*/, "").trim();
        if (cleanLine.toLowerCase() === name.toLowerCase()) {
          matchedIndex = idx;
        }
      });

      if (matchedIndex !== -1) {
        updates[matchedIndex] = file;
      } else {
        newNames.push(name);
        newFilesForAppend.push(file);
      }
    });

    // Apply updates to existing
    setAttachedFiles((prev) => {
      const next = { ...prev, ...updates };

      // Apply new appends
      if (newNames.length > 0) {
        let baseIndex = currentTextLines.length; // Start index for new items
        newFilesForAppend.forEach((f, i) => {
          next[baseIndex + i] = f;
        });
      }
      return next;
    });

    if (newNames.length > 0) {
      const prefix =
        text && text.length > 0 && !text.endsWith("\n") ? "\n" : "";
      setText((prev) => prev + prefix + newNames.join("\n"));
      notifications.show({
        title: "Imported",
        message: `Added ${newNames.length} new participants`,
        color: "blue",
      });
    } else {
      notifications.show({
        title: "Updated",
        message: `Updated ${Object.keys(updates).length} existing participants`,
        color: "teal",
      });
    }
  };

  const handleManualUploadClick = (index: number) => {
    activeManualIndex.current = index;
    if (manualInputRef.current) manualInputRef.current.click();
  };

  const handleManualFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const idx = activeManualIndex.current;
    if (file && idx !== null) {
      setAttachedFiles((prev) => ({
        ...prev,
        [idx]: file,
      }));
      createPreview(file); // preload for cache
    }
    // reset
    if (manualInputRef.current) manualInputRef.current.value = "";
    activeManualIndex.current = null;
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const formData = new FormData();
      const jsonData: { name: string; fileIndex?: number }[] = [];

      if (selectedBatch) {
        formData.append("batch_id", selectedBatch);
      }

      let fileCounter = 0;

      // Use 'checkbox' approach or 'cards' approach?
      // We rely on 'cards' to know valid lines, but 'attachedFiles' to get images.
      // Note: 'cards' filters out empty lines.

      cards.forEach((c) => {
        const item: { name: string; fileIndex?: number } = { name: c.name };
        // 'c.index' is the original line number.
        const file = attachedFiles[c.index]; // @ts-ignore

        if (file) {
          formData.append("avatars", file);
          item.fileIndex = fileCounter;
          fileCounter++;
        }
        jsonData.push(item);
      });

      formData.append("data", JSON.stringify(jsonData));

      await onSave(formData);

      await deleteDraft(storageKey);
      setText("");
      setAttachedFiles({});
      onCancel();
    } catch (e) {
      console.error(e);
    } finally {
      setIsSaving(false);
    }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const newText = e.target.value;
    setText(newText);

    // Bug Fix: Prune orphan images
    const lineCount = newText
      .split("\n")
      .filter((line) => line.trim() !== "").length;
    // Actually we are using raw lines for indexing, so just split length is safer to match index logic?
    // Code uses: let lines = text.split("\n").map(l => l.trim());
    // And const newCards ... lines.map((line, index) => ...
    // So the index corresponds to raw lines split by \n.
    // If user deletes a newline, the total raw lines decrease.
    const rawLineCount = newText.split("\n").length;

    setAttachedFiles((prev) => {
      // If text is totally empty, clear everything
      if (!newText.trim()) return {};

      const next = { ...prev };
      Object.keys(next).forEach((key) => {
        // If this image belongs to a line number that no longer exists, delete it
        if (Number(key) >= rawLineCount) {
          delete next[Number(key)];
        }
      });
      return next;
    });
  };

  const handleReset = async () => {
    setText("");
    setAttachedFiles({});
    setSelectedBatch(null);
    await deleteDraft(storageKey);
    // notifications.show({
    //   title: "Reset",
    //   message: "All data cleared",
    //   color: "blue",
    // });
  };

  return (
    <Stack h="100%">
      {/* Hidden Inputs */}
      <input
        type="file"
        ref={bulkInputRef}
        multiple
        accept="image/*"
        style={{ display: "none" }}
        onChange={(e) => {
          if (e.target.files) processFiles(Array.from(e.target.files));
          // reset value so same files can be selected again if needed
          e.target.value = "";
        }}
      />
      <input
        type="file"
        ref={manualInputRef}
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleManualFileChange}
      />

      {/* Header Controls */}
      <Group>
        <Select
          placeholder="Pilih Batch (Opsional)"
          data={batches.map((b) => ({ value: String(b.id), label: b.name }))}
          value={selectedBatch}
          onChange={setSelectedBatch}
          searchable
          clearable
          style={{ flex: 1 }}
          leftSection={<IconUser size={16} />}
        />
        <Button
          variant="light"
          leftSection={<IconFilePlus size={16} />}
          onClick={() => bulkInputRef.current?.click()}
        >
          Pilih Foto Massal
        </Button>

      </Group>

      <Divider />

      <Dropzone
        onDrop={processFiles}
        onReject={() =>
          notifications.show({
            title: "Error",
            message: "File rejected",
            color: "red",
          })
        }
        maxSize={5 * 1024 ** 2}
        accept={IMAGE_MIME_TYPE}
        activateOnClick={false}
        style={{ flex: 1, display: "flex", flexDirection: "column" }}
        styles={{
          inner: { flex: 1, display: "flex", flexDirection: "column" },
        }}
      >
        <SimpleGrid cols={2} spacing="md" style={{ flex: 1, minHeight: 0 }}>
          <Stack h="100%">
            <Group justify="space-between">
              <Text fw={500}>Daftar Nama</Text>
            </Group>
            <Textarea
              placeholder={`Budi Santoso
Siti Hasanah
Bagaskara`}
              value={text}
              onChange={handleTextChange}
              style={{ flex: 1, display: "flex", flexDirection: "column" }}
              styles={{
                wrapper: { flex: 1 },
                input: { height: "100%", fontFamily: "monospace" },
              }}
            />
          </Stack>

          <Stack h="100%" style={{ overflowY: "hidden" }}>
            <Text fw={500}>Preview ({cards.length})</Text>
            <ScrollArea style={{ flex: 1 }} type="auto">
              <Stack gap="sm" pb="md">
                {cards.length === 0 && (
                  <Text c="dimmed" ta="center" mt="xl">
                    Belum ada data preview
                  </Text>
                )}
                {cards.map((card) => (
                  <Paper key={card.id} p="xs" withBorder radius="md">
                    <Group>
                      <Avatar
                        src={card.imagePreviewUrl}
                        radius="xl"
                        size="md"
                        color="initials"
                      >
                        {card.name.charAt(0)}
                      </Avatar>
                      <Box style={{ flex: 1 }}>
                        <Text size="sm" fw={500}>
                          {card.name}
                        </Text>
                        <Group gap={5}>
                          <Badge
                            size="xs"
                            variant="light"
                            color={card.imageFile ? "green" : "gray"}
                          >
                            {card.imageFile ? "Ada Foto" : "Tanpa Foto"}
                          </Badge>
                          <Text size="xs" c="dimmed">
                            Line {card.index + 1}
                          </Text>
                        </Group>
                      </Box>

                      {/* Manual Upload Button Per Card */}
                      <ActionIcon
                        variant="light"
                        color={card.imageFile ? "yellow" : "blue"}
                        onClick={() => handleManualUploadClick(card.index)}
                        title={card.imageFile ? "Ganti Foto" : "Upload Foto"}
                      >
                        {card.imageFile ? (
                          <IconUpload size={16} />
                        ) : (
                          <IconCamera size={16} />
                        )}
                      </ActionIcon>

                      {card.imageFile && (
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => {
                            setAttachedFiles((prev) => {
                              const next = { ...prev };
                              delete next[card.index];
                              return next;
                            });
                          }}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      )}
                    </Group>
                  </Paper>
                ))}
              </Stack>
            </ScrollArea>
          </Stack>
        </SimpleGrid>
      </Dropzone>

      <Divider />
      <Group justify="space-between">
        <Button
            variant="light"
            color="red"
            leftSection={<IconRefresh size={16} />}
            onClick={handleReset}
        >
            Reset
        </Button>
        <Group>
            <Button variant="default" onClick={onCancel}>
            Batal
            </Button>
            <Button
            onClick={handleSave}
            loading={isSaving}
            disabled={cards.length === 0}
            >
            Simpan ({cards.length})
            </Button>
        </Group>
      </Group>
    </Stack>
  );
}
