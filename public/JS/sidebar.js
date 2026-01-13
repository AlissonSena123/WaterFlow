document.getElementById("sidebar-open-btn").addEventListener("click", (e) => {
    e.preventDefault();
    document.getElementById("sidebar").classList.toggle("open-sidebar");
    document.getElementById("sidebar-open-btn").classList.toggle("rotate");
});