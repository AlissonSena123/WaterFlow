import { getUser } from "./auth1.js";

document.addEventListener("DOMContentLoaded", async () => {

    const user = await getUser();

    if (!user) {
        window.location.href = "/login";
        return;
    } 
});

const main = document.querySelector("main");
const cardStatus = document.getElementById("cardStatus");
const sectionMap = document.getElementById("section-map");

function redirecionarPainel(){
    if(window.innerWidth <= 600){
        if(cardStatus.parentElement !== main){
            main.appendChild(cardStatus);
            console.log("Main");
        }
    } else {
        if (cardStatus.parentElement !== sectionMap){
            sectionMap.appendChild(cardStatus);
            console.log("MAP");
        }
    }
}

redirecionarPainel();