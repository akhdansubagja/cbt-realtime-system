"use client";

import {
  Button,
  Group,
  Stack,
  Text,
  Box,
  LoadingOverlay,
  Modal,
  TextInput,
} from "@mantine/core";
import { useEffect, useState, useRef } from "react";
import { BatchParticipantReportData } from "@/types/batchParticipantReport";
import { Batch } from "@/types/batch";
import { IconDownload, IconEdit } from "@tabler/icons-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "@/lib/axios";
import { notifications } from "@mantine/notifications";
import { useParams } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";

export default function BatchReportPage() {
  const params = useParams();
  const batchId = params.batchId as string;

  const [data, setData] = useState<BatchParticipantReportData | null>(null);
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);

  // Editable headers state
  const [header1, setHeader1] = useState("DAFTAR PENILAIAN SISWA/I TIK");
  const [header2, setHeader2] = useState("APBD ANGKATAN KE-3");
  const [header3, setHeader3] = useState("");
  const [editOpened, { open: openEdit, close: closeEdit }] = useDisclosure(false); 

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (batchId) {
      fetchAllData();
    }
  }, [batchId]);

  useEffect(() => {
    if (batch) {
        setHeader3(batch.name || "");
    }
  }, [batch]);

  const fetchAllData = async () => {
    try {
      setLoading(true);
      const [reportRes, batchRes] = await Promise.all([
        api.get(`/reports/batch-participants/${batchId}`),
        api.get(`/batches/${batchId}`),
      ]);
      setData(reportRes.data);
      setBatch(batchRes.data);
    } catch (err) {
      console.error(err);
      notifications.show({
        title: "Error",
        message: "Gagal mengambil data laporan",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleExportPDF = async () => {
    if (!printRef.current || !batch) return;

    try {
      setExporting(true);
      const element = printRef.current;

      // Gunakan html2canvas untuk menangkap tampilan elemen
      const canvas = await html2canvas(element, {
        scale: 2, // Tingkatkan kualitas
        useCORS: true, // Izinkan gambar lintas domain (misalnya avatar)
        backgroundColor: "#ffffff", // Pastikan background putih
        windowWidth: element.scrollWidth,
        windowHeight: element.scrollHeight,
      });

      const imgData = canvas.toDataURL("image/png");

      // Ukuran Custom 320 x 480 mm
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [320, 480],
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
      pdf.save(`Laporan_${batch.name.replace(/\s+/g, "_")}.pdf`);

      notifications.show({
        title: "Berhasil",
        message: "Laporan berhasil diekspor ke PDF",
        color: "teal",
      });
    } catch (err) {
      console.error("PDF Export Error:", err);
      notifications.show({
        title: "Gagal",
        message: "Gagal membuat PDF",
        color: "red",
      });
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <LoadingOverlay visible={true} />;
  if (!data || !batch) return <Text>Data tidak ditemukan</Text>;

  const examColumns = [1, 2, 3, 4, 5, 6];

  return (
    <Stack h="100vh" gap={0} bg="#f1f3f5">
      <Modal opened={editOpened} onClose={closeEdit} title="Edit Header Laporan">
        <Stack>
            <TextInput label="Header 1" value={header1} onChange={(e) => setHeader1(e.target.value)} />
            <TextInput label="Header 2" value={header2} onChange={(e) => setHeader2(e.target.value)} />
            <TextInput label="Header 3" value={header3} onChange={(e) => setHeader3(e.target.value)} />
            <Button onClick={closeEdit}>Simpan</Button>
        </Stack>
      </Modal>

      {/* Toolbar */}
      <Box p="md" bg="white" style={{ borderBottom: '1px solid #eee' }}>
        <Group justify="space-between">
            <Text size="sm" c="dimmed">
                Halaman ini khusus untuk mencetak laporan.
            </Text>
            <Group>
              <Button leftSection={<IconEdit size={16} />} onClick={openEdit} variant="outline">
                  Edit Header
              </Button>
              <Button
                  leftSection={<IconDownload size={16} />}
                  onClick={handleExportPDF}
                  loading={exporting}
                  color="red"
              >
                  Download PDF
              </Button>
            </Group>
        </Group>
      </Box>

      {/* Main Content Area - Scrollable */}
      <Box style={{ flex: 1, overflow: 'auto', padding: '2rem', display: 'flex', justifyContent: 'center' }}>
        
          {/* AREA YANG AKAN DI-PRINT */}
          <div
            ref={printRef}
            style={{
              width: "320mm",
              minHeight: "480mm",
              backgroundColor: "white", 
              position: "relative",
              fontFamily: "Arial, sans-serif",
              color: "#000",
              display: "flex",
              flexDirection: "column",
              boxShadow: "0 0 10px rgba(0,0,0,0.1)" // Shadow agar terlihat seperti kertas di atas background abu
            }}
          >
            {/* HEADER BIRU GELAP */}
            <div
              style={{
                backgroundColor: "#103c6b",
                color: "white",
                padding: "40px 20px 20px 20px",
                textAlign: "center",
                borderBottomLeftRadius: "50% 20px",
                borderBottomRightRadius: "50% 20px",
                marginBottom: "20px",
                position: "relative",
                zIndex: 2,
              }}
            >
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "5px",
                  alignItems: "center",
                }}
              >
                {/* INPUTS HEADER STATIC TEXT */}
                <div
    style={{
        color: "white",
        fontSize: "24pt",
        fontWeight: "bold",
        textAlign: "center",
        width: "100%",
        textTransform: "uppercase",
        marginBottom: "5px",
        lineHeight: 1.2,
        textShadow: `
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000
        `
    }}
>
    {header1}
</div>
                <div
    style={{
        color: "white",
        fontSize: "20pt",
        fontWeight: "bold",
        textAlign: "center",
        width: "100%",
        textTransform: "uppercase",
        lineHeight: 1.2,
        textShadow: `
            -1px -1px 0 #000,
            1px -1px 0 #000,
            -1px 1px 0 #000,
            1px 1px 0 #000
        `
    }}
>
    {header2}
</div>
                
                <div
                  style={{
                    backgroundColor: "white",
                    color: "#000000ff",
                    padding: "5px 20px",
                    borderRadius: "20px",
                    marginTop: "15px",
                    fontWeight: "bold",
                    display: "inline-block",
                    boxShadow: "0 4px 6px rgba(0,0,0,0.1)",
                  }}
                >
                  <div
                    style={{
                      color: "#000000ff",
                      fontSize: "14pt",
                      fontWeight: "bold",
                      textAlign: "center",
                      minWidth: "300px",
                      textTransform: "uppercase",
                    }}
                  >
                    {header3}
                  </div>
                </div>
              </div>
            </div>

            {/* CONTENT */}
            <div
              style={{
                flex: 1,
                padding: "0 40px 100px 40px",
                backgroundColor: "#eef6fc",
              }}
            >
              {/* TABEL HASIL */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "separate",
                  borderSpacing: "0 10px",
                }}
              >
                <thead>
                  <tr style={{ textAlign: "center" }}>
                    <th style={{ width: "50px" }}></th>
                    <th
                      style={{
                        width: "200px",
                        textAlign: "left",
                        paddingLeft: "10px",
                      }}
                    ></th>
                    {examColumns.map((num) => (
                      <th
                        key={num}
                        style={{ width: "70px", paddingBottom: "10px" }}
                      >
                        <div style={{ fontSize: "12pt", fontWeight: "bold" }}>
                          Tes
                        </div>
                        <div style={{ fontSize: "12pt", fontWeight: "bold" }}>
                          ke-{num}
                        </div>
                      </th>
                    ))}
                    <th style={{ width: "20px" }}></th>
                    <th style={{ flex: 1 }}></th>
                  </tr>
                </thead>
                <tbody>
                  {data.participantScores.map((p, index) => (
                    <tr key={p.examinee.id} style={{ marginBottom: "10px" }}>
                      <td style={{ verticalAlign: "middle" }}>
                        <div
                          style={{
                            width: "60px",
                            height: "70px",
                            overflow: "hidden",
                            border: "1px solid #000000ff",
                          }}
                        >
                          {p.examinee.avatar ? (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                backgroundImage: `url(http://localhost:3000/${p.examinee.avatar})`,
                                backgroundSize: "cover",
                                backgroundPosition: "center",
                              }}
                            />
                          ) : (
                            <div
                              style={{
                                width: "100%",
                                height: "100%",
                                background: "#ddd",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {p.examinee.name.charAt(0)}
                            </div>
                          )}
                        </div>
                      </td>
                      <td
                        style={{ verticalAlign: "middle", paddingLeft: "10px" }}
                      >
                        <div
                          style={{
                            fontWeight: "bold",
                            fontSize: "11pt",
                            textTransform: "uppercase",
                          }}
                        >
                          {index + 1}. {p.examinee.name}
                        </div>
                      </td>

                      {/* Kolom Tes 1-6 */}
                      {examColumns.map((colIndex) => {
                        const examDef = data.uniqueExams[colIndex - 1]; 
                        let scoreDisplay = "";

                        if (examDef) {
                          const scoreObj = p.scores.find(
                            (s) => s.examId === examDef.id
                          );
                          if (scoreObj && scoreObj.score !== null) {
                            scoreDisplay = String(scoreObj.score);
                          }
                        }

                        return (
                          <td
                            key={colIndex}
                            style={{
                              textAlign: "center",
                              verticalAlign: "middle",
                            }}
                          >
                            <div
                              style={{
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                                gap: "5px",
                              }}
                            >
                              <div
                                style={{
                                  width: "50px",
                                  height: "30px",
                                  backgroundColor: "white",
                                  border: "1px solid #313131ff",
                                  borderRadius: "8px",
                                  display: "flex",
                                  alignItems: "center",
                                  justifyContent: "center",
                                  fontWeight: "bold",
                                  fontSize: "11pt",
                                }}
                              >
                                {scoreDisplay}
                              </div>
                            </div>
                          </td>
                        );
                      })}

                      <td></td>

                      {/* Kolom Workplace */}
                      <td
                        style={{ verticalAlign: "middle", paddingLeft: "20px" }}
                      >
                        <div
                          style={{
                            width: "100%",
                            height: "30px",
                            backgroundColor: "white",
                            border: "1px solid #313131ff",
                            borderRadius: "8px",
                            display: "flex",
                            alignItems: "center",
                            paddingLeft: "10px",
                            fontSize: "10pt",
                            fontWeight: "bold",
                            color: "#333",
                            textTransform: "uppercase",
                          }}
                        >
                          {p.examinee.workplace || ""}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {/* FOOTER DECORATION */}
             <div
              style={{
                height: "50px",
                backgroundColor: "#103c6b",
                borderTopLeftRadius: "50% 20px",
                borderTopRightRadius: "50% 20px",
                marginTop: "auto", 
                width: "100%",
              }}
            ></div>
          </div>
      </Box>
    </Stack>
  );
}
