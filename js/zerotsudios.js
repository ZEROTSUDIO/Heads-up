/**
 * Zerotsudios UI - Micro Interactions & Utility Library
 * Standalone JavaScript for interactive components
 */

(function () {
  'use strict';

  // 1. Toast Notification Manager
  function showToast(message, type = 'info') {
    let container = document.getElementById('zero-toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'zero-toast-container';
      container.className = 'fixed bottom-6 right-6 z-50 flex flex-col gap-3 pointer-events-none';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'pointer-events-auto flex items-center gap-3 bg-[#0A090D] text-white px-4 py-3 border-2 border-white shadow-[4px_4px_0_#892BE2] transition-all transform translate-y-2 opacity-0 duration-200 font-mono text-xs';
    
    let icon = `<span class="w-2.5 h-2.5 rounded-full bg-[#C06BF0] inline-block animate-pulse"></span>`;
    if (type === 'success') {
      icon = `<span class="w-2.5 h-2.5 bg-[#4EE085] inline-block"></span>`;
    } else if (type === 'error') {
      icon = `<span class="w-2.5 h-2.5 bg-[#FF5C5C] inline-block"></span>`;
    }

    toast.innerHTML = `
      ${icon}
      <span class="tracking-wider uppercase font-bold">${escapeHtml(message)}</span>
      <button class="ml-3 text-white/50 hover:text-white text-sm font-mono leading-none">&times;</button>
    `;

    const closeBtn = toast.querySelector('button');
    closeBtn.addEventListener('click', () => removeToast(toast));

    container.appendChild(toast);

    // Animate in
    requestAnimationFrame(() => {
      toast.classList.remove('translate-y-2', 'opacity-0');
      toast.classList.add('translate-y-0', 'opacity-100');
    });

    // Auto dismiss after 3.2s
    const timeout = setTimeout(() => {
      removeToast(toast);
    }, 3200);

    function removeToast(el) {
      clearTimeout(timeout);
      el.classList.add('opacity-0', 'translate-y-2');
      setTimeout(() => {
        if (el.parentNode) el.parentNode.removeChild(el);
      }, 200);
    }
  }

  function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  // 2. Clipboard Copy Helper
  function initCopyButtons() {
    document.addEventListener('click', function (e) {
      const copyBtn = e.target.closest('[data-copy]');
      if (!copyBtn) return;

      const targetSelector = copyBtn.getAttribute('data-copy');
      let textToCopy = '';

      if (targetSelector.startsWith('#') || targetSelector.startsWith('.')) {
        const targetEl = document.querySelector(targetSelector);
        if (targetEl) {
          textToCopy = targetEl.getAttribute('data-code') || targetEl.textContent.trim();
        }
      } else {
        textToCopy = targetSelector; // literal value
      }

      if (!textToCopy) return;

      navigator.clipboard.writeText(textToCopy).then(() => {
        const originalText = copyBtn.innerHTML;
        copyBtn.innerHTML = `<span>COPIED!</span>`;
        copyBtn.classList.add('bg-[#4EE085]', 'text-black');
        showToast('COPIED TO CLIPBOARD', 'success');

        setTimeout(() => {
          copyBtn.innerHTML = originalText;
          copyBtn.classList.remove('bg-[#4EE085]', 'text-black');
        }, 1800);
      }).catch(err => {
        console.error('Copy failed: ', err);
        showToast('FAILED TO COPY', 'error');
      });
    });
  }

  // 3. Modal Dialog Manager
  function openModal(modal) {
    const el = typeof modal === 'string' ? document.getElementById(modal) : modal;
    if (!el) return;
    el.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  function closeModal(modal) {
    const el = typeof modal === 'string' ? document.getElementById(modal) : modal;
    if (!el) return;
    el.classList.remove('active');
    if (!document.querySelector('.modal-overlay.active, .modal-backdrop.active')) {
      document.body.style.overflow = '';
    }
  }

  function initModals() {
    // Click triggers: Open, Close, and Backdrop click
    document.addEventListener('click', function (e) {
      // Open trigger
      const openTrigger = e.target.closest('[data-modal-open]');
      if (openTrigger) {
        const modalId = openTrigger.getAttribute('data-modal-open');
        openModal(modalId);
        return;
      }

      // Close trigger button
      const closeTrigger = e.target.closest('[data-modal-close]');
      if (closeTrigger) {
        const modal = closeTrigger.closest('.modal-overlay, .modal-backdrop');
        if (modal) closeModal(modal);
        return;
      }

      // Backdrop click
      if (e.target.classList.contains('modal-overlay') || e.target.classList.contains('modal-backdrop')) {
        closeModal(e.target);
      }
    });

    // Close on Escape key
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') {
        const openModals = document.querySelectorAll('.modal-overlay.active, .modal-backdrop.active');
        openModals.forEach(modal => closeModal(modal));
      }
    });
  }

  // 4. Sidebar Toggle Controller
  function initSidebar() {
    document.addEventListener('click', function (e) {
      const toggle = e.target.closest('[data-sidebar-toggle]');
      if (!toggle) return;

      const sidebarSelector = toggle.getAttribute('data-sidebar-toggle') || '#studio-sidebar';
      const sidebar = document.querySelector(sidebarSelector);
      if (sidebar) {
        sidebar.classList.toggle('collapsed');
        const isCollapsed = sidebar.classList.contains('collapsed');
        toggle.setAttribute('aria-expanded', !isCollapsed);
      }
    });
  }

  // 5. Code Tabs Switcher (Preview vs Code)
  function initTabs() {
    document.addEventListener('click', function (e) {
      const tabBtn = e.target.closest('[data-tab-target]');
      if (!tabBtn) return;

      const container = tabBtn.closest('[data-tabs]');
      if (!container) return;

      const targetId = tabBtn.getAttribute('data-tab-target');

      // Update active tab buttons
      container.querySelectorAll('[data-tab-target]').forEach(btn => {
        btn.classList.remove('active', 'bg-[#0A090D]', 'text-white');
        btn.classList.add('bg-transparent', 'text-black');
      });
      tabBtn.classList.add('active', 'bg-[#0A090D]', 'text-white');
      tabBtn.classList.remove('bg-transparent', 'text-black');

      // Switch panes
      container.querySelectorAll('[data-tab-pane]').forEach(pane => {
        pane.classList.add('hidden');
      });
      const activePane = container.querySelector(`[data-tab-pane="${targetId}"]`);
      if (activePane) {
        activePane.classList.remove('hidden');
      }
    });
  }

  // 6. HUD Bar Fill Animation
  function initHudBars() {
    const bars = document.querySelectorAll('.hud-bar-fill[data-percent]');
    bars.forEach(bar => {
      const pct = bar.getAttribute('data-percent') || '0';
      bar.style.width = '0%';
      setTimeout(() => {
        bar.style.transition = 'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)';
        bar.style.width = `${pct}%`;
      }, 150);
    });
  }

  // Expose global API immediately so inline onclick handlers can always access it
  window.Zerotsudios = {
    toast: showToast,
    openModal: openModal,
    closeModal: closeModal
  };

  // Initialize on DOMContentLoaded or immediately if DOM is already loaded
  function initAll() {
    initCopyButtons();
    initModals();
    initSidebar();
    initTabs();
    initHudBars();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAll);
  } else {
    initAll();
  }
})();
