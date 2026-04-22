# Quick Start: Deploy to Netlify + WordPress Integration

Guida rapida in 10 minuti per portare il widget live.

## ✅ Checklist Pre-Deploy

- [ ] Hai un account GitHub/GitLab (gratis)
- [ ] Hai un account Netlify (gratis)
- [ ] Hai accesso al sito WordPress
- [ ] Open-Notebook è accessibile via HTTPS

---

## 📋 Step-by-Step (10 minuti)

### 1️⃣ Push to GitHub (2 min)

```bash
cd /home/brix-ia/DEV/ai-widget

# Init git se non fatto
git init

# Add all files
git add .

# Commit
git commit -m "AI Chat Widget ready for deploy"

# Crea repository su GitHub.com
# Poi collega:
git remote add origin https://github.com/YOUR_USERNAME/ai-widget.git
git branch -M main
git push -u origin main
```

**✅ Checkpoint:** Codice su GitHub

---

### 2️⃣ Deploy su Netlify (3 min)

1. Vai su [app.netlify.com](https://app.netlify.com)
2. Click **"Add new site"** → **"Import an existing project"**
3. Scegli **GitHub**
4. Seleziona repository **`ai-widget`**
5. Build settings (dovrebbe auto-rilevare):
   - Build command: `npm run build`
   - Publish directory: `.next`
6. Click **"Deploy site"**

⏳ Attendi ~2 minuti...

**✅ Checkpoint:** Site deployed! URL tipo `random-name-123.netlify.app`

---

### 3️⃣ Configura Environment Variables (2 min)

1. Nel sito Netlify, vai a **Site settings** → **Environment variables**
2. Click **"Add a variable"**
3. Aggiungi queste 4 variabili:

```
Key: OPEN_NOTEBOOK_ENDPOINT
Value: https://kpsfinanciallab.w3pro.it:5055

Key: OPEN_NOTEBOOK_NOTEBOOK_ID
Value: notebook:wcey1gczvhr6vbdxyyn5

Key: OPEN_NOTEBOOK_STRATEGY_MODEL
Value: model:0thy08wqjik4v5y6ftqq

Key: OPEN_NOTEBOOK_CHAT_MODEL
Value: model:0thy08wqjik4v5y6ftqq
```

4. Click **"Save"**
5. Vai a **Deploys** → Click **"Trigger deploy"** → **"Clear cache and deploy site"**

⏳ Attendi ~2 minuti per rebuild...

**✅ Checkpoint:** Variables configurate, sito rebuilded

---

### 4️⃣ Ottieni URL finale (1 min)

**Opzione A: Usa URL Netlify default**

URL tipo: `https://random-name-123.netlify.app`

**Opzione B: Personalizza subdomain (gratis)**

1. **Site settings** → **Domain management** → **Edit site name**
2. Cambia in: `your-widget` (se disponibile)
3. Nuovo URL: `https://your-widget.netlify.app`

**✅ Checkpoint:** Hai il tuo URL definitivo

---

### 5️⃣ Test il Widget (1 min)

Apri nel browser:
```
https://your-widget.netlify.app/test-embed.html
```

**Verifica:**
- [ ] Pagina carica correttamente
- [ ] Vedi pulsante 💬 in basso a destra
- [ ] Click apre la chat
- [ ] Puoi inviare messaggi

**✅ Checkpoint:** Widget funziona!

---

### 6️⃣ Integra in WordPress (2 min)

**Metodo Facile (con plugin):**

1. In WordPress Dashboard, vai a **Plugin** → **Aggiungi nuovo**
2. Cerca **"Insert Headers and Footers"**
3. Installa e attiva
4. Vai a **Impostazioni** → **Insert Headers and Footers**
5. Nella sezione **"Scripts in Footer"**, incolla:

```html
<!-- AI Chat Widget -->
<script>
  window.AIWidgetConfig = {
    baseUrl: 'https://your-widget.netlify.app'
  };
</script>
<script src="https://your-widget.netlify.app/embed.js"></script>
```

6. Click **"Save"**

**✅ Checkpoint:** Script installato

---

### 7️⃣ Verifica su WordPress (1 min)

1. Apri il tuo sito WordPress in una **nuova finestra incognito**
2. Vai su qualsiasi pagina
3. Dovresti vedere il pulsante 💬 in basso a destra
4. Click per aprire la chat
5. Invia un messaggio di test

**Test completo:**
- [ ] Pulsante appare
- [ ] Chat si apre
- [ ] Messaggio inviato
- [ ] Risposta ricevuta
- [ ] Funziona dopo page reload (sessione persiste)

**✅ Checkpoint:** TUTTO FUNZIONA! 🎉

---

## 🎉 Fatto!

Il tuo AI Chat Widget è ora live su WordPress!

### 📊 Prossimi Steps (opzionali)

**Personalizzazione:**
- [ ] Cambia colori del pulsante
- [ ] Modifica testo di benvenuto
- [ ] Aggiungi quick actions personalizzate

**Monitoring:**
- [ ] Setup Google Analytics
- [ ] Monitora conversazioni
- [ ] Raccogli feedback utenti

**Ottimizzazione:**
- [ ] Testa su mobile
- [ ] Verifica velocità caricamento
- [ ] A/B test diverse posizioni del pulsante

---

## 🆘 Troubleshooting

### Il widget non appare su WordPress

**Check:**
1. Vai a `https://your-widget.netlify.app/test-embed.html` - funziona?
2. Se sì: problema WordPress
3. Se no: problema deploy Netlify

**Fix WordPress:**
- Controlla che lo script sia nel Footer (non Header)
- Prova disabilitare altri plugin per conflict
- Controlla console browser (F12) per errori

### Errore "Failed to get response"

**Check:**
1. Open-Notebook è raggiungibile? `curl https://kpsfinanciallab.w3pro.it:5055/health`
2. Environment variables corrette in Netlify?
3. Notebook ID esiste in Open-Notebook?

**Fix:**
- Verifica `.env` variables in Netlify
- Controlla che Open-Notebook sia up
- Test API endpoint direttamente

### Cookie non funzionano (sessione non persiste)

**Check:**
1. WordPress e widget entrambi su HTTPS? (non misto HTTP/HTTPS)
2. Nessun plugin WordPress che blocca cookies?

**Fix:**
- Assicurati tutto sia HTTPS
- Controlla SameSite cookie policy

---

## 📚 Documentazione Completa

- [NETLIFY-DEPLOY.md](NETLIFY-DEPLOY.md) - Deploy dettagliato
- [WORDPRESS-INTEGRATION.md](WORDPRESS-INTEGRATION.md) - Integrazione avanzata
- [DEPLOYMENT-OPTIONS.md](DEPLOYMENT-OPTIONS.md) - Confronto opzioni
- [README.md](README.md) - Documentazione generale

---

## 💬 Supporto

- GitHub Issues: [ai-widget/issues](https://github.com/YOUR_USERNAME/ai-widget/issues)
- Netlify Support: [support.netlify.com](https://support.netlify.com)
- Open-Notebook: [GitHub](https://github.com/lfnovo/open-notebook/issues)

---

**Congratulazioni! 🎊**  
Il tuo AI Chat Widget è ora operativo!
