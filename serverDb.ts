import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { PhotoCardType, CoupleConfig } from './src/types';

export interface UserSession {
  phone: string;
  role: 'user' | 'admin';
  registeredAt: string;
  config: CoupleConfig;
  memories: PhotoCardType[];
}

interface DatabaseSchema {
  users: Record<string, {
    phone: string;
    passwordHash: string;
    salt: string;
    registeredAt: string;
    config: CoupleConfig;
    memories: PhotoCardType[];
  }>;
}

const DB_PATH = path.join(process.cwd(), 'database.json');

// Pre-seeded memories for newly registered users to get started beautifully
const DEFAULT_MEMORIES: PhotoCardType[] = [
  {
    id: 'm1',
    url: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=600&auto=format&fit=crop',
    title: '初次邂逅 · 暖色午后',
    description: '咖啡屋窗棂有暖光。你抱着一本诗集，抬头刚好撞进我的眼神里。那一刻，心跳像一万只蝴蝶齐飞。',
    location: 'Sweet Cafe 二楼',
    date: '2024-05-20',
    tags: ['初遇', '心动'],
  },
  {
    id: 'm2',
    url: 'https://images.unsplash.com/photo-1448375240586-882707db888b?q=80&w=600&auto=format&fit=crop',
    title: '拾秋枫林 · 微风不燥',
    description: '踩着落叶清脆的轻响。你把手揣进我的大衣口袋，暖意顺着指尖流淌进心里，好像把一整个秋天搂进了怀。',
    location: '原始红枫谷林区',
    date: '2024-10-01',
    tags: ['秋林', '散步'],
  },
  {
    id: 'm3',
    url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?q=80&w=600&auto=format&fit=crop',
    title: '繁星许愿 · 炽热营火',
    description: '夜空缀满繁星，营火在晚风中发出劈啪轻响。我们并肩许下心愿，火焰映红了你的侧脸，比漫天星辰还要明亮璀璨。',
    location: 'Starry Valley 露营地',
    date: '2024-12-24',
    tags: ['璀璨', '篝火'],
  },
  {
    id: 'm4',
    url: 'https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?q=80&w=600&auto=format&fit=crop',
    title: '海风吹拂 · 橘子海日落',
    description: '潮汐漫过白沙滩。夕阳像一颗融化的橘子糖没入地平线。你踩着水花踏歌，笑里沾着咸咸海浪的味道。',
    location: 'Horizon 黄金湾',
    date: '2025-04-12',
    tags: ['海风', '落日'],
  },
  {
    id: 'm5',
    url: 'https://images.unsplash.com/photo-1485550409059-9afb054cada4?q=80&w=600&auto=format&fit=crop',
    title: '避雨屋檐 · 手中余温',
    description: '青石古街落着淅沥的梅雨。我们缩在古朴牌楼的雕花屋檐，雨珠顺着瓦片坠落，可心头却因为并肩依偎而滚烫。',
    location: '云烟古镇巷中',
    date: '2025-05-15',
    tags: ['避雨', '雨街'],
  },
  {
    id: 'm6',
    url: 'https://images.unsplash.com/photo-1549417229-aa67d3263c09?q=80&w=600&auto=format&fit=crop',
    title: '手制蛋糕 · 奶油吻面',
    description: '亲手为你烘烤的草莓蛋糕，你大笑着把一抹香甜的奶油抹在我的鼻尖。那一瞬间，整个世界都溢满了甜甜的味道。',
    location: 'Sweet Home 厨房',
    date: '2025-06-18',
    tags: ['手作', '蛋糕'],
  },
  {
    id: 'm7',
    url: 'https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=600&auto=format&fit=crop',
    title: '落日吻别 · 浪漫流连',
    description: '在日落黄昏下给彼此一个拥抱。晚霞的紫红色照得天际美如画卷，只盼执手百年，岁岁有今日。',
    location: '心动天台',
    date: '2026-05-20',
    tags: ['拥抱', '约定'],
  }
];

export function getDatabase(): DatabaseSchema {
  if (!fs.existsSync(DB_PATH)) {
    const initialDb: DatabaseSchema = { users: {} };
    fs.writeFileSync(DB_PATH, JSON.stringify(initialDb, null, 2), 'utf-8');
    return initialDb;
  }
  try {
    const content = fs.readFileSync(DB_PATH, 'utf-8');
    return JSON.parse(content) as DatabaseSchema;
  } catch (err) {
    console.error('Error reading JSON database, returning empty:', err);
    return { users: {} };
  }
}

export function saveDatabase(db: DatabaseSchema) {
  try {
    fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error writing JSON database:', err);
  }
}

// SHA256 secure password hashing helper
export function hashPassword(password: string, salt: string): string {
  return crypto.createHmac('sha256', salt).update(password).digest('hex');
}

// Token generation for session validation (can decode/validate on the server)
export function generateToken(phone: string, role: string): string {
  const payload = JSON.stringify({ phone, role, exp: Date.now() + 1000 * 60 * 60 * 24 * 30 }); // 30 days expiry
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from('couplememorysupersecretkeys32bytes', 'utf-8').slice(0, 32), Buffer.from('memoryinitial16v', 'utf-8').slice(0, 16));
  let encrypted = cipher.update(payload, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

export function verifyToken(token: string): { phone: string; role: 'user' | 'admin' } | null {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from('couplememorysupersecretkeys32bytes', 'utf-8').slice(0, 32), Buffer.from('memoryinitial16v', 'utf-8').slice(0, 16));
    let decrypted = decipher.update(token, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    const parsed = JSON.parse(decrypted);
    if (!parsed || parsed.exp < Date.now()) {
      return null;
    }
    return { phone: parsed.phone, role: parsed.role };
  } catch (err) {
    return null;
  }
}

// User-Facing Authentication and Sync Functions
export function registerUser(phone: string, rawPassword: string): { success: boolean; message: string } {
  // Validate basic inputs
  if (!phone || phone.length < 5) {
    return { success: false, message: '请输入有效的手机号或账号' };
  }
  if (!rawPassword || rawPassword.length < 6) {
    return { success: false, message: '密码长度至少为6位' };
  }

  const db = getDatabase();
  if (db.users[phone]) {
    return { success: false, message: '该手机号码已被注册' };
  }

  const salt = crypto.randomBytes(16).toString('hex');
  const passwordHash = hashPassword(rawPassword, salt);

  const defaultUserConfig: CoupleConfig = {
    partnerA: 'W',
    partnerB: 'Y',
    anniversaryDate: '2024-05-20',
    albumTitle: '相册回忆录',
    bgVibe: 'dreamy',
  };

  db.users[phone] = {
    phone,
    passwordHash,
    salt,
    registeredAt: new Date().toISOString(),
    config: defaultUserConfig,
    memories: [...DEFAULT_MEMORIES],
  };

  saveDatabase(db);
  return { success: true, message: '注册成功！' };
}

export function loginUser(phone: string, rawPassword: string): { success: boolean; message: string; token?: string; user?: any } {
  const db = getDatabase();
  const user = db.users[phone];

  if (!user) {
    return { success: false, message: '该用户账号未注册' };
  }

  const calculatedHash = hashPassword(rawPassword, user.salt);
  if (calculatedHash !== user.passwordHash) {
    return { success: false, message: '密码不正确' };
  }

  const token = generateToken(phone, 'user');
  return {
    success: true,
    message: '登录成功',
    token,
    user: {
      phone: user.phone,
      role: 'user',
      config: user.config,
    }
  };
}

export function adminLogin(adminKey: string): { success: boolean; message: string; token?: string; user?: any } {
  if (adminKey !== 'syx666') {
    return { success: false, message: '管理员密钥错误' };
  }

  const token = generateToken('admin', 'admin');

  // Let's check if admin profile exists or seed it
  const db = getDatabase();
  if (!db.users['admin']) {
    const salt = crypto.randomBytes(16).toString('hex');
    db.users['admin'] = {
      phone: 'admin',
      passwordHash: hashPassword('syx666', salt),
      salt,
      registeredAt: new Date().toISOString(),
      config: {
        partnerA: 'Admin',
        partnerB: 'Cozy',
        anniversaryDate: '2019-10-01',
        albumTitle: '相册回忆录 (Admin)',
        bgVibe: 'galaxy'
      },
      memories: [...DEFAULT_MEMORIES],
    };
    saveDatabase(db);
  }

  return {
    success: true,
    message: '管理员直接登录成功',
    token,
    user: {
      phone: 'admin',
      role: 'admin',
      config: db.users['admin'].config
    }
  };
}

export function getUserData(phone: string): UserSession | null {
  const db = getDatabase();
  const user = db.users[phone];
  if (!user) return null;
  return {
    phone: user.phone,
    role: phone === 'admin' ? 'admin' : 'user',
    registeredAt: user.registeredAt,
    config: user.config,
    memories: user.memories,
  };
}

export function updateUserData(phone: string, config: CoupleConfig, memories: PhotoCardType[]): boolean {
  const db = getDatabase();
  if (!db.users[phone]) return false;
  db.users[phone].config = config;
  db.users[phone].memories = memories;
  saveDatabase(db);
  return true;
}

export function getAllUsersInfo(): Array<{ phone: string; registeredAt: string; cardCount: number }> {
  const db = getDatabase();
  return Object.values(db.users).map(user => ({
    phone: user.phone,
    registeredAt: user.registeredAt,
    cardCount: user.memories.length
  }));
}
