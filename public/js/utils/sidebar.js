const sidebar = document.getElementById('sidebar');
const iconHamburguer = document.getElementById('iconHamburguer');

const overlay = document.createElement('div');
overlay.id = 'sidebar-overlay';
document.body.appendChild(overlay);

function openSidebar() {
    sidebar.classList.add('open');
    overlay.classList.add('visible');
}

function closeSidebar() {
    sidebar.classList.remove('open');
    overlay.classList.remove('visible');
}

iconHamburguer.addEventListener('click', () => {
    sidebar.classList.contains('open') ? closeSidebar() : openSidebar();
});

overlay.addEventListener('click', closeSidebar);