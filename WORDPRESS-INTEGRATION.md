# WordPress Integration Guide

Integrare l'AI Chat Widget nel tuo sito WordPress.

## ☁️ Prerequisites

**Widget già deployato su Netlify?** ✅  
Se sì, usa l'URL Netlify (es. `https://your-widget.netlify.app`).  
Se no, segui [NETLIFY-DEPLOY.md](NETLIFY-DEPLOY.md) prima di continuare.

**Vantaggi Netlify:**
- ✅ HTTPS automatico
- ✅ CDN globale (velocità)
- ✅ Deploy automatici
- ✅ SSL certificati gratis
- ✅ Nessun server da gestire

---

## 🚀 Opzione 1: Embed Script (Consigliato)

### Vantaggi
- ✅ Facile da installare (2 minuti)
- ✅ Si integra perfettamente con il design
- ✅ Nessun iframe visibile
- ✅ Funziona su tutte le pagine automaticamente
- ✅ Cookie e sessioni funzionano

### Installazione

#### 1. Ottieni il tuo URL Netlify

Esempio: `https://your-widget.netlify.app`

#### 2. In WordPress, vai su **Aspetto → Editor del tema** o installa plugin **"Insert Headers and Footers"**

**Metodo A: Editor del tema (Avanzato)**

Modifica `footer.php` e aggiungi prima di `</body>`:

```html
<!-- AI Chat Widget -->
<script>
  window.AIWidgetConfig = {
    baseUrl: 'https://your-widget.netlify.app'
  };
</script>
<script src="https://your-widget.netlify.app/embed.js"></script>
```

**Metodo B: Plugin "Insert Headers and Footers" (Facile) ⭐**

1. Installa plugin: **Dashboard → Plugin → Aggiungi nuovo → Cerca "Insert Headers and Footers"**
2. Vai su **Impostazioni → Insert Headers and Footers**
3. Incolla lo snippet nella sezione **Scripts in Footer**
4. Salva

#### 3. Verifica

Visita qualsiasi pagina del tuo sito WordPress.  
Dovresti vedere il pulsante 💬 in basso a destra!

#### 3. **Alternativa: tramite Plugin "Insert Headers and Footers"**

1. Installa il plugin "Insert Headers and Footers"
2. Vai su **Impostazioni → Insert Headers and Footers**
3. Incolla lo snippet nella sezione **Footer**
4. Salva

---

## 🖼️ Opzione 2: Iframe in Elementor

Se preferisci un iframe (più semplice ma meno integrato):

### Installazione

#### 1. Crea una nuova pagina o modifica esistente con Elementor

#### 2. Aggiungi un widget **HTML** nella posizione desiderata

#### 3. Incolla questo codice:

```html
<iframe 
  src="https://kpsfinanciallab.w3pro.it:3000" 
  width="100%" 
  height="600" 
  frameborder="0"
  style="border: none; box-shadow: 0 4px 12px rgba(0,0,0,0.1); border-radius: 8px;"
></iframe>
```

### Limitazioni Iframe
- ❌ Cookie potrebbero non funzionare cross-domain
- ❌ Meno integrato visivamente
- ❌ Problemi di responsive su mobile
- ✅ Pro: Più semplice da installare

---

## 🎨 Opzione 3: Bottone Fluttuante con Elementor

Crea un pulsante che apre il widget in un popup:

### 1. Aggiungi un widget **Button** in Elementor

Posizionalo in basso a destra con:
- Position: Fixed
- Bottom: 20px
- Right: 20px
- Z-index: 9999

### 2. Nelle impostazioni del bottone, aggiungi:

**Link:**
```
#ai-chat-popup
```

**CSS Class:**
```
ai-chat-trigger
```

### 3. Aggiungi un widget **Popup** (Elementor Pro richiesto)

Crea un popup con ID `ai-chat-popup` contenente l'iframe:

```html
<iframe 
  src="https://kpsfinanciallab.w3pro.it:3000/widget" 
  width="400" 
  height="600" 
  frameborder="0"
  style="border: none;"
></iframe>
```

### 4. Configura il popup per aprirsi al click del bottone

---

## 🔧 Configurazione Avanzata

### Personalizzare l'embed script

```html
<script>
  window.AIWidgetConfig = {
    baseUrl: 'https://your-widget.netlify.app',
    // Configurazioni future (non ancora implementate):
    // position: 'bottom-right',
    // buttonText: '💬 Hai bisogno di aiuto?',
    // buttonColor: '#667eea'
  };
</script>
<script src="https://your-widget.netlify.app/embed.js"></script>
```

### CORS e Cookie

**Netlify gestisce automaticamente:**
- ✅ HTTPS con certificato SSL
- ✅ CORS headers configurati in `netlify.toml`
- ✅ Cookie SameSite compatibility

**Il widget funziona su qualsiasi dominio** grazie alla configurazione CORS in `netlify.toml`:

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Access-Control-Allow-Origin = "https://kpsfinanciallab.w3pro.it"
    Access-Control-Allow-Credentials = "true"
```

**Per permettere più domini:**

Modifica `netlify.toml` e fai commit:
```toml
Access-Control-Allow-Origin = "https://kpsfinanciallab.w3pro.it, https://altro-sito.com"
```

Netlify ricaricherà automaticamente la configurazione.

---

## 📱 Mobile Responsive

L'embed script è già responsive. Su mobile:
- Il widget occupa tutto lo schermo
- Il pulsante resta visibile in basso a destra
- Si chiude con swipe down o tasto ESC

### CSS Personalizzato per Mobile

Aggiungi in **Aspetto → Personalizza → CSS Aggiuntivo**:

```css
@media (max-width: 768px) {
  #ai-chat-widget-iframe {
    width: 100% !important;
    height: 100% !important;
    top: 0 !important;
    left: 0 !important;
  }
  
  #ai-chat-widget-button {
    bottom: 10px !important;
    right: 10px !important;
    width: 50px !important;
    height: 50px !important;
  }
}
```

---

## 🛡️ Sicurezza

### HTTPS Richiesto

Assicurati che:
- WordPress sia su HTTPS
- Il widget sia su HTTPS
- Open-Notebook sia su HTTPS

### Limitare l'accesso

Modifica `next.config.js` per consentire solo il tuo dominio:

```javascript
async headers() {
  return [
    {
      source: '/api/:path*',
      headers: [
        { key: 'Access-Control-Allow-Origin', value: 'https://kpsfinanciallab.w3pro.it' },
        { key: 'Access-Control-Allow-Credentials', value: 'true' },
      ],
    },
  ];
}
```

---

## 🧪 Testing

### Test locale
```
http://localhost:3000/widget
```

### Test produzione
```
https://kpsfinanciallab.w3pro.it:3000/widget
```

### Debug

Apri la console del browser (F12) e verifica:
1. Il file `embed.js` carica correttamente
2. Nessun errore CORS
3. I cookie vengono salvati
4. Le richieste API arrivano a Open-Notebook

---

## 🚀 Deploy in Produzione

### Con Netlify (Raccomandato) ⭐

Segui la guida completa: [NETLIFY-DEPLOY.md](NETLIFY-DEPLOY.md)

**In breve:**
1. Push del codice su GitHub/GitLab
2. Connetti repository a Netlify
3. Configura environment variables
4. Deploy automatico!

Netlify ti darà un URL tipo: `https://your-widget.netlify.app`

**Vantaggi:**
- ✅ HTTPS gratis
- ✅ CDN globale
- ✅ Deploy automatici su ogni push
- ✅ Preview URLs per PR
- ✅ Rollback con un click
- ✅ Zero manutenzione server

### Self-Hosting (Alternativa)

Se preferisci hostare tu stesso:

#### 1. Build

```bash
cd /home/brix-ia/DEV/ai-widget
npm run build
```

#### 2. Start con PM2

```bash
npm install -g pm2
pm2 start npm --name "ai-widget" -- start
pm2 save
pm2 startup
```

#### 3. Nginx reverse proxy

```nginx
server {
    listen 443 ssl;
    server_name your-domain.com;

    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Svantaggi self-hosting:**
- ❌ Devi gestire SSL manualmente
- ❌ Nessun CDN (più lento globalmente)
- ❌ Deploy manuali
- ❌ Manutenzione server

### Verifica Installazione

Vai su qualsiasi pagina WordPress e dovresti vedere il pulsante 💬 in basso a destra.

**Test checklist:**
- [ ] Pulsante visibile
- [ ] Chat si apre al click
- [ ] Messaggi vengono inviati
- [ ] Sessione persiste dopo reload
- [ ] Funziona su mobile

---

## 💡 Best Practices

1. **Testa sempre in staging** prima di pubblicare in produzione
2. **Monitora i log** del widget e di Open-Notebook per errori
3. **Usa PM2** per auto-restart del widget in caso di crash
4. **Configura HTTPS** su tutti i servizi
5. **Fai backup** delle configurazioni
6. **Testa su mobile** e diversi browser

---

## 🆘 Troubleshooting

### Il widget non appare

**Check:**
1. Il widget è in esecuzione? `curl http://localhost:3000`
2. Il file `embed.js` è accessibile? `curl https://kpsfinanciallab.w3pro.it:3000/embed.js`
3. Controlla la console del browser (F12) per errori JavaScript

### Errori CORS

**Soluzione:**
Aggiungi header CORS in `next.config.js` (vedi sezione Sicurezza)

### Cookie non funzionano

**Problema:** Dominio diverso tra WordPress e widget

**Soluzione:**
- Usa un reverse proxy per hostare widget sullo stesso dominio
- Oppure disabilita SameSite cookie (meno sicuro)

### Widget lento a caricare

**Soluzione:**
1. Fai il build di produzione: `npm run build`
2. Ottimizza le immagini in `/public`
3. Usa un CDN per servire asset statici

---

## 📚 Risorse

- [Next.js Documentation](https://nextjs.org/docs)
- [Elementor Documentation](https://elementor.com/help/)
- [WordPress Codex](https://codex.wordpress.org/)
- [Open-Notebook API Docs](https://kpsfinanciallab.w3pro.it:5055/docs)

---

**Hai bisogno di aiuto?** Apri un'issue o contatta il supporto.
