import { mostrarToast } from "../utils/toast.js";

const supabaseClient = supabase.createClient(
  "https://vpdaqjfglnctqsbjmnzj.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZwZGFxamZnbG5jdHFzYmptbnpqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM5MzY4MDAsImV4cCI6MjA4OTUxMjgwMH0.gYToKUR_f3-rCiyX2T0UvCU64A3htRAYTgpr6vLr864"
);

// ===== FUNÇÃO PRINCIPAL =====
async function carregarReports() {
  try {
    const nome = document.getElementById("userReport").value.trim();
    const data = document.getElementById("dataReport").value;
    const bairro = document.getElementById("regionReport").value.trim();

    const params = new URLSearchParams();

    if (nome) params.append("nome", nome);
    if (bairro) params.append("bairro", bairro);
    if (data) params.append("data", data);

    const url = "/admin/api/reports?" + params.toString();

    const res = await fetch(url);
    const dados = await res.json();

    if (!dados.success) {
      console.error("Erro ao buscar reportes");
      return;
    }

    const tabela = document.getElementById("tabelaReports");
    tabela.innerHTML = "";

    // Caso não tenha resultados
    if (!dados.data || dados.data.length === 0) {
      tabela.innerHTML = `
        <tr>
          <td colspan="4">Nenhum resultado encontrado</td>
        </tr>
      `;
      return;
    }

    dados.data.forEach(report => {
      const tr = document.createElement("tr");

      const iniciais = report.nome
        .split(" ")
        .map(n => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase();

      tr.innerHTML = `
        <td> <div id="reportAvatar">${iniciais}</div> ${report.nome}</td>
        <td>${new Date(report.created_at).toLocaleDateString()}</td>
        <td>${report.bairro}</td>
        <td class="itemTableAcoes">
          <button class="btn-detalhes">
            <i class="ph-fill ph-clipboard-text"></i> <p>Detalhes</p>
          </button>
        </td>
      `;

      const labels = ["Nome:", "Data:", "Região:", "Ação:"];
      tr.querySelectorAll("td").forEach((td, i) => {
        td.setAttribute("data-label", labels[i]);
      });

      //Ele seleciona qualquer tag "tr" que tenha a classe "btn-detalhes", caso clique no botão, a função é chamada
      tr.querySelector(".btn-detalhes").addEventListener("click", () => {
        verDetalhes(report);
      });

      tabela.appendChild(tr);
    });

  } catch (err) {
    console.error("Erro:", err);
  }
}

// ---- DEBOUNCE ----
let timeout;

/** Essa função serve para carregar a tabela mesmo sem nenhum filtro */
function debounceCarregarReports() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    carregarReports();
  }, 400);
}

// ---- EVENTOS DE INPUT ----
document.getElementById("userReport").addEventListener("input", debounceCarregarReports);
document.getElementById("regionReport").addEventListener("input", debounceCarregarReports);
document.getElementById("dataReport").addEventListener("change", carregarReports);

/** ---- ATUALIZA A TABELA AUTOMATICAMENTE ---- */
supabaseClient
  .channel("realtime:reports")
  .on(
    "postgres_changes",
    {
      event: "INSERT",
      schema: "public",
      table: "reportUsers"
    },
    (payload) => {
      console.log("Novo report recebido:", payload);

      // Atualiza automaticamente
      carregarReports();
    }
  )
  .subscribe();


// ---- CARREGAR AO ABRIR ----
carregarReports();

// ===== MODAL =====
const modal = document.getElementById("modal");

function verDetalhes(report) {
  document.getElementById("mNome").textContent = report.nome;
  document.getElementById("mEmail").textContent = report.email;
  document.getElementById("mRua").textContent = report.rua;
  document.getElementById("mBairro").textContent = report.bairro;
  document.getElementById("mProblema").textContent = report.tipo_problema
  document.getElementById("mDescricao").textContent = report.descricao || "Sem descrição";

  document.getElementById("modal").dataset.reporteId = report.id;

  modal.classList.add("show"); // Aqui ele vai mudar para a class "show", para aparecer o modal
}

const btnFecharModal = document.getElementById("btnFecharModal");
const iconFecharModal = document.getElementById("iconFecharModal");

iconFecharModal.addEventListener("click", fecharModal);
btnFecharModal.addEventListener("click", fecharModal);

function fecharModal() {
  modal.classList.remove("show"); // Fechar apertando no botão
}

// Fechar clicando fora do conteúdo
modal.addEventListener("click", (e) => {
  if (e.target === modal) fecharModal();
});

/** Evento do botão de resposta */
document.getElementById("btnResponder").addEventListener("click", () => {
  const secao = document.getElementById("secaoResposta");
  const btn = document.getElementById("btnResponder");
  const aberto = secao.style.display === "block";

  secao.style.display = aberto ? "none" : "block"; // operador ternario para mudar o icone e o significado do botão
  btn.innerHTML = aberto
    ? '<i class="ph-fill ph-chat-text"></i> Responder'
    : '<i class="ph-fill ph-caret-up"></i> Ocultar';
});

/** Evento que envia a resposta  */
document.getElementById("btnEnviarResposta").addEventListener("click", async () => {
  const id = document.getElementById("modal").dataset.reporteId; // Pega essa dataset da função de ver detalhes
  const status = document.getElementById("selectStatus").value;
  const resposta = document.getElementById("textareaResposta").value;

  if (!resposta.trim()) {
    mostrarToast("Escreva uma mensagem antes de enviar.", "red");
    return;
  }

  const btn = document.getElementById("btnEnviarResposta");
  btn.disabled = true;
  btn.textContent = "Enviando...";

  try {
    const res = await fetch(`/admin/api/reports/${id}/responder`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, resposta }),
    });
    const data = await res.json();

    if (data.success) {
      mostrarToast("Resposta enviada! Usuário foi notificado por e-mail.", "green");
      document.getElementById("secaoResposta").style.display = "none";
      document.getElementById("textareaResposta").value = "";
      document.getElementById("btnResponder").innerHTML =
        '<i class="ph-fill ph-chat-text"></i> Responder';
    } else {
      mostrarToast(data.erro, "red");
    }
  } catch (e) {
    mostrarToast("Erro ao enviar. Tente novamente.", "red");
  } finally {
    btn.disabled = false;
    btn.innerHTML = '<i class="ph-fill ph-paper-plane-tilt"></i> Enviar resposta';
  }
});