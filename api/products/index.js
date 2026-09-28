import { createClient } from '@supabasesupabase-js';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET  'trade_platform_secret_key_2024';

 认证校验
const auth = (req) = {
  const token = req.headers.authorization.split(' ')[1];
  if (!token) throw new Error('未登录，请先登录');
  return jwt.verify(token, JWT_SECRET);
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  try {
     GET：获取产品列表
    if (req.method === 'GET') {
      const { keyword, status, page = 1, pageSize = 20 } = req.query;
      let query = supabase.from('products').select('', { count 'exact' });

       关键词搜索
      if (keyword) {
        query = query.or(`name_cn.ilike.%${keyword}%,name_en.ilike.%${keyword}%,sku.ilike.%${keyword}%`);
      }
       状态筛选
      if (status) {
        query = query.eq('status', status);
      }

       分页排序
      const { data, count, error } = await query
        .order('id', { ascending false })
        .range((page - 1)  pageSize, page  pageSize - 1);

      if (error) throw error;
      return res.status(200).json({ list data, total count });
    }

     POST：新增产品
    if (req.method === 'POST') {
      auth(req);
      const { data, error } = await supabase
        .from('products')
        .insert([req.body])
        .select();

      if (error) throw error;
      return res.status(200).json({ id data[0].id });
    }

    res.status(405).json({ message '不支持的请求方法' });
  } catch (e) {
    res.status(401).json({ message e.message });
  }
}
