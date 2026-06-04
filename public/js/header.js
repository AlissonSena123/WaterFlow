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