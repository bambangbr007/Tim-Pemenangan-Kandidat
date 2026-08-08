import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  // Initialize Gemini AI Client lazily
  let aiClient: GoogleGenAI | null = null;
  function getGenAIClient(): GoogleGenAI | null {
    if (!aiClient && process.env.GEMINI_API_KEY) {
      aiClient = new GoogleGenAI({
        apiKey: process.env.GEMINI_API_KEY,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          },
        },
      });
    }
    return aiClient;
  }

  // API Routes
  app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', time: new Date().toISOString() });
  });

  // AI Advisor Endpoint for Candidate Owner
  app.post('/api/ai-advisor', async (req, res) => {
    try {
      const { problemType, customQuery, selectedRegion, candidateName, electionType, totalPendukung, swingVoters } = req.body;

      const ai = getGenAIClient();

      if (!ai) {
        // High quality fallback strategy if API key is not configured or in local sandbox
        return res.json({
          analysis: `Berdasarkan analisis situasi di ${selectedRegion || 'Wilayah Strategis'} untuk ${candidateName || 'Paslon kita'} pada pemilihan ${electionType || 'Pilkada'}: \n\nIsu utama '${problemType}' dipengaruhi oleh dinamika lapangan di mana pemilih swing voter (${swingVoters || 0} terdata) memerlukan dorongan emosional dan program konkret. Tim lawan mengandalkan manuver jangka pendek, sehingga tim kita harus mengunci basis pendukung (${totalPendukung || 0} pemilih) dengan pendekatan personal.`,
          tacticalSteps: [
            `Lakukan pemetaan mikro di ${selectedRegion || 'wilayah target'}: Tugaskan relawan door-to-door menyasar rumah warga swing voter dalam 48 jam ke depan.`,
            `Sosialisasikan 3 program unggulan paling relevan (Bantuan Modal UMKM, Kartu Tani/Masyarakat, dan Beasiswa Anak Sekolah).`,
            `Tingkatkan kehadiran fisik banner & baliho mini berizin di rumah-rumah warga pendukung sebagai sinyal dominasi psikologis.`,
            `Lakukan penetrasi ke majelis taklim, komunitas pemuda/olahraga, dan tokoh masyarakat lokal untuk memperkuat dukungan komunal.`,
            `Bentuk tim patroli darurat untuk mengantisipasi potensi politik uang atau intimidasi tim lawan menjelang hari H.`
          ],
          commandMessage: `PANGGILAN AKSI UNTUK TIM PEMENANGAN LAPANGAN!\n\nSehubungan dengan perkembangan situasi di ${selectedRegion || 'wilayah kita'}, Instruksi Utama dari ${candidateName || 'Kandidat'}:\n\n1. Seluruh Korlap & Relawan segera fokus mengunci suara Swing Voter.\n2. Tingkatkan kunjungan silaturahmi rumah ke rumah dengan membawa kartu program unggulan.\n3. Laporkan setiap kendala & pergerakan tim lawan langsung melalui aplikasi ini.\n\nTetap solid, santun, dan fokus menuju kemenangan! BISMILLAH.`
        });
      }

      const promptText = `
Bertindaklah sebagai Konsultan Politik & Ahli Strategi Pemenangan Pemilu / Pilkada / Pilkades berpengalaman di Indonesia.

Konteks Paslon:
- Nama Kandidat: ${candidateName || 'Paslon Utama'}
- Jenis Pemilihan: ${electionType || 'Pilkada'}
- Wilayah Fokus: ${selectedRegion || 'Seluruh Wilayah'}
- Total Pendukung Terdata: ${totalPendukung || 0}
- Total Swing Voters Terdata: ${swingVoters || 0}

Masalah / Isu Lapangan yang Dihadapi:
- Kategori Masalah: ${problemType}
- Rincian Isu dari Owner / Ketua Tim: "${customQuery}"

Tolong berikan pertimbangan dan panduan strategi komprehensif dalam bahasa Indonesia yang tegas, taktis, dan mudah dipahami oleh tim relawan lapangan.

Kembalikan jawaban dalam format JSON persis sesuai struktur berikut:
{
  "analysis": "Penjelasan analisis mendalam mengenai akar masalah dan dinamika lawan/masyarakat...",
  "tacticalSteps": [
    "Langkah taktis 1...",
    "Langkah taktis 2...",
    "Langkah taktis 3...",
    "Langkah taktis 4...",
    "Langkah taktis 5..."
  ],
  "commandMessage": "Draf teks pesan instruksi komando yang siap disebar ke WhatsApp Korlap & Tim Lapangan..."
}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: promptText,
        config: {
          responseMimeType: 'application/json',
        },
      });

      const responseText = response.text || '';
      const parsedData = JSON.parse(responseText);

      return res.json(parsedData);
    } catch (error) {
      console.error('Error generating AI advice:', error);
      return res.status(500).json({
        error: 'Gagal menghasilkan pertimbangan AI',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Vite development middleware or Production static files
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server Pantauan Pemenangan Kandidat running on http://localhost:${PORT}`);
  });
}

startServer();
