export async function buscarCEP(cep) {
    cep = cep.replace(/\D/g, "");

    if(cep.length != 8){ 
        return null 
    };

    try {
        const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);

        const data = await response.json();

        if(data.erro){
            return null;
        }

        return data;
    } catch (error) {
        console.error("Erro ao buscar CEP: ", error);
        return null;
    }
}