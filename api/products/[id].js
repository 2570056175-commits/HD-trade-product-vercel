import { createClient } from '@supabase/supabase-js';
import jwt from 'jsonwebtoken';

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

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  const { id } = req.query;

  try {
    // GET：获取单个产品详情
    if (req.method === 'GET') {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      return res.status(200).json(data);
    }

    // PUT：更新产品
    if (req.method === 'PUT') {
      auth(req);
      const { error } = await supabase
        .from('products')
        .update(req.body)
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    // DELETE：删除产品
    if (req.method === 'DELETE') {
      auth(req);
      const { error } = await supabase
        .from('products')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ message: '不支持的请求方法' });
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}
