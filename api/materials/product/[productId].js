import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  try {
    const { productId } = req.query;

    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('product_id', productId)
      .order('id', { ascending: false });

    if (error) throw error;
    res.status(200).json(data);
  } catch (e) {
    res.status(400).json({ message: e.message });
  }
}
