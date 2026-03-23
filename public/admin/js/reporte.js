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

      tr.innerHTML = `
        <td>${report.nome}</td>
        <td>${new Date(report.created_at).toLocaleDateString()}</td>
        <td>${report.bairro}</td>
        <td class="itemTableAcoes">
          <button class="btn-detalhes">
            <i class="ph-fill ph-list-magnifying-glass"></i> Detalhes
          </button>
        </td>
      `;

      tr.querySelector(".btn-detalhes").addEventListener("click", () => {
        verDetalhes(report);
      });

      tabela.appendChild(tr);
    });

  } catch (err) {
    console.error("Erro:", err);
  }
}

// ===== DEBOUNCE =====
let timeout;

function debounceCarregarReports() {
  clearTimeout(timeout);
  timeout = setTimeout(() => {
    carregarReports();
  }, 400);
}


// ===== MODAL =====
function verDetalhes(report) {
  document.getElementById("mNome").textContent = report.nome;
  document.getElementById("mEmail").textContent = report.email;
  document.getElementById("mRua").textContent = report.rua;
  document.getElementById("mBairro").textContent = report.bairro;
  document.getElementById("mDescricao").textContent = report.descricao || "Sem descrição";

  document.getElementById("modal").style.display = "flex";
}

function fecharModal() {
  document.getElementById("modal").style.display = "none";
}

// ===== EVENTOS =====
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

      // 🔥 Atualiza automaticamente
      carregarReports();
    }
  )
  .subscribe();


// ===== CARREGAR AO ABRIR =====
carregarReports();