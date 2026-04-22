(function() {
  // AI Chat Widget Embed Script
  // Usage: <script src="https://kpsfinanciallab.w3pro.it:3000/embed.js"></script>
  
  if (typeof window.AIWidget !== 'undefined') {
    console.warn('AI Widget already loaded');
    return;
  }

  window.AIWidget = {
    init: function(config) {
      config = config || {};
      
      // Create iframe for isolation
      const iframe = document.createElement('iframe');
      iframe.id = 'ai-chat-widget-iframe';
      iframe.src = (config.baseUrl || 'https://kpsfinanciallab.w3pro.it:3000') + '/widget';
      iframe.style.cssText = `
        position: fixed;
        bottom: 0;
        right: 0;
        width: 400px;
        height: 600px;
        border: none;
        z-index: 999999;
        box-shadow: -2px 0 10px rgba(0,0,0,0.1);
        transition: transform 0.3s ease;
        transform: translateX(100%);
      `;
      
      // Add to page
      document.body.appendChild(iframe);
      
      // Create trigger button
      const button = document.createElement('button');
      button.id = 'ai-chat-widget-button';
      button.innerHTML = '💬';
      button.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
        border: none;
        font-size: 28px;
        cursor: pointer;
        box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
        z-index: 999998;
        transition: transform 0.2s, box-shadow 0.2s;
      `;
      
      button.onmouseover = function() {
        this.style.transform = 'scale(1.1)';
        this.style.boxShadow = '0 6px 16px rgba(102, 126, 234, 0.6)';
      };
      
      button.onmouseout = function() {
        this.style.transform = 'scale(1)';
        this.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
      };
      
      let isOpen = false;
      button.onclick = function() {
        isOpen = !isOpen;
        iframe.style.transform = isOpen ? 'translateX(0)' : 'translateX(100%)';
        button.innerHTML = isOpen ? '✕' : '💬';
      };
      
      document.body.appendChild(button);
      
      // Handle ESC key to close
      document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && isOpen) {
          isOpen = false;
          iframe.style.transform = 'translateX(100%)';
          button.innerHTML = '💬';
        }
      });
      
      console.log('AI Chat Widget initialized');
    }
  };
  
  // Auto-init if config present
  if (typeof window.AIWidgetConfig !== 'undefined') {
    window.AIWidget.init(window.AIWidgetConfig);
  }
})();
