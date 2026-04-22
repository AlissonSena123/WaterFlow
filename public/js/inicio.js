import { getUser } from "./auth1.js";

document.addEventListener("DOMContentLoaded", async () => {

    const user = await getUser();

    if (!user) {
        window.location.href = "/login";
        return;
    }

});