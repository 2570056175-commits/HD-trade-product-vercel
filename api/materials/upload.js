import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';
import multer from 'multer';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'trade_platform_secret_key_2024';

const auth = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('未登录，请先登录');
  return jwt.verify(token, JWT_SECRET);
};

// 内存存储，适配Vercel无文件系统环境
const upload = multer({ storage: multer.memoryStorage() });

// Vercel配置：关闭默认bodyParser，让multer处理文件
export const config = {
  api: {
    bodyParser: false
  }
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  try {
    auth(req);

    // 解析文件
    await new Promise((resolve, reject) => {
      upload.single('file')(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    const file = req.file;
    const { product_id, type = 'image' } = req.body;
    const fileName = `${Date.now()}-${file.originalname}`;

    // 上传到Supabase存储桶
    const { error: uploadError } = await supabase
      .storage
      .from('materials')
      .upload(fileName, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 获取公开访问URL
    const { data: publicData } = supabase
      .storage
      .from('materials')
      .getPublicUrl(fileName);

    // 写入数据库
    const { data, error: dbError } = await supabase
      .from('materials')
      .insert([{
        product_id: Number(product_id),
        name: file.originalname,
        type: type,
        url: publicData.publicUrl,
        size: file.size
      }])
      .select();

    if (dbError) throw dbError;

    res.status(200).json({
      id: data[0].id,
      url: data[0].url,
      name: data[0].name
    });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}
