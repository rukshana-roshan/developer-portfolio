// Cert lightbox
function openCertModal(src, title, sub){
  document.getElementById('certModalImg').src = src;
  document.getElementById('certModalTitle').textContent = title;
  document.getElementById('certModalSub').textContent = sub;
  document.getElementById('certModal').classList.add('open');
  document.body.style.overflow='hidden';
}
function closeCertModal(){
  document.getElementById('certModal').classList.remove('open');
  document.body.style.overflow='';
}

// Read more / less toggles (used by project cards)
function toggleReadMore(btn){
  const desc = btn.previousElementSibling;
  desc.classList.toggle('expanded');
  btn.textContent = desc.classList.contains('expanded') ? 'Read less' : 'Read more';
}

// Horizontal carousels (Projects + Certifications only —
// the Experience section now has its own logic below and no
// longer uses this function or shares its ids)
function initCarousel(trackId, prevId, nextId){
  const track = document.getElementById(trackId);
  const prevBtn = document.getElementById(prevId);
  const nextBtn = document.getElementById(nextId);
  if(!track || !prevBtn || !nextBtn) return;

  function cardScrollAmount(){
    const card = track.querySelector(':scope > *');
    const styles = getComputedStyle(track);
    const gap = parseFloat(styles.columnGap || styles.gap || 24);
    return card ? card.offsetWidth + gap : 300;
  }

  prevBtn.addEventListener('click', () => track.scrollBy({left: -cardScrollAmount()*2, behavior:'smooth'}));
  nextBtn.addEventListener('click', () => track.scrollBy({left: cardScrollAmount()*2, behavior:'smooth'}));

  function updateNavState(){
    const max = track.scrollWidth - track.clientWidth - 2;
    prevBtn.disabled = track.scrollLeft <= 2;
    nextBtn.disabled = track.scrollLeft >= max;
  }
  track.addEventListener('scroll', updateNavState);
  window.addEventListener('resize', updateNavState);
  updateNavState();

  // Drag / swipe
  let isDown = false, startX, scrollStart;
  track.addEventListener('pointerdown', (e) => {
    isDown = true;
    track.classList.add('dragging');
    startX = e.pageX;
    scrollStart = track.scrollLeft;
  });
  window.addEventListener('pointerup', () => { isDown = false; track.classList.remove('dragging'); });
  window.addEventListener('pointermove', (e) => {
    if(!isDown) return;
    e.preventDefault();
    track.scrollLeft = scrollStart - (e.pageX - startX);
  });
}
initCarousel('projectsTrack', 'projectsPrev', 'projectsNext');
initCarousel('certsTrack', 'certsPrev', 'certsNext');

// HACKERANK

(function(){
  const viewport = document.querySelector('.hr-carousel-viewport');
  const track = document.getElementById('hrTrack');
  const cards = Array.from(track.querySelectorAll('.hr-card'));
  const prevBtn = document.querySelector('.hr-arrow-prev');
  const nextBtn = document.querySelector('.hr-arrow-next');
  const dotsWrap = document.getElementById('hrDots');

  cards.forEach((_, i) => {
    const dot = document.createElement('div');
    dot.className = 'hr-dot';
    dot.addEventListener('click', () => scrollToIndex(i));
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  function getActiveIndex(){
    const viewportRect = viewport.getBoundingClientRect();
    const viewportCenter = viewportRect.left + viewportRect.width / 2;
    let closest = 0;
    let minDist = Infinity;
    cards.forEach((card, i) => {
      const rect = card.getBoundingClientRect();
      const cardCenter = rect.left + rect.width / 2;
      const dist = Math.abs(cardCenter - viewportCenter);
      if (dist < minDist){ minDist = dist; closest = i; }
    });
    return closest;
  }

  function updateVisualState(){
    const activeIndex = getActiveIndex();
    cards.forEach((card, i) => {
      card.classList.remove('is-active', 'is-prev', 'is-next');
      if (i === activeIndex) card.classList.add('is-active');
      else if (i === activeIndex - 1) card.classList.add('is-prev');
      else if (i === activeIndex + 1) card.classList.add('is-next');
    });
    dots.forEach((d, i) => d.classList.toggle('is-active', i === activeIndex));
    prevBtn.disabled = activeIndex === 0;
    nextBtn.disabled = activeIndex === cards.length - 1;
  }

  function scrollToIndex(i){
    i = Math.max(0, Math.min(cards.length - 1, i));
    const card = cards[i];
    const cardRect = card.getBoundingClientRect();
    const viewportRect = viewport.getBoundingClientRect();
    const cardCenterRelativeToViewport = (cardRect.left - viewportRect.left) + cardRect.width / 2;
    const target = viewport.scrollLeft + cardCenterRelativeToViewport - viewport.clientWidth / 2;
    viewport.scrollTo({ left: target, behavior: 'smooth' });
  }

  prevBtn.addEventListener('click', () => scrollToIndex(getActiveIndex() - 1));
  nextBtn.addEventListener('click', () => scrollToIndex(getActiveIndex() + 1));

  let ticking = false;
  viewport.addEventListener('scroll', () => {
    if (!ticking){
      requestAnimationFrame(() => { updateVisualState(); ticking = false; });
      ticking = true;
    }
  });

  window.addEventListener('resize', () => scrollToIndex(getActiveIndex()));

  requestAnimationFrame(() => { scrollToIndex(0); updateVisualState(); });
})();

/* ============================================================
   EXPERIENCE SECTION — 3D COVERFLOW
   Completely independent from initCarousel() above.
   Reads however many .exp-card elements exist inside #expStage,
   so you can add/remove experience items in the HTML without
   touching this function.
============================================================ */
function initExpCoverflow(){
  const stage = document.getElementById('expStage');
  if(!stage) return; // Experience section not on this page — do nothing

  const cards   = Array.from(stage.querySelectorAll('.exp-card'));
  const prevBtn = document.getElementById('expPrev');
  const nextBtn = document.getElementById('expNext');
  const dotsWrap = document.getElementById('expDots');
  if(cards.length === 0) return;

  // Start on the middle card, like the preview design
  let current = Math.floor(cards.length / 2);

  // Build the dot indicators dynamically (one per card)
  dotsWrap.innerHTML = '';
  cards.forEach((_, i) => {
    const dot = document.createElement('span');
    dot.className = 'exp-dot' + (i === current ? ' active' : '');
    dot.addEventListener('click', () => { current = i; render(); });
    dotsWrap.appendChild(dot);
  });
  const dots = Array.from(dotsWrap.children);

  // Positions/rotates every card based on its distance from `current`.
  // offset 0  = dead center (active card)
  // offset ±1 = immediate left/right neighbour, tilted in 3D
  // offset ±2+ = pushed further back and faded out
  function render(){
    const w = window.innerWidth;
    let stepX, stepZ;
    if (w <= 340)      { stepX = 68;  stepZ = 55; }  // very small phones
    else if (w <= 420) { stepX = 78;  stepZ = 60; }  // small phones
    else if (w <= 640) { stepX = 95;  stepZ = 70; }  // large phones
    else if (w <= 900) { stepX = 115; stepZ = 85; }  // tablets
    else               { stepX = 170; stepZ = 120; } // desktop
    const tilt = 42; // rotateY angle in degrees

    cards.forEach((card, i) => {
      const offset = i - current;
      const abs = Math.abs(offset);
      const dir = Math.sign(offset);

      card.style.zIndex = 50 - abs;
      // Cards more than 3 away from center are fully hidden (perf + clarity)
      card.style.opacity = abs > 3 ? 0 : (offset === 0 ? 1 : Math.max(0.25, 0.6 - abs * 0.15));
      card.style.pointerEvents = abs > 3 ? 'none' : 'auto';

      const translateX = offset * stepX;
      const translateZ = offset === 0 ? 0 : -abs * stepZ;
      const rotateY = offset === 0 ? 0 : dir * -tilt;

      card.style.transform =
        `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg)`;

      card.classList.toggle('active', offset === 0);
    });

    dots.forEach((d, i) => d.classList.toggle('active', i === current));
    prevBtn.disabled = current === 0;
    nextBtn.disabled = current === cards.length - 1;
  }

  prevBtn.addEventListener('click', () => { if(current > 0){ current--; render(); } });
  nextBtn.addEventListener('click', () => { if(current < cards.length - 1){ current++; render(); } });

  // Clicking any visible side card brings it to the front
  cards.forEach((card, i) => {
    card.addEventListener('click', (e) => {
      // Don't hijack clicks on the "View Certificate" button itself
      if (e.target.closest('.exp-btn')) return;
      current = i;
      render();
    });
  });

  // Drag / swipe support on the stage
  let dragStartX = 0, isDragging = false;
  stage.addEventListener('pointerdown', (e) => {
    isDragging = true;
    dragStartX = e.clientX;
  });
  window.addEventListener('pointerup', (e) => {
    if(!isDragging) return;
    isDragging = false;
    const diff = e.clientX - dragStartX;
    if (diff > 50 && current > 0) { current--; render(); }
    else if (diff < -50 && current < cards.length - 1) { current++; render(); }
  });

  // Re-render on resize so mobile spacing kicks in/out correctly
  window.addEventListener('resize', render);

  render();
}
initExpCoverflow();
/* =================== END EXPERIENCE SECTION JS =================== */


// Hamburger
const hamburger=document.getElementById('hamburger');
const navLinks=document.getElementById('navLinks');
hamburger.addEventListener('click',()=>navLinks.classList.toggle('open'));
navLinks.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>navLinks.classList.remove('open')));

// Fade in on scroll
const observer=new IntersectionObserver(entries=>{
  entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add('visible')});
},{threshold:.15});
document.querySelectorAll('.fade-in').forEach(el=>observer.observe(el));

// CV modal
function openCV(){document.getElementById('cvModal').classList.add('open');document.body.style.overflow='hidden'}
function closeCV(){document.getElementById('cvModal').classList.remove('open');document.body.style.overflow=''}
document.getElementById('cvModal').addEventListener('click',e=>{if(e.target===document.getElementById('cvModal'))closeCV()});

// Nav active state
const sections=document.querySelectorAll('section[id]');
const links=document.querySelectorAll('.nav-links a');
window.addEventListener('scroll',()=>{
  let current='';
  sections.forEach(s=>{if(window.scrollY>=s.offsetTop-100)current=s.id});
  links.forEach(l=>{l.style.color=l.getAttribute('href')==='#'+current?'var(--text)':'var(--muted)'});
});
