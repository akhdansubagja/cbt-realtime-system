'use client';

import {
  Alert,
  Center,
  Button,
  Group,
  Text,
  Modal,
  TextInput,
  Pagination,
  Select,
  Avatar,
  FileInput,
  Image,
  rem,
  Menu,
  Skeleton,
  Switch,
  Badge,
  Stack,
  ActionIcon,
  Flex,
  Box,
  Kbd,
} from "@mantine/core";
import { useDisclosure, useHotkeys } from "@mantine/hooks";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import api from "@/lib/axios";
import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { DataTable, type DataTableSortStatus } from "mantine-datatable";
import {
  IconEdit,
  IconTrash,
  IconSearch,
  IconPlus,
  IconEye,
  IconDotsVertical,
  IconPencil,
  IconFilter,
  IconCheck,
  IconX,
} from "@tabler/icons-react";
import { useRouter } from "next/navigation";
import sortBy from "lodash/sortBy";
import dayjs from "dayjs";
import { Batch } from "@/types/batch";
import { confirmDelete, showSuccessAlert } from "@/lib/swal";
import { PageHeader } from "@/components/layout/PageHeader";
import { useUserPreferences } from "@/context/UserPreferencesContext";
import { QuickExamineeImportPanel } from "@/components/examinees/QuickExamineeImportPanel";
import { ExamineeFormModal } from "@/components/examinees/ExamineeFormModal";

import { Examinee } from "@/types/examinee";

export default function ExamineesPage() {
  const [examinees, setExaminees] = useState<Examinee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [batches, setBatches] = useState<Batch[]>([]);
  const [opened, { open, close }] = useDisclosure(false);
  const [editingExaminee, setEditingExaminee] = useState<Examinee | null>(null);
  const [activePage, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { pageSize, setPageSize, PAGE_SIZES } = useUserPreferences();
  const [query, setQuery] = useState("");
  const [sortStatus, setSortStatus] = useState<DataTableSortStatus<Examinee>>({
    columnAccessor: "name",
    direction: "asc",
  });
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const searchInputRef = useRef<HTMLInputElement>(null);

  const [selectedBatchFilter, setSelectedBatchFilter] = useState<string | null>(
    null
  );
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string | null>(
    null
  );

  const [selectedRecords, setSelectedRecords] = useState<Examinee[]>([]);

  const router = useRouter();

  const [imageModalOpened, { open: openImageModal, close: closeImageModal }] =
    useDisclosure(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  const [quickImportOpened, { open: openQuickImport, close: closeQuickImport }] = useDisclosure(false);

  const handleQuickImportSave = async (formData: FormData) => {
      try {
          await api.post("/examinees/bulk-with-avatars", formData, {
              headers: { "Content-Type": "multipart/form-data" },
          });
          notifications.show({
            title: "Success",
            message: "Bulk import completed successfully",
            color: "teal",
          });
          fetchExaminees();
          closeQuickImport();
      } catch (err: any) {
          notifications.show({
             title: "Error",
             message: err.response?.data?.message || "Failed to import",
             color: "red"
          });
      }
  };



  const fetchBatches = async () => {
    try {
      const response = await api.get("/batches");
      setBatches(response.data);
    } catch (err) {
      console.error("Gagal mengambil data batch untuk dropdown");
    }
  };

  const fetchExaminees = async (
    page = activePage,
    search = debouncedQuery,
    batchId = selectedBatchFilter,
    status = selectedStatusFilter
  ) => {
    try {
      setLoading(true);
      let url = `/examinees?page=${page}&limit=${pageSize}&search=${search}`;
      if (batchId) {
        url += `&batch_id=${batchId}`;
      }
      if (status) {
        url += `&is_active=${status}`;
      }

      const response = await api.get(url);
      setExaminees(response.data.data);
      setTotalPages(response.data.last_page);
    } catch (err) {
      setError("Gagal mengambil data peserta.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExaminees();
  }, [activePage, debouncedQuery, pageSize, selectedBatchFilter, selectedStatusFilter]);

  useEffect(() => {
    setPage(1);
  }, [pageSize]);

  useEffect(() => {
    fetchBatches();
  }, []);

  useHotkeys([["/", () => searchInputRef.current?.focus()]]);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 500);

    return () => {
      clearTimeout(handler);
    };
  }, [query]);

  const openEditModal = (examinee: Examinee) => {
    setEditingExaminee(examinee);
    open();
  };

  // --- LOGIKA BARU: TOGGLE STATUS ---
  const handleStatusToggle = async (examinee: Examinee) => {
    // Optimistic update
    const newStatus = !examinee.is_active;
    setExaminees((current) =>
      current.map((e) =>
        e.id === examinee.id ? { ...e, is_active: newStatus } : e
      )
    );

    try {
      // Kita gunakan endpoint bulk untuk update satu item juga, atau endpoint update biasa
      // Tapi karena kita belum update endpoint update biasa untuk handle is_active secara eksplisit (walaupun DTO mungkin handle),
      // lebih aman pakai bulk endpoint yang baru kita buat.
      await api.patch("/examinees/bulk/status", {
        ids: [examinee.id],
        is_active: newStatus,
      });
      
      notifications.show({
        title: "Status Diperbarui",
        message: `Peserta ${examinee.name} sekarang ${newStatus ? "Aktif" : "Tidak Aktif"}`,
        color: "teal",
        position: "bottom-center",
      });
    } catch (err) {
      // Revert jika gagal
      setExaminees((current) =>
        current.map((e) =>
          e.id === examinee.id ? { ...e, is_active: !newStatus } : e
        )
      );
      notifications.show({
        title: "Gagal",
        message: "Gagal memperbarui status.",
        color: "red",
      });
    }
  };

  // --- LOGIKA BARU: BULK STATUS ---
  const handleBulkStatusUpdate = async (isActive: boolean) => {
    const count = selectedRecords.length;
    if (count === 0) return;

    try {
      await api.patch("/examinees/bulk/status", {
        ids: selectedRecords.map((r) => r.id),
        is_active: isActive,
      });

      // Update local state
      setExaminees((current) =>
        current.map((e) =>
          selectedRecords.some((r) => r.id === e.id)
            ? { ...e, is_active: isActive }
            : e
        )
      );
      
      setSelectedRecords([]); // Clear selection

      notifications.show({
        title: "Berhasil",
        message: `${count} peserta berhasil di-${isActive ? "aktifkan" : "nonaktifkan"}.`,
        color: "teal",
      });
    } catch (err) {
      notifications.show({
        title: "Gagal",
        message: "Gagal memperbarui status massal.",
        color: "red",
      });
    }
  };

  const handleBulkDelete = async () => {
    const count = selectedRecords.length;
    const result = await confirmDelete(
      `Hapus ${count} Peserta?`,
      "Data yang dipilih akan dihapus permanen beserta avatarnya."
    );

    if (result.isConfirmed) {
      try {
        const deletePromises = selectedRecords.map((item) =>
          api.delete(`/examinees/${item.id}`)
        );

        await Promise.all(deletePromises);

        await showSuccessAlert("Berhasil!", `${count} peserta telah dihapus.`);

        setSelectedRecords([]);
        fetchExaminees();
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Terjadi kesalahan saat menghapus beberapa data.",
          color: "red",
        });
      }
    }
  };

  const handleDeleteExaminee = async (examineeId: number) => {
    const result = await confirmDelete(
      "Hapus Peserta?",
      "Peserta ini akan dihapus permanen dari sistem."
    );

    if (result.isConfirmed) {
      try {
        await api.delete(`/examinees/${examineeId}`);
        setExaminees((current) => current.filter((e) => e.id !== examineeId));
        await showSuccessAlert("Terhapus!", "Data peserta berhasil dihapus.");
      } catch (err) {
        notifications.show({
          title: "Gagal",
          message: "Terjadi kesalahan saat menghapus peserta.",
          color: "red",
        });
      }
    }
  };



  const handleAvatarClick = (imageUrl: string | null) => {
    if (imageUrl) {
      setSelectedImage(`${process.env.NEXT_PUBLIC_API_URL}/${imageUrl}`);
      openImageModal();
    }
  };



  return (
    <>
      <Modal
        opened={imageModalOpened}
        onClose={closeImageModal}
        title="Lihat Avatar"
        centered
        size="lg"
      >
        <Image src={selectedImage} alt="Avatar Peserta" />
      </Modal>

      <ExamineeFormModal
        opened={opened}
        onClose={() => {
          close();
          setEditingExaminee(null);
        }}
        onSuccess={fetchExaminees}
        initialExaminee={editingExaminee}
        batches={batches}
      />

      <Modal 
         opened={quickImportOpened} 
         onClose={closeQuickImport} 
         title="Tambah Peserta" 
         size="xl" 
         padding={0} // Full space
         styles={{ body: { height: '500px' } }}
      >
         <Box p="md" h="100%">
             <QuickExamineeImportPanel 
                batchId={selectedBatchFilter}
                batches={batches}
                onSave={handleQuickImportSave}
                onCancel={closeQuickImport}
             />
         </Box>
      </Modal>

      <Stack>
        <PageHeader
          title="Manajemen Peserta"
          breadcrumbs={[
            { label: "Admin", href: "/admin/dashboard" },
            { label: "Manajemen Peserta", href: "/admin/examinees" },
          ]}
          actions={
            <Group>
              {selectedRecords.length > 0 && (
                <>
                  <Button
                    color="green"
                    leftSection={<IconCheck size={16} />}
                    onClick={() => handleBulkStatusUpdate(true)}
                  >
                    Aktifkan ({selectedRecords.length})
                  </Button>
                  <Button
                    color="orange"
                    leftSection={<IconX size={16} />}
                    onClick={() => handleBulkStatusUpdate(false)}
                  >
                    Nonaktifkan ({selectedRecords.length})
                  </Button>
                  <Button
                    color="red"
                    leftSection={<IconTrash size={16} />}
                    onClick={handleBulkDelete}
                  >
                    Hapus ({selectedRecords.length})
                  </Button>
                </>
              )}
               <Button
                 leftSection={<IconPlus size={16} />}
                 onClick={openQuickImport}
               >
                 Tambah Peserta
               </Button>
            </Group>
          }
        />

        <Group align="end" grow>
          <TextInput
            style={{ flex: 2 }}
            ref={searchInputRef}
            placeholder="Cari nama peserta..."
            leftSection={<IconSearch size={16} />}
            rightSection={<Kbd>/</Kbd>}
            value={query}
            onChange={(e) => setQuery(e.currentTarget.value)}
            label="Pencarian"
          />

          <Select
            style={{ flex: 1 }}
            label="Filter berdasarkan Batch"
            placeholder="Semua Batch"
            data={batches.map((b) => ({ value: String(b.id), label: b.name }))}
            value={selectedBatchFilter}
            onChange={setSelectedBatchFilter}
            clearable
            leftSection={<IconFilter size={16} />}
          />

          <Select
            style={{ flex: 1 }}
            label="Filter Status"
            placeholder="Semua Status"
            data={[
              { value: "true", label: "Aktif" },
              { value: "false", label: "Tidak Aktif" },
            ]}
            value={selectedStatusFilter}
            onChange={setSelectedStatusFilter}
            clearable
            leftSection={<IconFilter size={16} />}
          />
        </Group>

        <Box>
          {loading && examinees.length === 0 ? (
            <Stack>
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} height={50} radius="sm" />
              ))}
            </Stack>
          ) : error ? (
            <Alert color="red" title="Error">
              {error}
            </Alert>
          ) : (
            <DataTable<Examinee>
              withTableBorder
              withColumnBorders={false}
              borderRadius="lg"
              shadow="sm"
              striped
              highlightOnHover
              rowStyle={() => ({ cursor: "pointer" })}
              onRowClick={({ record: examinee }) => {
                router.push(`/admin/examinees/${examinee.id}`);
              }}
              minHeight={200}
              records={examinees}
              selectedRecords={selectedRecords}
              onSelectedRecordsChange={setSelectedRecords}
              isRecordSelectable={(record) => true}
              idAccessor="id"
              fetching={loading}
              columns={[
                {
                  accessor: "avatar_url",
                  title: "Avatar",
                  width: 80,
                  render: (examinee) => (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Avatar
                        src={
                          examinee.avatar_url
                            ? `${process.env.NEXT_PUBLIC_API_URL}/${examinee.avatar_url}`
                            : null
                        }
                        radius="xl"
                        onClick={() => handleAvatarClick(examinee.avatar_url)}
                        style={{
                          cursor: examinee.avatar_url ? "pointer" : "default",
                        }}
                      >
                        {examinee.name.charAt(0)}
                      </Avatar>
                    </Box>
                  ),
                },
                { 
                  accessor: "name", 
                  title: "Nama Peserta", 
                  sortable: true,
                  render: (record) => (
                    <Stack gap={0}>
                      <Text size="sm" fw={500}>{record.name}</Text>
                      <Text size="xs" c="dimmed" style={{ fontFamily: 'monospace' }}>
                        {record.uniqid || '-'}
                      </Text>
                    </Stack>
                  )
                },
                {
                  accessor: "batch",
                  title: "Batch",
                  sortable: false,
                  render: (examinee) =>
                    examinee.batch?.name || <Text c="dimmed">N/A</Text>,
                },
                {
                  accessor: "is_active",
                  title: "Status",
                  sortable: false,
                  width: 100,
                  render: (examinee) => (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Switch
                        checked={examinee.is_active}
                        onChange={() => handleStatusToggle(examinee)}
                        color="teal"
                        size="md"
                        onLabel="AKTIF"
                        offLabel="NONAKTIF"
                      />
                    </Box>
                  ),
                },
                {
                  accessor: "created_at",
                  title: "Tanggal Didaftarkan",
                  sortable: false,
                  render: (record) =>
                    dayjs(record.created_at).format("DD MMM YYYY"),
                },
                {
                  accessor: "actions",
                  title: "",
                  textAlign: "right",
                  render: (examinee) => (
                    <Box onClick={(e) => e.stopPropagation()}>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" color="gray">
                            <IconDotsVertical size={16} />
                          </ActionIcon>
                        </Menu.Target>

                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEye size={14} />}
                            onClick={() =>
                              router.push(`/admin/examinees/${examinee.id}`)
                            }
                          >
                            Lihat Riwayat
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconPencil size={14} />}
                            color="yellow"
                            onClick={() => openEditModal(examinee)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => handleDeleteExaminee(examinee.id)}
                          >
                            Hapus
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Box>
                  ),
                },
              ]}
              sortStatus={sortStatus}
              onSortStatusChange={setSortStatus}
              totalRecords={totalPages * pageSize}
              recordsPerPage={pageSize}
              page={activePage}
              onPageChange={(p) => setPage(p)}
              recordsPerPageOptions={PAGE_SIZES}
              onRecordsPerPageChange={setPageSize}
              paginationText={({ from, to, totalRecords }) =>
                `${from} - ${to} dari ${totalRecords}`
              }
              noRecordsText="Tidak ada data untuk ditampilkan"
            />
          )}
        </Box>
      </Stack>
    </>
  );
}
