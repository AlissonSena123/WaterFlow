document.getElementById("btn-logout").addEventListener("click", async () => {
    try {
        const response = await fetch("/logout", {
            method: "POST",
            credentials: "include"
        });
                
        const data = await response.json();

        if(!response.ok){
            return alert(data.error);
        }

        alert(data.message);
        window.location.href = data.redirect;

    } catch (error) {
        console.error(error);
        alert("Erro interno de servidor");
    }
});