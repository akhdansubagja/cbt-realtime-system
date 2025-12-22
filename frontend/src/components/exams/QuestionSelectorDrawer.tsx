import {
  Drawer,
  TextInput,
  Select,
  NumberInput,
  Button,
  Group,
  Stack,
  Text,
  Box,
  Paper,
  Badge,
  Image,
  Alert,
  Modal,
  ScrollArea,
} from "@mantine/core";
import { useDebouncedValue, useDisclosure } from "@mantine/hooks";
import { IconSearch, IconCheck, IconPhoto } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import api from "@/lib/axios";
import { DataTable } from "mantine-datatable";

interface Question {
  id: number;
  question_text: string;
  question_type: "multiple_choice" | "essay";
  image_url?: string;
  options?: { key: string; text: string }[];
  correct_answer?: string;
}

interface QuestionBank {
  value: string;
  label: string;
}

interface QuestionSelectorDrawerProps {
  opened: boolean;
  onClose: () => void;
  onAddQuestions: (
    questions: { question_id: number; point: number }[]
  ) => void;
  questionBanks: QuestionBank[];
  existingQuestionIds: number[];
}

const PAGE_SIZES = [10, 20, 50];

export function QuestionSelectorDrawer({
  opened,
  onClose,
  onAddQuestions,
  questionBanks,
  existingQuestionIds,
}: QuestionSelectorDrawerProps) {
  const [selectedBankId, setSelectedBankId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebouncedValue(searchQuery, 500);
  
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(false);
  const [totalRecords, setTotalRecords] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  
  const [selectedRecords, setSelectedRecords] = useState<Question[]>([]);
  const [defaultScore, setDefaultScore] = useState<number | string>(10);

  // Detail Modal State
  const [detailModalOpened, { open: openDetailModal, close: closeDetailModal }] = useDisclosure(false);
  const [selectedQuestionForDetail, setSelectedQuestionForDetail] = useState<Question | null>(null);

  // Reset state when drawer opens/closes
  useEffect(() => {
    if (opened) {
      setSelectedRecords([]);
    } else {
      setQuestions([]);
      setSelectedBankId(null);
      setSearchQuery("");
      setPage(1);
    }
  }, [opened]);

  // Fetch questions when bank/page/search changes
  useEffect(() => {
    if (!selectedBankId) {
      setQuestions([]);
      setTotalRecords(0);
      return;
    }

    setLoading(true);
    api
      .get(`/question-banks/${selectedBankId}/questions`, {
        params: { 
          page, 
          limit: pageSize,
          search: debouncedSearchQuery
        },
      })
      .then((res) => {
        setQuestions(res.data.data);
        setTotalRecords(res.data.total);
      })
      .catch(() => {
        setQuestions([]);
        setTotalRecords(0);
      })
      .finally(() => {
        setLoading(false);
      });
  }, [selectedBankId, page, pageSize, debouncedSearchQuery]);

  // Reset page when search or bank changes
  useEffect(() => {
    setPage(1);
  }, [selectedBankId, debouncedSearchQuery]);

  const handleAdd = () => {
    const questionsToAdd = selectedRecords.map((q) => ({
      question_id: q.id,
      point: typeof defaultScore === "number" ? defaultScore : 10,
    }));
    onAddQuestions(questionsToAdd);
    onClose();
    setSelectedRecords([]);
  };

  const handleRowClick = ({ record }: { record: Question }) => {
    setSelectedQuestionForDetail(record);
    openDetailModal();
  };

  return (
    <>
      <Drawer
        opened={opened}
        onClose={onClose}
        title="Pilih Soal dari Bank Soal"
        size="100%"
        position="right"
        styles={{
          body: {
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            padding: 0,
            overflow: 'hidden'
          }
        }}
      >
        <Stack gap={0} h="100%">
          {/* SECTION 1: Header (Filters) */}
          <Box p="md" style={{ borderBottom: '1px solid var(--mantine-color-gray-3)' }}>
            <Group grow>
              <Select
                label="Pilih Bank Soal"
                placeholder="Pilih bank soal"
                data={questionBanks}
                value={selectedBankId}
                onChange={setSelectedBankId}
                searchable
              />
              <TextInput
                label="Cari Soal"
                placeholder="Ketik kata kunci..."
                leftSection={<IconSearch size={16} />}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.currentTarget.value)}
                disabled={!selectedBankId}
              />
            </Group>
          </Box>

          {/* SECTION 2: Content (The Table) */}
          <Box style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
             <DataTable<Question>
                withTableBorder
                withColumnBorders={false}
                borderRadius="lg"
                shadow="sm"
                striped
                highlightOnHover
                verticalSpacing="xs"
                records={questions}
                totalRecords={totalRecords}
                recordsPerPage={pageSize}
                page={page}
                onPageChange={setPage}
                recordsPerPageOptions={PAGE_SIZES}
                onRecordsPerPageChange={(size) => {
                  setPageSize(size);
                  setPage(1);
                }}
                selectedRecords={selectedRecords}
                onSelectedRecordsChange={setSelectedRecords}
                fetching={loading}
                minHeight={0}
                scrollAreaProps={{ type: 'scroll', offsetScrollbars: true }}
                columns={[
                  {
                    accessor: 'index',
                    title: 'No',
                    width: 60,
                    render: (_, index) => (page - 1) * pageSize + index + 1,
                  },
                  {
                    accessor: 'question_text',
                    title: 'Soal',
                    render: (record) => (
                      <Text size="sm" lineClamp={1}>
                        {record.question_text}
                      </Text>
                    )
                  }
                ]}
                onRowClick={handleRowClick}
                noRecordsText={selectedBankId ? "Tidak ada soal ditemukan" : "Pilih bank soal terlebih dahulu"}
             />
          </Box>

          {/* SECTION 3: Footer (Actions) */}
          <Paper p="md" shadow="xl" withBorder style={{ zIndex: 10 }}>
            <Group justify="space-between">
              <NumberInput
                label="Poin Default"
                description="Poin untuk soal yang baru dipilih"
                value={defaultScore}
                onChange={setDefaultScore}
                min={0}
                w={200}
              />
              <Button onClick={handleAdd} disabled={selectedRecords.length === 0}>
                Tambahkan {selectedRecords.length} Soal Terpilih
              </Button>
            </Group>
          </Paper>
        </Stack>
      </Drawer>

      <Modal
        opened={detailModalOpened}
        onClose={closeDetailModal}
        title="Detail Soal"
        size="lg"
        centered
      >
        {selectedQuestionForDetail && (
          <Stack>
            {selectedQuestionForDetail.image_url && (
              <Box>
                <Text fw={500} mb="xs">Gambar:</Text>
                <Image
                  src={`${process.env.NEXT_PUBLIC_API_URL}${selectedQuestionForDetail.image_url}`}
                  alt="Gambar Soal"
                  radius="md"
                  fit="contain"
                  mah={300}
                />
              </Box>
            )}
            
            <Box>
              <Text fw={500} mb="xs">Pertanyaan:</Text>
              <Paper withBorder p="md" bg="light-dark(var(--mantine-color-gray-0), var(--mantine-color-dark-6))">
                <Text>{selectedQuestionForDetail.question_text}</Text>
              </Paper>
            </Box>

            <Group>
              <Badge color={selectedQuestionForDetail.question_type === 'multiple_choice' ? 'blue' : 'orange'}>
                {selectedQuestionForDetail.question_type === 'multiple_choice' ? 'Pilihan Ganda' : 'Esai'}
              </Badge>
            </Group>

            {selectedQuestionForDetail.question_type === 'multiple_choice' && selectedQuestionForDetail.options && (
              <Box>
                <Text fw={500} mb="xs">Pilihan Jawaban:</Text>
                <Stack gap="xs">
                  {selectedQuestionForDetail.options.map((opt) => (
                    <Group key={opt.key} align="flex-start" wrap="nowrap">
                      <Badge 
                        variant={opt.key === selectedQuestionForDetail.correct_answer ? "filled" : "outline"}
                        color={opt.key === selectedQuestionForDetail.correct_answer ? "green" : "gray"}
                        size="lg"
                        circle
                      >
                        {opt.key}
                      </Badge>
                      <Text style={{ flex: 1 }}>{opt.text}</Text>
                    </Group>
                  ))}
                </Stack>
                {selectedQuestionForDetail.correct_answer && (
                   <Alert color="green" title="Kunci Jawaban" mt="md" icon={<IconCheck size={16}/>}>
                      Jawaban Benar: {selectedQuestionForDetail.correct_answer}
                   </Alert>
                )}
              </Box>
            )}
          </Stack>
        )}
      </Modal>
    </>
  );
}
