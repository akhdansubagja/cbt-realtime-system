"use client";

import {
  Button,
  Group,
  Modal,
  Stack,
  Table,
  TextInput,
  Text,
  Box,
  LoadingOverlay,
  ScrollArea,
  Avatar,
  Center,
} from "@mantine/core";
import { useEffect, useState, useRef } from "react";
import { BatchParticipantReportData } from "@/types/batchParticipantReport";
import { IconDownload, IconPrinter } from "@tabler/icons-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import api from "@/lib/axios";
import { notifications } from "@mantine/notifications";

interface BatchReportModalProps {
  opened: boolean;
  onClose: () => void;
  batchId: number;
  batchName: string;
}

export function BatchReportModal({
  opened,
  onClose,
  batchId,
  batchName,
}: BatchReportModalProps) {
  const [data, setData] = useState<BatchParticipantReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [exporting, setExporting] = useState(false);

  // Editable headers state
  const [header1, setHeader1] = useState("DAFTAR PENILAIAN SISWA/I TIK");
  const [header2, setHeader2] = useState("APBD ANGKATAN KE-3");
  const [header3, setHeader3] = useState(""); // Will be set to batchName initially

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (opened && batchId) {
      setHeader3(batchName || ""); // Default value
      fetchReport();
    }
  }, [opened, batchId, batchName]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/reports/batch-participants/${batchId}`);
      setData(response.data);
    } catch (err) {
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
    if (!printRef.current) return;

    try {
      setExporting(true);
      const element = printRef.current;

      // Gunakan html2canvas untuk menangkap tampilan elemen
      const canvas = await html2canvas(element, {
        scale: 2, // Tingkatkan kualitas
        useCORS: true, // Izinkan gambar lintas domain (misalnya avatar)
        backgroundColor: "#ffffff", // Pastikan background putih
      });

      const imgData = canvas.toDataURL("image/png");
      
      // Ukuran A4 Landscape dalam mm (297 x 210)
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "mm",
        format: "a4",
      });

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      // Hitung rasio aspek gambar agar pas di halaman PDF
      const imgWidth = canvas.width;
      const imgHeight = canvas.height;
      const ratio = Math.min(pdfWidth / imgWidth, pdfHeight / imgHeight) * 0.95; // 95% untuk margin

      const imgX = (pdfWidth - imgWidth * ratio) / 2;
      const imgY = 10; // Margin atas sedikit

      pdf.addImage(imgData, "PNG", imgX, imgY, imgWidth * ratio, imgHeight * ratio);
      pdf.save(`Laporan_${batchName.replace(/\s+/g, "_")}.pdf`);

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

  if (!data) return null;

  // Siapkan kolom tes (maksimal 6 untuk tampilan, atau sesuai data)
  // Desain meminta Tes ke-1 s/d Tes ke-6.
  // Kita akan loop 1..6. Jika data ada, tampilkan. Jika tidak, kosong.
  const examColumns = [1, 2, 3, 4, 5, 6];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Preview & Export Laporan PDF"
      size="100%" // Full screen modal untuk preview besar
      styles={{ body: { height: '100vh', overflow: 'hidden', padding: 0 } }}
    >
      <Stack h="100%" p="md" gap="md">
        <Group justify="space-between">
            <Group>
                <Text size="sm" c="dimmed">Edit judul di bawah ini sesuai kebutuhan sebelum export.</Text>
            </Group>
          <Button
            leftSection={<IconDownload size={16} />}
            onClick={handleExportPDF}
            loading={exporting}
            color="red"
          >
            Download PDF
          </Button>
        </Group>

        <Box style={{ flex: 1, overflow: "auto", background: "#f1f3f5", padding: "2rem", display: 'flex', justifyContent: 'center' }}>
            <LoadingOverlay visible={loading} />
            
            {/* AREA YANG AKAN DI-PRINT */}
            {/* Menggunakan style inline untuk memastikan hasil html2canvas akurat */}
            <div
                ref={printRef}
                style={{
                    width: "297mm", // A4 Landscape width
                    minHeight: "210mm", // A4 Landscape height
                    backgroundColor: "white", // Warna background dari desain (biru muda sangat pudar atau putih)
                    // background: "linear-gradient(180deg, #1c4e80 0%, #1c4e80 15%, #e6f2ff 15%, #e6f2ff 100%)", // Coba tiru header biru
                    position: 'relative',
                    fontFamily: 'Arial, sans-serif',
                    color: '#000',
                    display: 'flex',
                    flexDirection: 'column',
                }}
            >
                {/* HEADER BIRU GELAP */}
                <div style={{
                    backgroundColor: "#103c6b", // Biru gelap sesuai gambar
                    color: "white",
                    padding: "20px",
                    textAlign: "center",
                    borderBottomLeftRadius: "50% 20px", // Lengkungan bawah header (dekoratif sederhana)
                    borderBottomRightRadius: "50% 20px",
                    marginBottom: "20px",
                    position: 'relative',
                    zIndex: 2,
                }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', alignItems: 'center' }}>
                        {/* INPUTS HEADER EDITABLE, TAPI TAMPIL SEPERTI TEKS BIASA */}
                         <input 
                            value={header1}
                            onChange={(e) => setHeader1(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: '1px dashed rgba(255,255,255,0.3)',
                                color: 'white',
                                fontSize: '24pt',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                width: '100%',
                                outline: 'none',
                                textTransform: 'uppercase'
                            }}
                         />
                         <input 
                            value={header2}
                            onChange={(e) => setHeader2(e.target.value)}
                            style={{
                                background: 'transparent',
                                border: '1px dashed rgba(255,255,255,0.3)',
                                color: 'white',
                                fontSize: '20pt',
                                fontWeight: 'bold',
                                textAlign: 'center',
                                width: '100%',
                                outline: 'none',
                                textTransform: 'uppercase'
                            }}
                         />
                         <div style={{ 
                             backgroundColor: 'white', 
                             color: '#103c6b', 
                             padding: '5px 20px', 
                             borderRadius: '20px',
                             marginTop: '10px',
                             fontWeight: 'bold',
                             display: 'inline-block'
                         }}>
                             <input 
                                value={header3}
                                onChange={(e) => setHeader3(e.target.value)}
                                style={{
                                    background: 'transparent',
                                    border: 'none', // Putih ketemu putih, border tidak perlu
                                    color: '#103c6b',
                                    fontSize: '14pt',
                                    fontWeight: 'bold',
                                    textAlign: 'center',
                                    minWidth: '300px',
                                    outline: 'none',
                                    textTransform: 'uppercase'
                                }}
                             />
                         </div>
                    </div>
                </div>

                {/* CONTENT BACKGROUND SHAPE (Wavy blue at bottom right - optional, maybe skip for simplicity first) */}
                <div style={{ flex: 1, padding: '0 40px 40px 40px', backgroundColor: '#eef6fc' }}>
                     {/* TABEL HASIL */}
                    <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 10px' }}>
                        <thead>
                            <tr style={{ textAlign: 'center' }}>
                                <th style={{ width: '50px' }}></th>
                                <th style={{ width: '200px', textAlign: 'left', paddingLeft: '10px' }}></th>
                                {examColumns.map(num => (
                                    <th key={num} style={{ width: '60px', paddingBottom: '10px' }}>
                                        <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>Tes</div>
                                        <div style={{ fontSize: '10pt', fontWeight: 'bold' }}>ke-{num}</div>
                                    </th>
                                ))}
                                <th style={{ width: '20px' }}></th>
                                <th style={{ flex: 1 }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.participantScores.map((p, index) => (
                                <tr key={p.examinee.id} style={{ marginBottom: '10px' }}>
                                    <td style={{ verticalAlign: 'middle' }}>
                                        <div style={{ width: '40px', height: '50px', overflow: 'hidden', border: '1px solid #ccc' }}>
                                            {/* Gunakan img tag biasa agar html2canvas bisa render (NextJS Image kadang lazy load) */}
                                            {p.examinee.avatar ? (
                                                <img 
                                                    src={`http://localhost:3000/${p.examinee.avatar}`} 
                                                    alt="avt" 
                                                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                    crossOrigin="anonymous" // Penting untuk CORS html2canvas
                                                />
                                            ) : (
                                                <div style={{ width: '100%', height: '100%', background: '#ddd', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                    {p.examinee.name.charAt(0)}
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td style={{ verticalAlign: 'middle', paddingLeft: '10px' }}>
                                        <div style={{ fontWeight: 'bold', fontSize: '11pt', textTransform: 'uppercase' }}>
                                            {index + 1}. {p.examinee.name}
                                        </div>
                                    </td>
                                    
                                    {/* Kolom Tes 1-6 */}
                                    {examColumns.map((colIndex) => {
                                        // Cari nilai ujian ke-i. 
                                        // Karena `data.uniqueExams` berurutan, kita bisa asumsikan index array scores sejalan
                                        // ATAU lebih aman cari berdasarkan data.uniqueExams[i] jika ada.
                                        // Tapiii desain meminta "Tes ke-1...6".
                                        // Kita ambil saja 6 ujian pertama dari uniqueExams jika ada.
                                        
                                        const examDef = data.uniqueExams[colIndex - 1]; // colIndex 1 based
                                        let scoreDisplay = "";
                                        
                                        if (examDef) {
                                            const scoreObj = p.scores.find(s => s.examId === examDef.id);
                                            if (scoreObj && scoreObj.score !== null) {
                                                scoreDisplay = String(scoreObj.score);
                                            }
                                        }

                                        return (
                                            <td key={colIndex} style={{ textAlign: 'center', verticalAlign: 'middle' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '5px' }}>
                                                    <span style={{ fontWeight: 'bold' }}>=</span>
                                                    <div style={{
                                                        width: '50px',
                                                        height: '30px',
                                                        backgroundColor: 'white',
                                                        border: '1px solid #ccc',
                                                        borderRadius: '8px',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                        fontWeight: 'bold',
                                                        fontSize: '11pt'
                                                    }}>
                                                        {scoreDisplay}
                                                    </div>
                                                </div>
                                            </td>
                                        );
                                    })}

                                    <td></td>

                                    {/* Kolom Workplace (Kotak Kosong Panjang dikanan) */}
                                    <td style={{ verticalAlign: 'middle', paddingLeft: '20px' }}>
                                         <div style={{
                                             width: '100%',
                                             height: '30px',
                                             backgroundColor: 'white',
                                             border: '1px solid #ccc',
                                             borderRadius: '8px',
                                             display: 'flex',
                                             alignItems: 'center',
                                             paddingLeft: '10px',
                                             fontSize: '10pt',
                                             fontWeight: 'bold',
                                             color: '#333',
                                             textTransform: 'uppercase'
                                         }}>
                                             {/* Default value from workplace data if exists, else empty */}
                                             {p.examinee.workplace || ""}
                                         </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </Box>
      </Stack>
    </Modal>
  );
}
