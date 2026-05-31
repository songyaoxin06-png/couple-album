import express from 'express';
import path from 'path';
import fs from 'fs';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import {
  registerUser,
  loginUser,
  adminLogin,
  getUserData,
  updateUserData,
  getAllUsersInfo,
  verifyToken
} from './serverDb';

// Load environment variables
dotenv.config();

const app = express();
const PORT = 3000;

// Setup JSON body parser
app.use(express.json({ limit: '10mb' }));

// Helper to resolve authenticated identity from Auth Header
function getAuthIdentity(req: express.Request): { phone: string; role: 'user' | 'admin' } | null {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const token = authHeader.substring(7);
  return verifyToken(token);
}

// REST API endpoint: Register custom couple profile with phone & password
app.post('/api/auth/register', (req: express.Request, res: express.Response) => {
  try {
    const { phone, password } = req.body;
    const result = registerUser(phone, password);
    if (!result.success) {
      return res.status(400).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || '注册发生服务错误' });
  }
});

// REST API endpoint: Login with phone & password
app.post('/api/auth/login', (req: express.Request, res: express.Response) => {
  try {
    const { phone, password } = req.body;
    const result = loginUser(phone, password);
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || '登录发生服务错误' });
  }
});

// REST API endpoint: Login directly via Administrator Access Secret Key (syx666)
app.post('/api/auth/admin-login', (req: express.Request, res: express.Response) => {
  try {
    const { adminKey } = req.body;
    const result = adminLogin(adminKey);
    if (!result.success) {
      return res.status(401).json(result);
    }
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || '管理员登录发生错误' });
  }
});

// REST API endpoint: Fetch user-specific persistent couple config and memories
app.get('/api/user/data', (req: express.Request, res: express.Response) => {
  try {
    const identity = getAuthIdentity(req);
    if (!identity) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    // Check if admin is requesting to inspect a user
    let targetPhone = identity.phone;
    const { inspectPhone } = req.query;
    if (inspectPhone && typeof inspectPhone === 'string') {
      if (identity.role !== 'admin') {
        return res.status(403).json({ success: false, message: '只有管理员能调试/查看他人相册' });
      }
      targetPhone = inspectPhone;
    }

    const data = getUserData(targetPhone);
    if (!data) {
      return res.status(404).json({ success: false, message: '无法获取该用户信息' });
    }
    res.json({
      success: true,
      data: {
        phone: data.phone,
        role: targetPhone === 'admin' ? 'admin' : 'user',
        config: data.config,
        memories: data.memories
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || '获取用户数据失败' });
  }
});

// REST API endpoint: Sync user's dynamic config and memories to physical persistent storage
app.post('/api/user/sync', (req: express.Request, res: express.Response) => {
  try {
    const identity = getAuthIdentity(req);
    if (!identity) {
      return res.status(401).json({ success: false, message: '请先登录' });
    }
    
    let targetPhone = identity.phone;
    const { inspectPhone } = req.query;
    if (inspectPhone && typeof inspectPhone === 'string') {
      if (identity.role !== 'admin') {
        return res.status(403).json({ success: false, message: '只有管理员能修改他人相册数据' });
      }
      targetPhone = inspectPhone;
    }

    const { config, memories } = req.body;
    const success = updateUserData(targetPhone, config, memories);
    if (!success) {
      return res.status(400).json({ success: false, message: '同步用户数据失败，账号不存在' });
    }
    res.json({ success: true, message: '云端同步成功' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || '同步出错' });
  }
});

// REST API endpoint: Fetch summary of registered accounts if requester is an verified Admin
app.get('/api/admin/users-list', (req: express.Request, res: express.Response) => {
  try {
    const identity = getAuthIdentity(req);
    if (!identity || identity.role !== 'admin') {
      return res.status(403).json({ success: false, message: '无权操作：需要管理员身份' });
    }
    const list = getAllUsersInfo();
    res.json({ success: true, users: list });
  } catch (error: any) {
    res.status(500).json({ success: false, message: '获取用户列表失败' });
  }
});

// Lazy initializer for Google Gen AI
let aiClient: GoogleGenAI | null = null;
function getAi(): GoogleGenAI {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("WARNING: GEMINI_API_KEY environment variable is not set. AI features will fallback to client-side local Generation.");
    }
    aiClient = new GoogleGenAI({
      apiKey: key || 'MOCK_KEY_FALLBACK',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiClient;
}

// REST API endpoint: Generate romantic caption/analysis using Gemini 3.5 Flash
app.post('/api/generate-caption', async (req: express.Request, res: express.Response) => {
  try {
    const { title, description, location, date, tone, partnerA, partnerB } = req.body;

    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      // Return a simulated high-quality loving caption if API is missing so the app doesn't crash
      const mockCaptions: Record<string, string[]> = {
        sweet: [
          `跟 ${partnerA} 一起度过的每个瞬间，连空气里都是香香甜甜的！在 ${location || '世界角落'} 的时候，感觉天际线都变成了粉色，只想跟我的宝贝永远粘在一起。`,
          `宇宙超级无敌无糖加蜜糖！ ${partnerA} 真是世间上最可爱的人。看见你的那一秒，我心里的巧克力就全部融化啦！`
        ],
        deep: [
          `韶华易逝，唯爱常青。记于 ${date || '时光深处'} 在 ${location || '温馨角落'}：世人千万，我却只求一瓢。愿与 ${partnerA} 执子之手，静看流水年华。`,
          `于千万人里能握紧你的右手，是这一生唯一的笃定。不需要轰烈，有你并肩就是最好的陪伴。`
        ],
        poetic: [
          `「枫叶落时是红笺，海潮涨时是思念。」于 ${location || '浪漫天地'} 与君共赏，晓看天色暮看云，行也思君，坐也思君，极尽诗意唯有你 ${partnerA}。`,
          `星辉落入眸中，清风吹散云霭。山川湖海，都抵不过你转身处的那一抹浅笑。`
        ],
        humorous: [
          `警告：今日份的 ${partnerA} 已经被我单方面认证为专属萌宠！拒绝退换！在 ${location || '这里'} 吃好喝好，往后余生还得继续对我多关怀包照！`,
          `心动值已经超标啦，请 ${partnerA} 立即向我投降！不然我就要在心里惩罚你一辈子！`
        ]
      };

      const toneArray = mockCaptions[tone as string] || mockCaptions.sweet;
      const selectedText = toneArray[Math.floor(Math.random() * toneArray.length)];

      return res.json({
        success: true,
        text: selectedText,
        source: 'local_fallback_mock'
      });
    }

    const ai = getAi();
    const promptMessage = `
你要为一对恋人生成一段极其浪漫、动人的回忆旁白或真情告白，配在这张相片旁。
相片回忆信息如下：
- 主题：${title}
- 发生时期：${date}
- 发生地点：${location || '未知秘密地点'}
- 原本的介绍：${description}

恋人之间的称谓关系：
- 对方叫：${partnerA || 'Ta'}
- 我叫：${partnerB || '我'}

请你选择 【${tone || 'deep'}】 这种特定的写作语气进行中文撰写：
- 如果 tone 是 'sweet' (糖分超标)：写得极尽甜蜜、充满热恋感的撒娇、可爱而溢满热意的表白；
- 如果 tone 是 'deep' (情意绵绵)：写得极为温柔、深情、眼神缱绻、许诺长相厮守的安全感；
- 如果 tone 是 'poetic' (诗情画意)：运用极其高雅的诗句意象、浪漫绝美的修辞，富有文学与艺术感；
- 如果 tone 是 'humorous' (俏皮可爱)：写得幽默好玩、打情骂俏、活泼灵动、展现令人忍俊不禁又深感暖心的甜蜜日常。

字数控制在 100 字到 180 字之间。不要带任何像“好的，为您生成：”等的前缀或者后缀，直接以极具代入感的口吻输出写好的诗句旁白！
`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: promptMessage,
      config: {
        temperature: 1.0,
      }
    });

    res.json({
      success: true,
      text: response.text?.trim() || '',
      source: 'gemini_api'
    });

  } catch (error: any) {
    console.error("Gemini API server failure:", error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server encountered mistake calling Gemini API'
    });
  }
});

// Setup dev vs production router/middleware
async function setupServer() {
  const distPath = path.join(process.cwd(), 'dist');
  const useVite = process.env.NODE_ENV !== 'production' || !fs.existsSync(distPath);

  if (useVite) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Using Vite Dev Server Middleware mode');
  } else {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving production static build from dist');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server successfully started running on host 0.0.0.0 port ${PORT}`);
  });
}

setupServer();
