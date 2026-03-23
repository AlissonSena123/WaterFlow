async function carregarReports() {
  try {
    const res = await fetch("/admin/api/reports");
    const dados = await res.json();

    if (!dados.success) {
      console.error("Erro ao buscar reports");
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

carregarReports();

/** Função de verDetalhes */
function verDetalhes(report) {
  document.getElementById("mNome").textContent = report.nome;
  document.getElementById("mEmail").textContent = report.email;
  document.getElementById("mRua").textContent = report.rua;
  document.getElementById("mBairro").textContent = report.bairro;
  document.getElementById("mDescricao").textContent = report.descricao;

  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}