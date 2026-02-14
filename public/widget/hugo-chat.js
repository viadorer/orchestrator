(function() {
  'use strict';

  // Config from script tag data attributes
  var script = document.currentScript;
  var projectId = script.getAttribute('data-project-id');
  var position = script.getAttribute('data-position') || 'right'; // 'left' or 'right'
  var color = script.getAttribute('data-color') || '#7c3aed'; // violet-600
  var accent = script.getAttribute('data-accent') || color;
  var baseUrl = script.getAttribute('data-base-url') || script.src.replace('/widget/hugo-chat.js', '');

  if (!projectId) {
    console.error('Hugo Chat: data-project-id is required');
    return;
  }

  // Create toggle button
  var btn = document.createElement('div');
  btn.id = 'hugo-chat-toggle';
  btn.style.cssText = 'position:fixed;bottom:20px;' + position + ':20px;width:60px;height:60px;border-radius:50%;background:' + color + ';cursor:pointer;z-index:99999;display:flex;align-items:center;justify-content:center;box-shadow:0 4px 20px rgba(0,0,0,0.3);transition:transform 0.2s,box-shadow 0.2s;';
  btn.innerHTML = '<svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>';
  btn.onmouseenter = function() { btn.style.transform = 'scale(1.1)'; btn.style.boxShadow = '0 6px 25px rgba(0,0,0,0.4)'; };
  btn.onmouseleave = function() { btn.style.transform = 'scale(1)'; btn.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)'; };

  // Create chat iframe container
  var container = document.createElement('div');
  container.id = 'hugo-chat-container';
  container.style.cssText = 'position:fixed;bottom:90px;' + position + ':20px;width:380px;height:560px;border-radius:16px;overflow:hidden;box-shadow:0 10px 40px rgba(0,0,0,0.4);z-index:99998;display:none;transition:opacity 0.2s,transform 0.2s;opacity:0;transform:translateY(10px);';

  var iframe = document.createElement('iframe');
  iframe.src = baseUrl + '/chat/' + projectId + '?color=' + encodeURIComponent(color) + '&accent=' + encodeURIComponent(accent);
  iframe.style.cssText = 'width:100%;height:100%;border:none;';
  iframe.allow = 'clipboard-write';
  container.appendChild(iframe);

  // Unread badge
  var badge = document.createElement('div');
  badge.id = 'hugo-chat-badge';
  badge.style.cssText = 'position:absolute;top:-2px;right:-2px;width:18px;height:18px;border-radius:50%;background:#ef4444;color:white;font-size:11px;font-weight:bold;display:none;align-items:center;justify-content:center;';
  badge.textContent = '1';
  btn.style.position = 'fixed'; // Ensure btn is positioned
  btn.appendChild(badge);

  // Toggle
  var isOpen = false;
  btn.onclick = function() {
    isOpen = !isOpen;
    if (isOpen) {
      container.style.display = 'block';
      badge.style.display = 'none';
      setTimeout(function() {
        container.style.opacity = '1';
        container.style.transform = 'translateY(0)';
      }, 10);
      btn.innerHTML = '<svg width="24" height="24" fill="none" stroke="white" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/></svg>';
    } else {
      container.style.opacity = '0';
      container.style.transform = 'translateY(10px)';
      setTimeout(function() { container.style.display = 'none'; }, 200);
      btn.innerHTML = '<svg width="28" height="28" fill="none" stroke="white" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>';
    }
  };

  // Mobile responsive
  var mq = window.matchMedia('(max-width: 480px)');
  function handleMobile(e) {
    if (e.matches) {
      container.style.width = 'calc(100vw - 20px)';
      container.style.height = 'calc(100vh - 120px)';
      container.style.left = '10px';
      container.style.right = '10px';
      container.style.bottom = '80px';
    } else {
      container.style.width = '380px';
      container.style.height = '560px';
      container.style.left = '';
      container.style.right = '';
      container.style[position] = '20px';
      container.style.bottom = '90px';
    }
  }
  mq.addEventListener('change', handleMobile);
  handleMobile(mq);

  // Show welcome badge after 3 seconds
  setTimeout(function() {
    if (!isOpen) {
      badge.style.display = 'flex';
    }
  }, 3000);

  // Append to DOM
  document.body.appendChild(container);
  document.body.appendChild(btn);
})();
