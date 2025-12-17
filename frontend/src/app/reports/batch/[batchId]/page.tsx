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
import { createRoot } from "react-dom/client"; // New Import
import api from "@/lib/axios";
import { notifications } from "@mantine/notifications";
import { useParams } from "next/navigation";
import { useDisclosure } from "@mantine/hooks";



// --- NEW COMPONENT: Dokumen Laporan untuk Print/PDF ---
const BatchReportDocument = ({
  data,
  header1,
  header2,
  header3,
}: {
  data: BatchParticipantReportData;
  header1: string;
  header2: string;
  header3: string;
}) => {
  const examColumns = [1, 2, 3, 4, 5, 6];

  return (
    <div
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
                      backgroundColor: "#f8f9fa",
                    }}
                  >
                    {p.examinee.avatar ? (
                      /* eslint-disable-next-line @next/next/no-img-element */
                      <img
                        src={
                            // Logic supports both pre-processed base64 and original URLs (for preview)
                            // But since we pre-process for export, this handles both.
                            // If base64 (starts with data:), use as is.
                            // If relative URL, prepend localhost.
                            (p.examinee.original_avatar_url || p.examinee.avatar)?.startsWith("data:")
                                ? (p.examinee.original_avatar_url || p.examinee.avatar)
                                : `http://localhost:3000/${p.examinee.original_avatar_url || p.examinee.avatar}`
                        }
                        alt={p.examinee.name}
                        style={{
                          width: "100%",
                          height: "100%",
                          // No object-fit needed; image is pre-cropped on canvas for export
                          // For on-screen preview of raw data, this might stretch if not cropped yet.
                          // But on-screen preview typically doesn't use the 'exportData' cloned object?
                          // Wait, the on-screen preview uses 'data'. 'data' is NOT modified. 
                          // So on-screen preview of 'data' will show stretched image?
                          // AH! I need a fallback for the ON-SCREEN PREVIEW which uses original data.
                          // The on-screen preview images are likely rectangular/original aspect.
                          // If I simply use width/height 100%, valid preview will look SQUASHED again.
                          // BUT, 'export' only happens in hidden container with 'exportData'.
                          // The on-screen rendering uses 'BatchReportDocument' with 'data'.
                          
                          // SOLUTION: Use object-fit: cover HERE on the CSS.
                          // For export: 'html2canvas' ignores object-fit: cover, BUT since the image is ALREADY cropped to aspect ratio, 
                          // 'cover' and 'fill' look IDENTICAL on the canvas-cropped image.
                          // So adding 'object-fit: cover' here fixes the PREVIEW (original data) 
                          // AND is harmless for the EXPORT (cropped data).
                          objectFit: "cover",
                        }}
                      />
                    ) : (
                      <div
                        style={{
                          width: "100%",
                          height: "100%",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          fontSize: "24px",
                          fontWeight: "bold",
                          color: "#555"
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
  );
};


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

  // Ref not used for capture anymore, but useful for preview scrolling if needed
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
    if (!data || !batch) return;

    try {
      setExporting(true);

      // --- PRE-PROCESS IMAGES TO BASE64 WITH CANVAS CROPPING ---
      const convertAvatarsToBase64 = async (reportData: BatchParticipantReportData) => {
        const newData = JSON.parse(JSON.stringify(reportData)); // Deep clone
        
        const promises = newData.participantScores.map(async (item: any) => {
            const avatarUrl = item.examinee.original_avatar_url || item.examinee.avatar;
            
            if (avatarUrl && !avatarUrl.startsWith('data:')) {
                try {
                    const fullUrl = avatarUrl.startsWith('http') 
                        ? avatarUrl 
                        : `http://localhost:3000/${avatarUrl}`; // Ensure correct base
                    
                    // Load image
                    const img = new Image();
                    img.crossOrigin = "Anonymous";
                    img.src = fullUrl;
                    
                    await new Promise<void>((resolve, reject) => {
                        img.onload = () => resolve();
                        img.onerror = (e) => reject(e);
                    });

                    // Create canvas for "Cover" cropping (3x resolution for sharpness)
                    // Target box is ~60px x 70px
                    const targetW = 60 * 3;
                    const targetH = 70 * 3;
                    const canvas = document.createElement("canvas");
                    canvas.width = targetW;
                    canvas.height = targetH;
                    const ctx = canvas.getContext("2d");

                    if (ctx) {
                        // Calculate "Cover" dimensions
                        const imgRatio = img.width / img.height;
                        const targetRatio = targetW / targetH;
                        
                        let renderW, renderH, offsetX, offsetY;

                        if (imgRatio > targetRatio) {
                            // Image is wider than target: fit height, chop width
                            renderH = targetH;
                            renderW = img.width * (targetH / img.height);
                            offsetX = (targetW - renderW) / 2;
                            offsetY = 0;
                        } else {
                            // Image is taller than target: fit width, chop height
                            renderW = targetW;
                            renderH = img.height * (targetW / img.width);
                            offsetX = 0;
                            offsetY = (targetH - renderH) / 2;
                        }

                        // Draw white background first (for transparent PNGs)
                        ctx.fillStyle = "#ffffff";
                        ctx.fillRect(0, 0, targetW, targetH);
                        
                        // Draw image
                        ctx.drawImage(img, offsetX, offsetY, renderW, renderH);
                        
                        // Result
                        const base64 = canvas.toDataURL("image/png");
                        item.examinee.avatar = base64;
                        item.examinee.original_avatar_url = base64;
                    }
                } catch (e) {
                    console.error("Failed to process avatar", e);
                }
            }
            return item;
        });
        
        await Promise.all(promises);
        return newData;
      };

      const exportData = await convertAvatarsToBase64(data);


      // --- PHANTOM RENDERING ---
      // 1. Create hidden container
      const hiddenContainer = document.createElement("div");
      hiddenContainer.style.position = "absolute";
      hiddenContainer.style.top = "0";
      hiddenContainer.style.left = "-9999px";
      hiddenContainer.style.width = "320mm"; // Match document width
      // We don't set height, let it flow
      hiddenContainer.style.zIndex = "-9999";
      hiddenContainer.style.background = "#fff";
      document.body.appendChild(hiddenContainer);

      // 2. Render Component
      const root = createRoot(hiddenContainer);
      await new Promise<void>((resolve) => {
        root.render(
            <BatchReportDocument 
                data={exportData} 
                header1={header1} 
                header2={header2} 
                header3={header3} 
            />
        );
        // Wait time for fonts/SVGs to settle (images are already based64 so fast)
        setTimeout(resolve, 1000); 
      });

      // 3. Capture with html2canvas (High Quality)
      const element = hiddenContainer.firstElementChild as HTMLElement;
      if (!element) throw new Error("Render failed");

      const canvas = await html2canvas(element, {
        scale: 3, // High DPI (approx 300dpi if 1=96dpi)
        useCORS: true, // Important for avatars
        backgroundColor: "#ffffff",
        allowTaint: true,
        logging: false,
        onclone: (clonedDoc) => {
             // Optional: Manipulate DOM before capture if needed
        }
      });

      const imgData = canvas.toDataURL("image/png");

      // 4. Generate PDF
      const pdf = new jsPDF({
        orientation: "portrait",
        unit: "mm",
        format: [320, 480], // Custom size matches document
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
      
      // Cleanup
      root.unmount();
      document.body.removeChild(hiddenContainer);

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
          
          {/* Main Preview (also uses the component for consistency) */}
          <div ref={printRef}>
             <BatchReportDocument 
                data={data} 
                header1={header1} 
                header2={header2} 
                header3={header3} 
             />
          </div>

      </Box>
    </Stack>
  );
}
