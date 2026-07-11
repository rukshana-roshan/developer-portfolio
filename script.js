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

// Read more / less toggles (used by both project and cert cards)
function toggleReadMore(btn){
  const desc = btn.previousElementSibling;
  desc.classList.toggle('expanded');
  btn.textContent = desc.classList.contains('expanded') ? 'Read less' : 'Read more';
}

// Horizontal carousels (Projects + Certifications)
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