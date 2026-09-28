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

  try {
    // GET：查询知识库列表
    if (req.method === 'GET') {
      const { keyword, category } = req.query;
      let query = supabase.from('knowledge').select('*');

      if (keyword) {
        query = query.or(`title.ilike.%${keyword}%,content.ilike.%${keyword}%`);
      }
      if (category) {
        query = query.eq('category', category);
      }

      const { data, error } = await query.order('id', { ascending: false });
      if (error) throw error;
      return res.status(200).json(data);
    }

    // POST：新增知识库
    if (req.method === 'POST') {
      auth(req);
      const { data, error } = await supabase
        .from('knowledge')
        .insert([req.body])
        .select();

      if (error) throw error;
      return res.status(200).json({ id: data[0].id });
    }

    // PUT：更新知识库
    if (req.method === 'PUT') {
      auth(req);
      const { id, ...body } = req.body;
      const { error } = await supabase
        .from('knowledge')
        .update(body)
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    // DELETE：删除知识库
    if (req.method === 'DELETE') {
      auth(req);
      const { id } = req.query;
      const { error } = await supabase
        .from('knowledge')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return res.status(200).json({ success: true });
    }

    res.status(405).json({ message: '不支持的请求方法' });
  } catch (e) {
    res.status(401).json({ message: e.message });
  }
}
