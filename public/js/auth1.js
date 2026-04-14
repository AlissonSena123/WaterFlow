export async function getUsers() {
    try{

        const res = await fetch("/me", {
            method: "GET",
            credentials: "include"
        });

        const data = await response.json();

        return data.user;
    } catch (error) {
        console.error("Erro ao buscar usuário: ", error);
        return null;
    }
}