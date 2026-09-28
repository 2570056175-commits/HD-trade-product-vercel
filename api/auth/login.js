import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const JWT_SECRET = process.env.JWT_SECRET || 'trade_platform_secret_key_2024';

export default async function handler(req, res) {
  // 处理跨域预检
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    return res.status(200).end();
  }

  try {
    const { username, password } = req.body;

    // 查询用户
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('username', username)
      .single();

    if (error || !user) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 校验密码
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      return res.status(400).json({ message: '用户名或密码错误' });
    }

    // 生成Token
    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.status(200).json({
      token,
      user: { id: user.id, username: user.username, role: user.role }
    });
  } catch (e) {
    res.status(500).json({ message: e.message });
  }
}
