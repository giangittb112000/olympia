
import connectDB from '../lib/db/connect';
import WarmUpPack from '../server/models/WarmUpPack';
import crypto from 'crypto';

async function seed() {
  await connectDB();
  
  // Clear existing
  await WarmUpPack.deleteMany({});
  
  const packs = [
     {
         name: "Gói Tự Nhiên (Toán/Lý/Hóa)",
         questions: Array.from({length: 12}).map((_, i) => ({
             id: crypto.randomUUID(),
             content: `Câu hỏi Tự Nhiên số ${i+1}: 1 + ${i+1} = ?`,
             description: `${1 + i+1}`
         }))
     },
     {
         name: "Gói Xã Hội (Văn/Sử/Địa)",
         questions: Array.from({length: 12}).map((_, i) => ({
             id: crypto.randomUUID(),
             content: `Câu hỏi Xã Hội số ${i+1}: Ai là tác giả của tác phẩm X?`,
             description: `Tác giả ${i+1}`
         }))
     }
  ];

  await WarmUpPack.insertMany(packs);
  console.log('Seeded WarmUp Packs successfully');
  process.exit(0);
}

seed();
