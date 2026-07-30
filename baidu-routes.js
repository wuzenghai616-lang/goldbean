// baidu-routes.js — 百度 API 路由模块 for GoldBean v7.8.0
// 注入到 Express app A 上

module.exports = function(A, X, ah) {
  var BA = 'BAIDU_KEY_PLACEHOLDER';
  var BS = '97631c787853e23bc4d688104f21aec86cc77704';
  var bt = null, bte = 0;
  async function gt() {
    if (Date.now() < bte && bt) return bt;
    try {
      var r = await X.post('https://aip.baidubce.com/oauth/2.0/token', null, {
        params: { grant_type: 'client_credentials', client_id: BA, client_secret: BS },
        timeout: 10000
      });
      bt = r.data.access_token; bte = Date.now() + (r.data.expires_in - 300) * 1000;
      return bt;
    } catch(e) { console.log('[baidu] token err:', e.message); return null; }
  }
  async function bc(url, params) {
    var t = await gt(); if (!t) return { error: 'token_failed' };
    try {
      var r = await X.post(url + '?access_token=' + t,
        new URLSearchParams(params).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
      );
      return r.data;
    } catch(e) { return { error: e.message }; }
  }

  var OCR = 'https://aip.baidubce.com/rest/2.0/ocr/v1';
  var IPC = 'https://aip.baidubce.com/rest/2.0/image-process/v1';
  var IC = 'https://aip.baidubce.com/rest/2.0/image-classify/v2';

  // 1. 通用OCR
  A.post('/paid/baidu-ocr', ah(async function(q, r) {
    var img = (q.body && q.body.image) || ''; if (!img) return r.json({ error: 'image required' });
    r.json({ success: true, data: await bc(OCR + '/general_basic', { image: img }), provider: 'baidu-ocr' });
  }));

  // 2. 高精度OCR
  A.post('/paid/baidu-ocr-accurate', ah(async function(q, r) {
    var img = (q.body && q.body.image) || ''; if (!img) return r.json({ error: 'image required' });
    r.json({ success: true, data: await bc(OCR + '/accurate_basic', { image: img }), provider: 'baidu-ocr-accurate' });
  }));

  // 3. 表格识别
  A.post('/paid/baidu-table', ah(async function(q, r) {
    var img = (q.body && q.body.image) || ''; if (!img) return r.json({ error: 'image required' });
    r.json({ success: true, data: await bc(OCR + '/table', { image: img }), provider: 'baidu-table' });
  }));

  // 4. 语音合成
  A.post('/paid/baidu-tts', ah(async function(q, r) {
    var text = (q.body && q.body.text) || ''; if (!text) return r.json({ error: 'text required' });
    var t = await gt(); if (!t) return r.json({ error: 'auth_failed' });
    try {
      var a = await X.get('https://tsn.baidu.com/text2audio', {
        params: { tex: text, tok: t, cuid: 'gb', ctp: 1, lan: 'zh', spd: 5, pit: 5, vol: 5, per: 0 },
        responseType: 'arraybuffer', timeout: 15000
      });
      r.set('Content-Type', 'audio/mp3'); r.send(Buffer.from(a.data));
    } catch(e) { r.json({ error: e.message }); }
  }));

  // 5. 文本翻译
  A.post('/paid/baidu-translate', ah(async function(q, r) {
    var text = (q.body && q.body.text) || ''; var from = (q.body && q.body.from) || 'auto'; var to = (q.body && q.body.to) || 'en';
    if (!text) return r.json({ error: 'text required' });
    var d = await bc(OCR + '/translate', { q: text, from: from, to: to });
    r.json({ success: true, data: d, provider: 'baidu-translate' });
  }));

  // 6. 银行卡识别
  A.post('/paid/baidu-bank-card', ah(async function(q, r) {
    var img = (q.body && q.body.image) || ''; if (!img) return r.json({ error: 'image required' });
    r.json({ success: true, data: await bc(OCR + '/bankcard', { image: img }), provider: 'baidu-bank-card' });
  }));

  // 7. 营业执照识别
  A.post('/paid/baidu-business-license', ah(async function(q, r) {
    var img = (q.body && q.body.image) || ''; if (!img) return r.json({ error: 'image required' });
    r.json({ success: true, data: await bc(OCR + '/business_license', { image: img }), provider: 'baidu-business-license' });
  }));

  // 8. 护照识别
  A.post('/paid/baidu-passport', ah(async function(q, r) {
    var img = (q.body && q.body.image) || ''; if (!img) return r.json({ error: 'image required' });
    r.json({ success: true, data: await bc(OCR + '/passport', { image: img }), provider: 'baidu-passport' });
  }));

  // 9. 通用物体识别
  A.post('/paid/baidu-object-detect', ah(async function(q, r) {
    var img = (q.body && q.body.image) || ''; if (!img) return r.json({ error: 'image required' });
    r.json({ success: true, data: await bc(IC + '/advanced_general', { image: img }), provider: 'baidu-object-detect' });
  }));

  // 10. 图像增强
  A.post('/paid/baidu-image-enhance', ah(async function(q, r) {
    var img = (q.body && q.body.image) || ''; if (!img) return r.json({ error: 'image required' });
    r.json({ success: true, data: await bc(IPC + '/image_definition_enhance', { image: img }), provider: 'baidu-image-enhance' });
  }));

  // 11. 智能抠图
  A.post('/paid/baidu-remove-bg', ah(async function(q, r) {
    var img = (q.body && q.body.image) || ''; if (!img) return r.json({ error: 'image required' });
    var t = await gt(); if (!t) return r.json({ error: 'auth_failed' });
    try {
      var d = await X.post(IPC + '/selfie_anime?access_token=' + t,
        new URLSearchParams({ image: img }).toString(),
        { headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 15000 }
      );
      r.json({ success: true, data: d.data, provider: 'baidu-remove-bg' });
    } catch(e) { r.json({ error: e.message }); }
  }));

  // 12. 文心大模型
  A.post('/paid/baidu-llm-chat', ah(async function(q, r) {
    var msg = (q.body && q.body.message) || (q.body && q.body.content) || '';
    var model = (q.body && q.body.model) || 'ernie-4.5-8k-preview';
    var messages = (q.body && q.body.messages) || [{ role: 'user', content: msg }];
    if (!msg && !(q.body && q.body.messages)) return r.json({ error: 'message required' });
    try {
      var resp = await X.post('https://qianfan.baidubce.com/v2/chat/completions', {
        model: model, messages: messages, max_tokens: 2048, temperature: 0.7
      }, {
        headers: { 'Authorization': 'Bearer ' + BA, 'Content-Type': 'application/json' }, timeout: 20000
      });
      r.json({ success: true, response: resp.data.choices[0].message.content, model: model, provider: 'baidu-ernie' });
    } catch(e) { r.json({ error: e.message }); }
  }));

  console.log('[baidu] 12 routes loaded');
};
