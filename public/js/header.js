const perfilWrapper = document.getElementById('perfilWrapper');
const perfilDropdown = document.getElementById('perfilDropdown');

perfilWrapper.addEventListener('click', (e) => {
  e.stopPropagation();
  perfilDropdown.classList.toggle('open');
});

// Fecha ao clicar fora
document.addEventListener('click', () => {
  perfilDropdown.classList.remove('open');
});

const hamburguer = document.getElementById('iconHamburguer');
const mobileMenu = document.getElementById('mobileMenu');

hamburguer.addEventListener('click', (e) => {
  e.stopPropagation();
  const isOpen = mobileMenu.classList.toggle('open');
  hamburguer.setAttribute('aria-expanded', isOpen);
  mobileMenu.setAttribute('aria-hidden', !isOpen);
  mobileMenu.style.borderBottom = "1px solid rgba(129, 158, 255, 0.5)";
});

document.addEventListener('click', (e) => {
  if (!mobileMenu.contains(e.target) && !hamburguer.contains(e.target)) {
    mobileMenu.classList.remove('open');
    hamburguer.setAttribute('aria-expanded', false);
    mobileMenu.setAttribute('aria-hidden', true);
    mobileMenu.style.borderBottom = "none";
  }
});