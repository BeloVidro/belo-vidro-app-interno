// Importe a função de configuração de filtros do seu novo arquivo
import { setupDateFilters } from './filtro.js';
// Importe as funções necessárias do Firebase
import { initializeApp } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-app.js";
import { getDatabase, ref, get, child, push, query, orderByChild, equalTo, startAt, endAt } from "https://www.gstatic.com/firebasejs/9.23.0/firebase-database.js";

// SUAS CREDENCIAIS DO FIREBASE
const firebaseConfig = {
    apiKey: "AIzaSyDQGXH3b2bMR7ZdKPZm-vPONKijkRw-Xgg",
    authDomain: "belo-vidro-banco-de-dados.firebaseapp.com",
    projectId: "belo-vidro-banco-de-dados",
    storageBucket: "belo-vidro-banco-de-dados.firebasestorage.app",
    messagingSenderId: "705873952615",
    appId: "1:705873952615:web:83613fd5d2839aad66b9c2",
    databaseURL: "https://belo-vidro-banco-de-dados-default-rtdb.firebaseio.com"
};

// Inicialize o Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const funcionariosRef = ref(database, 'funcionarios');
const gastosRef = ref(database, 'gastos');

// Referências aos elementos HTML
const cardContainer = document.getElementById('card-container');
const modal = document.getElementById('modal');
const modalBody = document.getElementById('modal-body');
const totalGastosGeraisCard = document.getElementById('total-gastos-gerais-card');

// --- FUNÇÕES DE LÓGICA DO RELATÓRIO ---

function renderizarCards(funcionariosComGastos) {
    cardContainer.innerHTML = '';
    if (funcionariosComGastos.length === 0) {
        cardContainer.innerHTML = "<p>Nenhum funcionário encontrado.</p>";
        return;
    }

    funcionariosComGastos.forEach(funcionario => {
        const totalGastosFormatado = (parseFloat(funcionario.totalGastos) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
        const cardHtml = `
            <div class="employee-card" onclick="abrirModal('${funcionario.nome}')">
                <img src="${funcionario.fotoUrl || 'https://via.placeholder.com/100'}" alt="${funcionario.nome}" class="employee-photo">
                <h3>${funcionario.nome}</h3>
                <p>Total de Gastos: ${totalGastosFormatado}</p>
            </div>
        `;
        cardContainer.innerHTML += cardHtml;
    });
}

function renderizarCardTotalGeral(totalGeral) {
    const totalFormatado = (parseFloat(totalGeral) || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
    const cardHtml = `
        <div class="card-destacado" onclick="abrirModal('Gerais')">
            <h3>Gastos Gerais</h3>
            <p>${totalFormatado}</p>
        </div>
    `;
    totalGastosGeraisCard.innerHTML = cardHtml;
}

async function carregarRelatorioCompleto(dataInicio, dataFim) {
    cardContainer.innerHTML = `<p>Carregando dados...</p>`;
    
    // Passo 1: Obter a lista de funcionários
    const funcionariosSnapshot = await get(funcionariosRef);
    const funcionariosData = funcionariosSnapshot.val() || {};
    const funcionariosArray = Object.keys(funcionariosData).map(key => ({
        nome: key,
        ...funcionariosData[key]
    }));

    // Passo 2: Obter os gastos no intervalo
    const gastosQuery = query(gastosRef, orderByChild('data'), startAt(dataInicio), endAt(dataFim));
    const gastosSnapshot = await get(gastosQuery);
    const gastosData = gastosSnapshot.val() || {};

    const resumoGastos = {};
    let totalGastosGerais = 0;

    for (const id in gastosData) {
        const gasto = gastosData[id];
        const valor = parseFloat(gasto.valor) || 0;

        if (gasto.responsavel === 'Gerais') {
            totalGastosGerais += valor;
        } else {
            resumoGastos[gasto.responsavel] = (resumoGastos[gasto.responsavel] || 0) + valor;
        }
    }

    // Passo 3: Combinar dados
    const funcionariosComGastos = funcionariosArray.map(funcionario => ({
        ...funcionario,
        totalGastos: resumoGastos[funcionario.nome] || 0
    }));

    renderizarCards(funcionariosComGastos);
    renderizarCardTotalGeral(totalGastosGerais); 
}

// --- FUNÇÕES DO MODAL ---

window.abrirModal = function(nomeResponsavel) {
    const gastosQuery = query(gastosRef, orderByChild('responsavel'), equalTo(nomeResponsavel));
    
    get(gastosQuery)
        .then((snapshot) => {
            const gastosData = snapshot.val() || {};
            const gastosArray = Object.values(gastosData);
            
            // Título do modal dinâmico
            const tituloModal = (nomeResponsavel === 'Gerais') ? 'Adicionar Gasto Geral' : `Gastos de ${nomeResponsavel}`;

            modalBody.innerHTML = `
                <h3>${tituloModal}</h3>
                <form id="form-novo-gasto">
                    <input type="number" id="valor-gasto" placeholder="Valor do gasto" step="0.01" required>
                    <input type="text" id="descricao-gasto" placeholder="Descrição do gasto" required>
                    <button type="submit">Salvar Gasto</button>
                </form>

                <h4>Lista de Gastos</h4>
                <ul id="lista-de-gastos">
                    ${gastosArray.map(gasto => {
                        const valor = parseFloat(gasto.valor) || 0;
                        return `<li>R$ ${valor.toFixed(2)} - ${gasto.descricao}</li>`;
                    }).join('')}
                </ul>
            `;

            document.getElementById('form-novo-gasto').addEventListener('submit', (event) => {
                event.preventDefault();
                adicionarGasto(nomeResponsavel);
            });
            
            modal.style.display = 'flex';
        })
        .catch((error) => {
            console.error("Erro ao carregar gastos:", error);
            modalBody.innerHTML = "<p>Ocorreu um erro ao carregar os gastos.</p>";
            modal.style.display = 'flex';
        });
};

window.fecharModal = function() {
    modal.style.display = 'none';
};

function adicionarGasto(nomeResponsavel) {
    const valorInput = document.getElementById('valor-gasto').value;
    const descricaoInput = document.getElementById('descricao-gasto').value;

    if (!valorInput || !descricaoInput) {
        alert("Por favor, preencha todos os campos.");
        return;
    }

    const novoGasto = {
        valor: parseFloat(valorInput),
        descricao: descricaoInput,
        responsavel: nomeResponsavel,
        data: Date.now()
    };

    push(gastosRef, novoGasto)
        .then(() => {
            alert("Gasto adicionado com sucesso!");
            fecharModal();
            carregarRelatorioCompleto(0, Date.now()); // Recarrega o relatório para atualizar os totais
        })
        .catch((error) => {
            console.error("Erro ao adicionar gasto:", error);
            alert("Erro ao adicionar gasto.");
        });
}

// --- INICIALIZAÇÃO E LISTENERS ---

document.addEventListener('DOMContentLoaded', () => {
    // Carrega o relatório da semana por padrão
    const hoje = new Date();
    const primeiroDiaSemana = new Date(hoje);
    const diaSemana = hoje.getDay(); // 0 = domingo
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
    primeiroDiaSemana.setDate(hoje.getDate() + diff);
    primeiroDiaSemana.setHours(0, 0, 0, 0);

    const ultimoDiaSemana = new Date(primeiroDiaSemana);
    ultimoDiaSemana.setDate(primeiroDiaSemana.getDate() + 6);
    ultimoDiaSemana.setHours(23, 59, 59, 999);

    carregarRelatorioCompleto(primeiroDiaSemana.getTime(), ultimoDiaSemana.getTime());
    
    setupDateFilters(carregarRelatorioCompleto);

    // Lógica para o botão flutuante (se existir no seu HTML)
    const floatingButton = document.getElementById('floating-back-button');
    if (floatingButton) {
        floatingButton.addEventListener('click', () => {
            window.location.href = 'painel.html'; 
        });
    }

    // Destacar link ativo na sidebar
    const path = window.location.pathname;
    const navLinks = document.querySelectorAll('.nav-link');
    
    navLinks.forEach(link => {
        link.classList.remove('active');
        if (link.href.includes(path)) {
            link.classList.add('active');
        }
    });

    // Botão de logout
    const logoutButton = document.querySelector('.logout');
    if (logoutButton) {
        logoutButton.addEventListener('click', (e) => {
            e.preventDefault();
            alert('Você foi desconectado.'); 
            // window.location.href = 'login.html';
        });
    }
});