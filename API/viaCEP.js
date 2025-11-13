const inputCEP = document.getElementById("idCEP");
const errorCEP = document.getElementById("errorCEP");

inputCEP.addEventListener("blur", async () => {
    const cep = inputCEP.value.replace(/\D/g, "");


    function limparInput(){
        cidadeInput.value = "";
        estadoInput.value = "";
        paisInput.value = "";
        bairroInput.value = "";
    }

    const cidadeInput = document.querySelector("input[name=cidade]");
    const estadoInput = document.querySelector("input[name=estado]");
    const paisInput = document.querySelector("input[name=pais]");
    const bairroInput = document.querySelector("input[name=bairro]");

    if(cep.length !== 8){
        errorCEP.innerHTML = "*Digite um CEP de 8 digitos";
        limparInput();
        return;
    }


    errorCEP.innerHTML = "Buscando CEP...";

    const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
    const dados = await response.json();

    if(dados.erro){
        errorCEP.innerHTML = "*CEP não encontrado";
        limparInput();
        return;
    }

    errorCEP.innerHTML = "";
    cidadeInput.value = dados.localidade || "";
    estadoInput.value = dados.uf || "";
    paisInput.value = "Brasil";
    bairroInput.value = dados.bairro || "";
    
});