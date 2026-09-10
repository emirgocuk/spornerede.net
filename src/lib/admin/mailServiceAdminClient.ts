import {
  initRichTextEditor,
  destroyRichTextEditor,
  getRichTextContent,
  setRichTextContent,
} from './richTextEditor';

type ApiDeps = {
  apiGet: (path: string) => Promise<any>;
  apiPost: (path: string, body: Record<string, unknown>) => Promise<any>;
};

const PRESETS: Record<string, { subject: string; preheader: string; ctaText: string; ctaUrl: string; html: string }> = {
  announcement: {
    subject: '📢 SporNerede.net 2026-2027 Yeni Sezon Kulüp Gelişmeleri',
    preheader: 'Yeni sezon yaklaşırken kulüplerimiz için hazırladığımız yenilikler ve fırsatlar.',
    ctaText: 'Kulüp Profilinizi İnceleyin',
    ctaUrl: 'https://spornerede.net/panel',
    html: `
<p>Yeni sezon hazırlıkları hızla devam ederken, <strong>SporNerede.net</strong> üzerinde spor okulu arayan velilerin aramalarında %40'a varan bir hareketlilik gözlemliyoruz.</p>
<p>Kulübünüzün bölgenizde arama yapan veliler tarafından ilk sıralarda tercih edilmesi için birkaç önemli tavsiyemiz var:</p>
<ul>
  <li><strong>Fotoğraflar:</strong> Salon, saha ve antrenman fotoğrafları eksiksiz olan profiller 3 kat daha fazla veli araması almaktadır.</li>
  <li><strong>Yaş Grupları:</strong> 2026-2027 sezonu için açık olan yaş kategorilerini profilinize eklemeyi unutmayın.</li>
  <li><strong>İletişim Hattı:</strong> WhatsApp hattınızın doğruluğunu kulüp panelinizden teyit edebilirsiniz.</li>
</ul>
<p>Her türlü soru ve kulüp eşleştirmesi için bu e-postaya doğrudan yanıt yazabilirsiniz. Başarılı ve spor dolu bir sezon dileriz!</p>
    `.trim(),
  },
  trends: {
    subject: '📊 Bu Hafta Veliler En Çok Neyi Aradı? (SporNerede Raporu)',
    preheader: 'Bölgenizdeki spor okulu arama trendleri ve veli tercihleri.',
    ctaText: 'Kulüp Bilgilerini Güncelle',
    ctaUrl: 'https://spornerede.net/panel',
    html: `
<p>Geçtiğimiz hafta sistemimiz üzerinden spor okulu arayan yüzlerce velinin tercihlerini analiz ettik. Velilerin kulüp seçerken dikkat ettiği ilk 3 kriter:</p>
<ol>
  <li><strong>Ulaşım ve Servis İmkânı:</strong> Velilerin %42'si lokasyon ve salon imkanlarını ilk sırada soruyor.</li>
  <li><strong>Antrenör Kadrosu:</strong> BESYO mezunu ve federasyon lisanslı antrenör bilgisi güveni ciddi oranda artırıyor.</li>
  <li><strong>Haftalık Program:</strong> Hafta sonu antrenman saatlerinin açıkça yazılması velinin hızlı karar vermesini sağlıyor.</li>
</ol>
<p>Profilinizi bu bilgiler doğrultusunda güncelleyerek veli dönüşümünüzü hızlandırabilirsiniz.</p>
    `.trim(),
  },
  tactics: {
    subject: '💡 Spor Okulu Yönetiminde Veli İletişimini Kolaylaştıran 2 Taktik',
    preheader: 'Antrenörler ve kulüp yöneticileri için haftalık 1 dakikalık hap ipucu.',
    ctaText: 'SporNerede Kulüp Paneli',
    ctaUrl: 'https://spornerede.net/panel',
    html: `
<p>Antrenör hocalarımızla yaptığımız görüşmelerde en çok dile getirilen konu: <em>"Velilerin antrenman sahasına fazla müdahale etmesi."</em></p>
<p>Deneyimli kulüplerimizin uyguladığı ve çok iyi sonuç veren iki basit çözüm:</p>
<ul>
  <li><strong>Sarı Çizgi Kuralı:</strong> Veli bekleme alanıyla saha kenarı arasına konulan belirgin bir çizgi veya bariyer, müdahaleleri %70 oranında azaltıyor.</li>
  <li><strong>Haftalık 2 Dakikalık WhatsApp Özeti:</strong> Cuma günleri veli grubuna 'Bu hafta çocuklarla ne çalıştık ve haftaya ne yapacağız' şeklinde 2 dakikalık kısa bir mesaj atmak veli memnuniyetini en üst düzeye çıkarıyor.</li>
</ul>
<p>Sizin de kulübünüzde uyguladığınız ve faydasını gördüğünüz pratik yöntemler varsa bize bu maile yanıt olarak yazın, gelecek bültende diğer hocalarımızla paylaşalım!</p>
    `.trim(),
  },
  friendly_match: {
    subject: '🤝 Hazırlık Maçı Arayan Kulüplerimiz İçin Dayanışma Köprüsü',
    preheader: 'Farklı yaş kategorilerinde dostluk ve hazırlık maçı eşleştirmesi.',
    ctaText: 'Bize WhatsApp\'tan Yazın',
    ctaUrl: 'https://wa.me/905067016306',
    html: `
<p>Yeni sezon öncesi çocukların maç tecrübesi kazanması için uygun rakip kulüp bulmanın bazen zaman aldığını biliyoruz.</p>
<p>SporNerede.net bünyesindeki 160'tan fazla kulüp arasında bir <strong>Dostluk Maçı Eşleştirmesi</strong> başlatıyoruz!</p>
<p>Önümüzdeki haftalarda hazırlık maçı yapmak istediğiniz branş ve yaş grubunu (Örn: <em>U12 Basketbol</em> veya <em>U11 Voleybol</em>) bu e-postaya yanıt olarak iletmeniz yeterli. Sizi bölgenizdeki diğer kulüplerle tamamen ücretsiz olarak bir araya getirelim.</p>
    `.trim(),
  },
  blank: {
    subject: '',
    preheader: '',
    ctaText: '',
    ctaUrl: '',
    html: '<p>Duyuru veya bülten metninizi buraya yazabilirsiniz...</p>',
  },
};

export function createMailServiceAdminClient(deps: ApiDeps) {
  let isEditorReady = false;
  let isListenersBound = false;
  let cachedStats = { totalClubs: 0, clubsWithEmail: 0, queuePending: 0, queueTotal: 0 };

  function getEl<T extends HTMLElement = HTMLElement>(id: string): T | null {
    return document.getElementById(id) as T | null;
  }

  function setStatusBanner(message: string, isError = false) {
    const banner = getEl('mail-service-status');
    if (!banner) return;
    banner.textContent = message;
    banner.className = `mail-status-banner ${isError ? 'is-error' : 'is-success'}`;
    banner.style.display = 'block';
    setTimeout(() => {
      banner.style.display = 'none';
    }, 6000);
  }

  function renderClientPreview() {
    const previewFrame = getEl<HTMLIFrameElement>('mail-preview-frame');
    if (!previewFrame) return;

    const subject = (getEl<HTMLInputElement>('mail-subject')?.value || 'SporNerede.net Kulüp Duyurusu').trim();
    const preheader = (getEl<HTMLInputElement>('mail-preheader')?.value || '').trim();
    const ctaText = (getEl<HTMLInputElement>('mail-cta-text')?.value || '').trim();
    const ctaUrl = (getEl<HTMLInputElement>('mail-cta-url')?.value || '').trim();
    const bodyHtml = getRichTextContent('mail-editor-textarea') || '<p>İçerik bekleniyor...</p>';

    const fullHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { margin: 0; padding: 20px 10px; background-color: #f1f3f5; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
          .card { max-width: 580px; margin: 0 auto; background: #ffffff; border-radius: 14px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.06); border: 1px solid #e2e8f0; }
          .header { background: linear-gradient(135deg, #18191c 0%, #0d0e10 100%); padding: 22px 24px; text-align: center; border-bottom: 3px solid #E30A17; }
          .badge { display: inline-block; background: rgba(227, 10, 23, 0.16); color: #ff4d57; font-size: 11px; font-weight: 700; padding: 3px 10px; border-radius: 999px; text-transform: uppercase; margin-bottom: 6px; }
          .brand { color: #ffffff; font-size: 20px; font-weight: 800; }
          .brand span { color: #E30A17; }
          .body { padding: 28px 24px; color: #334155; line-height: 1.65; font-size: 14.5px; }
          .greeting { font-size: 14px; font-weight: 600; color: #64748b; margin-bottom: 12px; }
          .title { margin: 0 0 16px 0; font-size: 20px; font-weight: 800; color: #0f172a; line-height: 1.35; }
          .cta-wrap { text-align: center; margin: 28px 0 12px 0; }
          .cta-btn { display: inline-block; background: #E30A17; color: #ffffff !important; text-decoration: none; font-size: 14px; font-weight: 700; padding: 12px 26px; border-radius: 8px; }
          .footer { background: #f8f9fa; padding: 18px 20px; text-align: center; font-size: 11.5px; color: #94a3b8; border-top: 1px solid #e9ecef; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header" style="display: flex; justify-content: space-between; align-items: center; padding: 18px 24px;">
            <img src="/logo-email.png" alt="Spor Nerede?" width="135" height="57" style="display: block; width: 135px; height: auto;" />
            <div class="badge" style="margin-bottom: 0;">📢 Kulüp Bülteni</div>
          </div>
          <div class="body">
            <h1 class="title">${escapeHtml(subject)}</h1>
            <div>${bodyHtml}</div>
            ${
              ctaText && ctaUrl
                ? `<div class="cta-wrap"><a href="${escapeHtml(ctaUrl)}" class="cta-btn" target="_blank">${escapeHtml(ctaText)} →</a></div>`
                : ''
            }
          </div>
          <div class="footer">
            SporNerede.net • Türkiye'nin Spor Platformu<br>
            <span style="color:#adb5bd;">Bu bir önizlemedir. Canlı gönderimde kulüp adı ve branş kişiselleştirilir.</span>
          </div>
        </div>
      </body>
      </html>
    `;

    const doc = previewFrame.contentDocument || previewFrame.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(fullHtml);
      doc.close();
    }
  }

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  async function loadStats() {
    try {
      const res = await deps.apiGet('/api/admin/mail-service?action=stats');
      const stats = res?.stats || res?.data?.stats;
      if (stats) {
        cachedStats = stats;
        const totalClubsEl = getEl('mail-stat-total-clubs');
        const emailClubsEl = getEl('mail-stat-email-clubs');
        const queuePendingEl = getEl('mail-stat-queue-pending');

        if (totalClubsEl) totalClubsEl.textContent = String(stats.totalClubs);
        if (emailClubsEl) emailClubsEl.textContent = String(stats.clubsWithEmail);
        if (queuePendingEl) queuePendingEl.textContent = String(stats.queuePending);
      }
    } catch (err) {
      console.warn('[mail-service] loadStats error:', err);
    }
  }

  function applyPreset(presetKey: string) {
    const preset = PRESETS[presetKey];
    if (!preset) return;

    const subjectInput = getEl<HTMLInputElement>('mail-subject');
    const preheaderInput = getEl<HTMLInputElement>('mail-preheader');
    const ctaTextInput = getEl<HTMLInputElement>('mail-cta-text');
    const ctaUrlInput = getEl<HTMLInputElement>('mail-cta-url');

    if (subjectInput) subjectInput.value = preset.subject;
    if (preheaderInput) preheaderInput.value = preset.preheader;
    if (ctaTextInput) ctaTextInput.value = preset.ctaText;
    if (ctaUrlInput) ctaUrlInput.value = preset.ctaUrl;

    setRichTextContent('mail-editor-textarea', preset.html);
    renderClientPreview();
  }

  async function sendTestAnnouncement() {
    const testEmailInput = getEl<HTMLInputElement>('mail-test-recipient');
    const toEmail = testEmailInput?.value?.trim() || '';

    if (!toEmail || !toEmail.includes('@')) {
      setStatusBanner('Lütfen geçerli bir test e-posta adresi yazın.', true);
      return;
    }

    const subject = (getEl<HTMLInputElement>('mail-subject')?.value || '').trim();
    const preheader = (getEl<HTMLInputElement>('mail-preheader')?.value || '').trim();
    const ctaText = (getEl<HTMLInputElement>('mail-cta-text')?.value || '').trim();
    const ctaUrl = (getEl<HTMLInputElement>('mail-cta-url')?.value || '').trim();
    const icerikHtml = getRichTextContent('mail-editor-textarea');

    if (!subject || !icerikHtml) {
      setStatusBanner('Lütfen e-posta konusu ve içeriğini boş bırakmayın.', true);
      return;
    }

    const btn = getEl<HTMLButtonElement>('btn-send-test-mail');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Gönderiliyor...';
    }

    try {
      const res = await deps.apiPost('/api/admin/mail-service', {
        action: 'test_announcement',
        toEmail,
        baslik: subject,
        ozet: preheader,
        icerikHtml,
        ctaText,
        ctaUrl,
      });

      const isOk = Boolean(res?.success || res?.data?.success);
      if (isOk) {
        setStatusBanner(`✅ Test maili ${toEmail} adresine başarıyla gönderildi!`);
      } else {
        setStatusBanner(res?.error || res?.data?.error || 'Test maili gönderilemedi.', true);
      }
    } catch (err: any) {
      setStatusBanner(`Hata: ${err?.message || 'Bağlantı hatası'}`, true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '🚀 Bana Test Duyuru Maili Gönder';
      }
    }
  }

  async function sendTestApplication() {
    const testEmailInput = getEl<HTMLInputElement>('mail-test-recipient');
    const toEmail = testEmailInput?.value?.trim() || '';

    if (!toEmail || !toEmail.includes('@')) {
      setStatusBanner('Lütfen geçerli bir test e-posta adresi yazın.', true);
      return;
    }

    const btn = getEl<HTMLButtonElement>('btn-send-test-app-mail');
    if (btn) {
      btn.disabled = true;
      btn.textContent = '⏳ Gönderiliyor...';
    }

    try {
      const res = await deps.apiPost('/api/admin/mail-service', {
        action: 'test_application',
        toEmail,
      });

      const isOk = Boolean(res?.success || res?.data?.success);
      if (isOk) {
        setStatusBanner(`✅ Yeni başvuru bildirim maili ${toEmail} adresine başarıyla gönderildi!`);
      } else {
        setStatusBanner(res?.error || res?.data?.error || 'Başvuru test maili gönderilemedi.', true);
      }
    } catch (err: any) {
      setStatusBanner(`Hata: ${err?.message || 'Bağlantı hatası'}`, true);
    } finally {
      if (btn) {
        btn.disabled = false;
        btn.textContent = '📥 Yenilenen Başvuru Mailini Test Et';
      }
    }
  }

  let otpTimerInterval: ReturnType<typeof setInterval> | null = null;

  function openOtpModal(maskedEmail: string) {
    const modal = getEl('mail-otp-modal');
    if (!modal) return;

    const maskedEmailEl = getEl('mail-otp-masked-email');
    if (maskedEmailEl) maskedEmailEl.textContent = maskedEmail;

    const input = getEl<HTMLInputElement>('mail-otp-input');
    if (input) {
      input.value = '';
      input.disabled = false;
    }

    const errorEl = getEl('mail-otp-error');
    if (errorEl) {
      errorEl.style.display = 'none';
      errorEl.textContent = '';
    }

    const confirmBtn = getEl<HTMLButtonElement>('btn-mail-otp-confirm');
    if (confirmBtn) {
      confirmBtn.disabled = false;
      confirmBtn.textContent = 'Doğrula ve Gönder 🚀';
    }

    modal.style.display = 'flex';
    setTimeout(() => input?.focus(), 50);

    // 5-minute countdown (300 seconds)
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    let remaining = 300;
    const timerValEl = getEl('mail-otp-timer-val');

    const renderTimer = () => {
      const mins = Math.floor(remaining / 60);
      const secs = remaining % 60;
      if (timerValEl) {
        timerValEl.textContent = `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
      }
    };

    renderTimer();
    otpTimerInterval = setInterval(() => {
      remaining--;
      if (remaining <= 0) {
        if (otpTimerInterval) {
          clearInterval(otpTimerInterval);
          otpTimerInterval = null;
        }
        if (timerValEl) timerValEl.textContent = '00:00';
        if (errorEl) {
          errorEl.textContent = 'Güvenlik kodunun (5 dk) süresi doldu. Lütfen modalı kapatıp yeni kod talep edin.';
          errorEl.style.display = 'block';
        }
        if (confirmBtn) confirmBtn.disabled = true;
      } else {
        renderTimer();
      }
    }, 1000);
  }

  function closeOtpModal() {
    if (otpTimerInterval) {
      clearInterval(otpTimerInterval);
      otpTimerInterval = null;
    }
    const modal = getEl('mail-otp-modal');
    if (modal) modal.style.display = 'none';
  }

  let currentBulkTargetEmail = 'emrggck@gmail.com';
  let currentIsOnlyTest = true;

  async function initiateBulkSendWithOtp(forcedOnlyTestEmail?: string) {
    const subject = (getEl<HTMLInputElement>('mail-subject')?.value || '').trim();
    const icerikHtml = getRichTextContent('mail-editor-textarea');

    if (!subject || !icerikHtml) {
      setStatusBanner('Lütfen gönderimden önce konu ve içerik alanlarını doldurun.', true);
      return;
    }

    const safeToggle = getEl<HTMLInputElement>('chk-test-server-safe');
    const isSafeMode = Boolean(forcedOnlyTestEmail || safeToggle?.checked);

    if (isSafeMode) {
      currentBulkTargetEmail = forcedOnlyTestEmail || 'emrggck@gmail.com';
      currentIsOnlyTest = true;
    } else {
      currentBulkTargetEmail = 'info@spornerede.net';
      currentIsOnlyTest = false;
      const countText = cachedStats.clubsWithEmail
        ? `${cachedStats.clubsWithEmail} kulübe`
        : cachedStats.totalClubs
        ? `${cachedStats.totalClubs} kulübe`
        : 'onaylı tüm kulüplere';
      const confirmed = window.confirm(
        `⚠️ DİKKAT: Test koruma modu kapalı!\nBu duyuru ${countText} gerçek müşteriye iletilmek üzere kuyruğa alınacaktır.\n\nOnaylamak için güvenlik kodu gönderilsin mi?`
      );
      if (!confirmed) return;
    }

    const triggerBtn = forcedOnlyTestEmail
      ? getEl<HTMLButtonElement>('btn-queue-test-single')
      : getEl<HTMLButtonElement>('btn-queue-bulk-mail');

    const originalText = triggerBtn?.textContent || '';
    if (triggerBtn) {
      triggerBtn.disabled = true;
      triggerBtn.textContent = '⏳ Kod Gönderiliyor...';
    }

    try {
      const res = await deps.apiPost('/api/admin/mail-service', {
        action: 'request_bulk_otp',
      });

      const isOk = Boolean(res?.success || res?.data?.success);
      const masked = res?.maskedEmail || res?.data?.maskedEmail || 'ne***r@gmail.com';

      if (isOk) {
        openOtpModal(masked);
      } else {
        setStatusBanner(res?.error || res?.data?.error || 'Güvenlik kodu gönderilemedi.', true);
      }
    } catch (err: any) {
      setStatusBanner(`Hata: ${err?.message || 'Bağlantı hatası'}`, true);
    } finally {
      if (triggerBtn) {
        triggerBtn.disabled = false;
        triggerBtn.textContent = originalText;
      }
    }
  }

  async function submitOtpAndQueue() {
    const input = getEl<HTMLInputElement>('mail-otp-input');
    const otpCode = (input?.value || '').replace(/\D/g, '').trim();
    const errorEl = getEl('mail-otp-error');

    if (!otpCode || otpCode.length < 6) {
      if (errorEl) {
        errorEl.textContent = 'Lütfen 6 haneli güvenlik kodunu eksiksiz girin.';
        errorEl.style.display = 'block';
      }
      input?.focus();
      return;
    }

    const confirmBtn = getEl<HTMLButtonElement>('btn-mail-otp-confirm');
    if (confirmBtn) {
      confirmBtn.disabled = true;
      confirmBtn.textContent = '⏳ Doğrulanıyor ve Kuyruğa Ekleniyor...';
    }
    if (errorEl) errorEl.style.display = 'none';

    const subject = (getEl<HTMLInputElement>('mail-subject')?.value || '').trim();
    const preheader = (getEl<HTMLInputElement>('mail-preheader')?.value || '').trim();
    const ctaText = (getEl<HTMLInputElement>('mail-cta-text')?.value || '').trim();
    const ctaUrl = (getEl<HTMLInputElement>('mail-cta-url')?.value || '').trim();
    const icerikHtml = getRichTextContent('mail-editor-textarea');

    try {
      const res = await deps.apiPost('/api/admin/mail-service', {
        action: 'queue_bulk',
        otpCode,
        targetEmail: currentBulkTargetEmail,
        onlyTestEmail: currentIsOnlyTest ? currentBulkTargetEmail : undefined,
        baslik: subject,
        ozet: preheader,
        icerikHtml,
        ctaText,
        ctaUrl,
      });

      const isOk = Boolean(res?.success || res?.data?.success);
      const message = res?.message || res?.data?.message || 'Mailler başarıyla gönderim kuyruğuna eklendi!';

      if (isOk) {
        closeOtpModal();
        setStatusBanner(`🎉 ${message}`);
        await loadStats();
      } else {
        if (errorEl) {
          errorEl.textContent = res?.error || res?.data?.error || 'Doğrulama başarısız.';
          errorEl.style.display = 'block';
        }
        input?.select();
      }
    } catch (err: any) {
      if (errorEl) {
        errorEl.textContent = `Hata: ${err?.message || 'İşlem başarısız'}`;
        errorEl.style.display = 'block';
      }
    } finally {
      if (confirmBtn) {
        confirmBtn.disabled = false;
        confirmBtn.textContent = 'Doğrula ve Gönder 🚀';
      }
    }
  }

  async function mount() {
    await loadStats();

    if (!isEditorReady) {
      await initRichTextEditor('mail-editor-textarea', PRESETS.announcement.html);
      isEditorReady = true;
    }

    if (!isListenersBound) {
      isListenersBound = true;

      // Listen to preset selector
      const presetSelect = getEl<HTMLSelectElement>('mail-preset-select');
      presetSelect?.addEventListener('change', (e) => {
        const val = (e.target as HTMLSelectElement).value;
        applyPreset(val);
      });

      // Bind text inputs for live preview
      const watchedInputIds = ['mail-subject', 'mail-preheader', 'mail-cta-text', 'mail-cta-url'];
      watchedInputIds.forEach((id) => {
        getEl(id)?.addEventListener('input', () => renderClientPreview());
      });

      // Bind editor changes for live preview
      const textarea = getEl<HTMLTextAreaElement>('mail-editor-textarea');
      textarea?.addEventListener('input', () => renderClientPreview());

      // Device toggle (desktop vs mobile)
      const btnDesktop = getEl('btn-preview-desktop');
      const btnMobile = getEl('btn-preview-mobile');
      const previewWrapper = getEl('mail-preview-wrapper');

      btnDesktop?.addEventListener('click', () => {
        btnDesktop.classList.add('is-active');
        btnMobile?.classList.remove('is-active');
        if (previewWrapper) previewWrapper.style.maxWidth = '100%';
      });

      btnMobile?.addEventListener('click', () => {
        btnMobile.classList.add('is-active');
        btnDesktop?.classList.remove('is-active');
        if (previewWrapper) previewWrapper.style.maxWidth = '375px';
      });

      // Action buttons
      getEl('btn-send-test-mail')?.addEventListener('click', sendTestAnnouncement);
      getEl('btn-send-test-app-mail')?.addEventListener('click', sendTestApplication);

      // Safe mode toggle & button labels
      const safeToggle = getEl<HTMLInputElement>('chk-test-server-safe');
      const bulkBtn = getEl<HTMLButtonElement>('btn-queue-bulk-mail');
      const updateBulkBtnLabel = () => {
        if (!bulkBtn) return;
        if (safeToggle?.checked) {
          bulkBtn.textContent = '✉️ Müşteriye Gönder: emrggck@gmail.com (Kuyruk)';
          bulkBtn.style.background = 'linear-gradient(135deg, #0284c7 0%, #0369a1 100%)';
          bulkBtn.style.boxShadow = '0 4px 14px rgba(2, 132, 199, 0.3)';
        } else {
          bulkBtn.textContent = '⚠️ Tüm Müşterilere Gönder (Canlı Kuyruk)';
          bulkBtn.style.background = 'linear-gradient(135deg, #e30a17 0%, #b5080f 100%)';
          bulkBtn.style.boxShadow = '0 4px 14px rgba(227, 10, 23, 0.3)';
        }
      };
      safeToggle?.addEventListener('change', updateBulkBtnLabel);
      updateBulkBtnLabel();

      getEl('btn-queue-bulk-mail')?.addEventListener('click', () => initiateBulkSendWithOtp());
      getEl('btn-queue-test-single')?.addEventListener('click', () => initiateBulkSendWithOtp('emrggck@gmail.com'));

      // OTP Modal bindings
      getEl('btn-mail-otp-cancel')?.addEventListener('click', closeOtpModal);
      getEl('btn-mail-otp-confirm')?.addEventListener('click', submitOtpAndQueue);

      const otpModalBackdrop = getEl('mail-otp-modal');
      otpModalBackdrop?.addEventListener('click', (e) => {
        if (e.target === otpModalBackdrop) {
          closeOtpModal();
        }
      });

      const otpInput = getEl<HTMLInputElement>('mail-otp-input');
      otpInput?.addEventListener('input', () => {
        if (otpInput.value) {
          otpInput.value = otpInput.value.replace(/\D/g, '').slice(0, 6);
        }
      });
      otpInput?.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') {
          e.preventDefault();
          submitOtpAndQueue();
        } else if (e.key === 'Escape') {
          closeOtpModal();
        }
      });
    }

    renderClientPreview();
  }

  async function destroy() {
    closeOtpModal();
    await destroyRichTextEditor('mail-editor-textarea');
    isEditorReady = false;
  }

  return {
    mount,
    destroy,
    loadStats,
    renderClientPreview,
  };
}
