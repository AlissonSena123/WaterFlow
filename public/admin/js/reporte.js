async function carregarReports() {
  try {
    const res = await fetch("/admin/api/reports");
    const dados = await res.json();

    if (!dados.success) {
      console.error("Erro ao buscar reportes");
      return;
    }

    const tabela = document.getElementById("tabelaReports");
    tabela.innerHTML = "";

    dados.data.forEach(report => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>${report.nome}</td>
        <td>${new Date(report.created_at).toLocaleDateString()}</td>
        <td>${report.bairro}</td>
        <td class="itemTableAcoes"> <button onclick='verDetalhes(${JSON.stringify(report)})'> <i class="ph-fill ph-list-magnifying-glass"></i> Detalhes</button></td>
      `;

      tabela.appendChild(tr);
    });

  } catch (err) {
    console.error("Erro:", err);
  }
}

carregarReports(); // Chama a função quando a pagina recarregar

setInterval(() => {
  carregarReports(); // Chama a função a cada 10s
}, 10000); 

/** Função de verDetalhes */
function verDetalhes(report) {

  document.getElementById("mNome").innerHTML = report.nome;
  document.getElementById("mEmail").innerHTML = report.email;
  document.getElementById("mRua").innerHTML = report.rua;
  document.getElementById("mBairro").innerHTML = report.bairro;
  document.getElementById("mDescricao").innerHTML = report.descricao || "Sem Descrição";

  document.getElementById("modal").style.display = "flex";
}

/** Função para fechar o modal */
function fecharModal() {
  document.getElementById("modal").style.display = "none";
}