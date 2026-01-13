let menuItem = document.querySelectorAll(".sideBar-item");

function selectLink(){
    menuItem.forEach((item) => {
        item.classList.remove("active")
    });

    this.classList.add("active");
}

menuItem.forEach((item) => {
    item.addEventListener("click", selectLink);
});