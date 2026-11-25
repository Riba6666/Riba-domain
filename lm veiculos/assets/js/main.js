/* ===================== LM VEÍCULOS — main.js ===================== */

(function () {
  'use strict';

  /* ---- Helpers ---- */
  const qs  = (sel, ctx = document) => ctx.querySelector(sel);
  const qsa = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  /* ===================== HEADER SCROLL ===================== */
  const header = qs('#header');
  let lastScroll = 0;

  function handleHeaderScroll() {
    const y = window.scrollY;
    if (y > 8) header.classList.add('is-scrolled');
    else header.classList.remove('is-scrolled');
    lastScroll = y;
  }
  window.addEventListener('scroll', handleHeaderScroll, { passive: true });

  /* ===================== MENU MOBILE ===================== */
  const navToggle = qs('#navToggle');
  const navList   = qs('#navList');

  navToggle.addEventListener('click', () => {
    const isOpen = navList.classList.toggle('is-open');
    navToggle.classList.toggle('is-open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));
    navToggle.setAttribute('aria-label', isOpen ? 'Fechar menu' : 'Abrir menu');
    document.body.style.overflow = isOpen ? 'hidden' : '';
  });

  // Fechar menu ao clicar num link
  qsa('.nav__link', navList).forEach(link => {
    link.addEventListener('click', () => {
      navList.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    });
  });

  // Fechar menu com Escape
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navList.classList.contains('is-open')) {
      navList.classList.remove('is-open');
      navToggle.classList.remove('is-open');
      navToggle.setAttribute('aria-expanded', 'false');
      document.body.style.overflow = '';
    }
  });

  /* ===================== SCROLL REVEAL ===================== */
  const revealEls = qsa('.reveal');

  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver((entries, obs) => {
      entries.forEach((entry, i) => {
        if (entry.isIntersecting) {
          // Stagger delay
          setTimeout(() => entry.target.classList.add('is-visible'), i * 80);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });

    revealEls.forEach(el => observer.observe(el));
  } else {
    // Fallback
    revealEls.forEach(el => el.classList.add('is-visible'));
  }

  /* ===================== CONTADOR ANIMADO ===================== */
  const counters = qsa('[data-count]');

  function animateCounter(el) {
    const target = parseInt(el.dataset.count, 10);
    const duration = 1600;
    const start = performance.now();

    function tick(now) {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // easeOutCubic
      el.textContent = Math.floor(eased * target);
      if (progress < 1) requestAnimationFrame(tick);
      else el.textContent = target;
    }
    requestAnimationFrame(tick);
  }

  if ('IntersectionObserver' in window) {
    const counterObs = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          animateCounter(entry.target);
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    counters.forEach(el => counterObs.observe(el));
  } else {
    counters.forEach(el => { el.textContent = el.dataset.count; });
  }

  /* ===================== FILTRO FROTA ===================== */
  const filtros = qs('#frotaFiltros');
  const grid    = qs('#frotaGrid');
  const empty   = qs('#frotaEmpty');
  const veiculos = qsa('.veiculo', grid);

  if (filtros) {
    filtros.addEventListener('click', e => {
      const btn = e.target.closest('.chip');
      if (!btn) return;

      // Atualizar chips ativos
      qsa('.chip', filtros).forEach(c => c.classList.remove('chip--active'));
      btn.classList.add('chip--active');

      const filter = btn.dataset.filter;
      let visibleCount = 0;

      veiculos.forEach(v => {
        const cat = v.dataset.categoria;
        const show = filter === 'todos' || cat === filter;
        v.style.display = show ? '' : 'none';
        if (show) visibleCount++;
      });

      empty.hidden = visibleCount > 0;
    });
  }

  /* ===================== BOTÃO RESERVAR ===================== */
  qsa('.js-reservar').forEach(btn => {
    btn.addEventListener('click', () => {
      const veiculo = btn.dataset.veiculo;
      const contatoSection = qs('#contato');
      const categoriaSelect = qs('#categoria');
      const formFeedback = qs('#formFeedback');

      // Rolar até contato
      contatoSection.scrollIntoView({ behavior: 'smooth', block: 'start' });

      // Pré-preencher categoria baseada no veículo
      const card = btn.closest('.veiculo');
      const categoria = card ? card.dataset.categoria : '';
      if (categoriaSelect && categoria) {
        categoriaSelect.value = categoria;
        categoriaSelect.dispatchEvent(new Event('change'));
      }

      // Feedback visual no botão
      const originalText = btn.textContent;
      btn.textContent = 'Ir para reserva →';
      btn.style.background = 'var(--color-accent)';
      setTimeout(() => {
        btn.textContent = originalText;
        btn.style.background = '';
      }, 2500);
    });
  });

  /* ===================== FORMULÁRIO CONTATO ===================== */
  const form = qs('#formContato');
  const formFeedback = qs('#formFeedback');

  if (form) {
    // Validação de datas
    const dataRetirada = qs('#dataRetirada');
    const dataDevolucao = qs('#dataDevolucao');

    // Definir data mínima como hoje
    const hoje = new Date().toISOString().split('T')[0];
    if (dataRetirada) dataRetirada.min = hoje;
    if (dataDevolucao) dataDevolucao.min = hoje;

    if (dataRetirada) {
      dataRetirada.addEventListener('change', () => {
        if (dataDevolucao) dataDevolucao.min = dataRetirada.value || hoje;
      });
    }

    form.addEventListener('submit', e => {
      e.preventDefault();

      // Validação básica
      const nome = qs('#nome').value.trim();
      const telefone = qs('#telefone').value.trim();
      const retirada = qs('#dataRetirada').value;
      const devolucao = qs('#dataDevolucao').value;
      const categoria = qs('#categoria').value;

      if (!nome || !telefone || !retirada || !devolucao || !categoria) {
        formFeedback.textContent = 'Por favor, preencha todos os campos.';
        formFeedback.style.background = '#C97A2A';
        formFeedback.hidden = false;
        return;
      }

      // Validação de datas
      if (new Date(devolucao) <= new Date(retirada)) {
        formFeedback.textContent = 'A data de devolução deve ser posterior à retirada.';
        formFeedback.style.background = '#C97A2A';
        formFeedback.hidden = false;
        return;
      }

      // Sucesso (simulação)
      formFeedback.textContent = `Recebemos sua solicitação, ${nome.split(' ')[0]}. Entraremos em contato em até 30 minutos.`;
      formFeedback.style.background = 'var(--color-brand)';
      formFeedback.hidden = false;
      form.reset();

      // Esconder feedback após 6s
      setTimeout(() => { formFeedback.hidden = true; }, 6000);
    });
  }

  /* ===================== ACTIVE NAV ON SCROLL ===================== */
  const sections = qsa('main section[id]');
  const navLinks = qsa('.nav__link');

  function highlightNav() {
    const scrollPos = window.scrollY + 100;
    let currentId = '';

    sections.forEach(sec => {
      if (scrollPos >= sec.offsetTop) currentId = sec.id;
    });

    navLinks.forEach(link => {
      const href = link.getAttribute('href');
      if (href === '#' + currentId) link.style.color = 'var(--color-brand)';
      else link.style.color = '';
    });
  }
  window.addEventListener('scroll', highlightNav, { passive: true });

  /* ===================== WHATSAPP FLOAT — SHOW/HIDE ===================== */
  const whatsapp = qs('#whatsappFloat');
  if (whatsapp) {
    let ticking = false;
    window.addEventListener('scroll', () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          whatsapp.style.opacity = window.scrollY > 300 ? '1' : '0.5';
          ticking = false;
        });
        ticking = true;
      }
    }, { passive: true });
  }

  /* ===================== SMOOTH SCROLL (FECHA MENU) ===================== */
  qsa('a[href^="#"]').forEach(link => {
    link.addEventListener('click', e => {
      const href = link.getAttribute('href');
      if (href === '#' || href.length < 2) return;
      const target = qs(href);
      if (target) {
        e.preventDefault();
        const headerH = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--header-h')) || 68;
        const top = target.getBoundingClientRect().top + window.scrollY - headerH - 8;
        window.scrollTo({ top, behavior: 'smooth' });
      }
    });
  });

})();