
(function () {
    'use strict';

    var SEL = {
        busca: '#campo-busca',
        filtroDisciplina: '#filtro-disciplina',
        filtroStatus: '#filtro-status',
        filtroOrdem: '#filtro-ordem',
        corpoTabela: '#corpo-tabela',
        linha: '.linha-frequencia',
        contadorTabela: '#contador-tabela',
        contadorRodape: '#contador-rodape',
        contadorJustificativas: '#contador-justificativas',
        listaJustificativas: '#lista-justificativas',
        botaoExportar: '#botao-exportar',
        modal: '#modal-justificativa',
        modalDisciplina: '#just-disciplina',
        modalData: '#just-data',
        modalMotivo: '#just-motivo',
        modalArquivo: '#just-arquivo',
        arquivoNome: '#arquivo-selecionado',
        modalPendentes: '#just-pendentes',
        modalProtocolo: '#protocolo-justificativa',
        badgePendencias: '#badge-pendencias',
        primeiroAlerta: '.cartao-alertas .item-alerta',
        aviso: '#aviso-sucesso',
        avisoTexto: '#aviso-texto'
    };

    var COLUNA = {
        DISCIPLINA: 0,
        PROFESSOR: 1,
        CARGA: 2,
        PRESENCAS: 3,
        FALTAS: 4,
        ATRASOS: 5
    };

    var PROTOCOLO_BASE = 1195;

    var estado = {
        termo: '',
        disciplina: 'todas',
        status: 'todos',
        ordem: 'padrao'
    };

    var modalDetalhes = null;
    var temporizadorAviso = null;

    function qs(seletor, contexto) {
        return (contexto || document).querySelector(seletor);
    }

    function qsa(seletor, contexto) {
        return Array.prototype.slice.call((contexto || document).querySelectorAll(seletor));
    }

    function textoDe(raiz, seletor) {
        if (!raiz) {
            return '';
        }
        var el = qs(seletor, raiz);
        return el ? el.textContent.replace(/\s+/g, ' ').trim() : '';
    }

    function celulaTexto(linha, indice) {
        if (!linha || !linha.cells || !linha.cells[indice]) {
            return '';
        }
        return linha.cells[indice].textContent.replace(/\s+/g, ' ').trim();
    }

    function inteiroDe(valor) {
        var n = parseInt(String(valor).replace(/[^0-9]/g, ''), 10);
        return isNaN(n) ? 0 : n;
    }

    function normalizar(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toLowerCase()
            .trim();
    }

    function linhasTabela() {
        return qsa(SEL.linha);
    }

    function horaAtual() {
        var agora = new Date();
        return String(agora.getHours()).padStart(2, '0') + ':' +
            String(agora.getMinutes()).padStart(2, '0');
    }

    function dataISO() {
        var agora = new Date();
        return agora.getFullYear() + '-' +
            String(agora.getMonth() + 1).padStart(2, '0') + '-' +
            String(agora.getDate()).padStart(2, '0');
    }

    function formatarData(iso) {
        if (!iso) {
            return '—';
        }
        var partes = iso.split('-');
        return partes.length === 3 ? partes[2] + '/' + partes[1] + '/' + partes[0] : iso;
    }

    function prepararLinhas() {
        linhasTabela().forEach(function (linha, indice) {
            if (linha.dataset.preparada) {
                return;
            }
            linha.dataset.busca = normalizar(
                textoDe(linha, '.nome-disciplina') + ' ' + celulaTexto(linha, COLUNA.PROFESSOR)
            );
            linha.dataset.nome = normalizar(textoDe(linha, '.nome-disciplina'));
            linha.dataset.ordemOriginal = String(indice);
            linha.dataset.preparada = 'true';
        });
    }

    function lerFiltros() {
        var busca = qs(SEL.busca);
        var disciplina = qs(SEL.filtroDisciplina);
        var status = qs(SEL.filtroStatus);
        var ordem = qs(SEL.filtroOrdem);

        estado.termo = normalizar(busca ? busca.value : '');
        estado.disciplina = disciplina ? disciplina.value : 'todas';
        estado.status = status ? status.value : 'todos';
        estado.ordem = ordem ? ordem.value : 'padrao';
    }

    function linhaCorresponde(linha) {
        var combinaTermo = !estado.termo || (linha.dataset.busca || '').indexOf(estado.termo) !== -1;
        var combinaDisciplina = estado.disciplina === 'todas' || linha.dataset.disciplina === estado.disciplina;
        var combinaStatus = estado.status === 'todos' || linha.dataset.status === estado.status;

        return combinaTermo && combinaDisciplina && combinaStatus;
    }

    function ordenar(linhas) {
        var copia = linhas.slice();

        if (estado.ordem === 'maior') {
            copia.sort(function (a, b) {
                return inteiroDe(b.dataset.frequencia) - inteiroDe(a.dataset.frequencia);
            });
        } else if (estado.ordem === 'menor') {
            copia.sort(function (a, b) {
                return inteiroDe(a.dataset.frequencia) - inteiroDe(b.dataset.frequencia);
            });
        } else if (estado.ordem === 'nome') {
            copia.sort(function (a, b) {
                return (a.dataset.nome || '').localeCompare(b.dataset.nome || '', 'pt-BR');
            });
        } else {
            copia.sort(function (a, b) {
                return inteiroDe(a.dataset.ordemOriginal) - inteiroDe(b.dataset.ordemOriginal);
            });
        }

        return copia;
    }

    function aplicarFiltros() {
        var todas = linhasTabela();
        var correspondentes = ordenar(todas.filter(linhaCorresponde));
        var visiveis = new Set(correspondentes);

        todas.forEach(function (linha) {
            linha.hidden = !visiveis.has(linha);
        });

        var corpo = qs(SEL.corpoTabela);
        if (corpo) {
            correspondentes.forEach(function (linha) {
                corpo.appendChild(linha);
            });
        }

        atualizarContadores(correspondentes.length, todas.length);
    }

    function atualizarContadores(total, universo) {
        var tabela = qs(SEL.contadorTabela);

        if (tabela) {
            if (!total) {
                tabela.textContent = 'Nenhuma disciplina encontrada';
            } else if (total === 1) {
                tabela.textContent = '1 disciplina no semestre';
            } else {
                tabela.textContent = total + ' disciplinas no semestre';
            }
        }

        var rodape = qs(SEL.contadorRodape);
        if (rodape) {
            rodape.textContent = 'Mostrando ' + total + ' de ' + universo + ' disciplinas';
        }
    }

    function filtrarFrequencia() {
        lerFiltros();
        aplicarFiltros();
    }

    function limparFiltros() {
        var busca = qs(SEL.busca);
        if (busca) {
            busca.value = '';
        }

        var disciplina = qs(SEL.filtroDisciplina);
        if (disciplina) {
            disciplina.value = 'todas';
        }

        var status = qs(SEL.filtroStatus);
        if (status) {
            status.value = 'todos';
        }

        var ordem = qs(SEL.filtroOrdem);
        if (ordem) {
            ordem.value = 'padrao';
        }

        filtrarFrequencia();
    }

    function campoCsv(valor) {
        var texto = valor === undefined || valor === null ? '' : String(valor);
        return '"' + texto.replace(/"/g, '""') + '"';
    }

    function exportarFrequencia() {
        var registros = linhasTabela().filter(linhaCorresponde);

        if (!registros.length) {
            mostrarAviso('Nenhuma disciplina visível para exportar.');
            return;
        }

        var colunas = [
            'Disciplina', 'Professor', 'Carga', 'Presenças',
            'Faltas', 'Atrasos', 'Frequência', 'Status'
        ];

        var linhas = registros.map(function (linha) {
            return [
                textoDe(linha, '.nome-disciplina'),
                celulaTexto(linha, COLUNA.PROFESSOR),
                celulaTexto(linha, COLUNA.CARGA),
                celulaTexto(linha, COLUNA.PRESENCAS),
                celulaTexto(linha, COLUNA.FALTAS),
                celulaTexto(linha, COLUNA.ATRASOS),
                textoDe(linha, '.valor-frequencia'),
                textoDe(linha, '.etiqueta-status')
            ].map(campoCsv).join(';');
        });

        var conteudo = '\ufeff' + [colunas.map(campoCsv).join(';')].concat(linhas).join('\r\n');
        var blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
        var url = URL.createObjectURL(blob);

        var link = document.createElement('a');
        link.href = url;
        link.download = 'minha-frequencia-' + dataISO() + '.csv';
        link.style.display = 'none';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        window.requestAnimationFrame(function () {
            URL.revokeObjectURL(url);
        });
    }

    function mostrarAviso(texto) {
        var aviso = qs(SEL.aviso);
        var alvo = qs(SEL.avisoTexto);

        if (!aviso) {
            return;
        }

        if (alvo) {
            alvo.textContent = texto;
        }

        aviso.classList.add('visivel');

        if (temporizadorAviso) {
            clearTimeout(temporizadorAviso);
        }

        temporizadorAviso = setTimeout(function () {
            aviso.classList.remove('visivel');
        }, 6000);
    }

    function abrirJustificativa() {
        var modal = qs(SEL.modal);
        if (!modal || modal.open) {
            return;
        }

        var motivo = qs(SEL.modalMotivo);
        if (motivo) {
            motivo.value = '';
            motivo.classList.remove('erro');
        }

        var arquivo = qs(SEL.modalArquivo);
        if (arquivo) {
            arquivo.value = '';
        }

        var nomeArquivo = qs(SEL.arquivoNome);
        if (nomeArquivo) {
            nomeArquivo.textContent = '';
        }

        var protocolo = qs(SEL.modalProtocolo);
        if (protocolo) {
            protocolo.textContent = '• Protocolo 2026-' + PROTOCOLO_BASE;
        }

        if (typeof modal.showModal === 'function') {
            modal.showModal();
        } else {
            modal.setAttribute('open', 'open');
        }
    }

    function fecharJustificativa() {
        var modal = qs(SEL.modal);
        if (!modal) {
            return;
        }

        if (typeof modal.close === 'function' && modal.open) {
            modal.close();
        } else {
            modal.removeAttribute('open');
        }
    }

    function fecharAoClicarFora(evento) {
        var modal = qs(SEL.modal);
        if (!modal || !evento.target || evento.target !== modal) {
            return;
        }
        fecharJustificativa();
    }

    function atualizarPendentes(valor) {
        var alvo = qs(SEL.modalPendentes);
        if (alvo) {
            alvo.textContent = String(valor);
        }

        var badge = qs(SEL.badgePendencias);
        if (badge) {
            badge.textContent = valor === 1 ? '1 pendente' : valor + ' pendentes';
        }
    }

    function enviarJustificativa() {
        var motivo = qs(SEL.modalMotivo);

        if (!motivo || !motivo.value.trim()) {
            if (motivo) {
                motivo.classList.add('erro');
                motivo.focus();
            }
            return;
        }

        motivo.classList.remove('erro');

        var disciplina = qs(SEL.modalDisciplina);
        var data = qs(SEL.modalData);
        var pendentes = qs(SEL.modalPendentes);

        var nomeDisciplina = disciplina ? disciplina.value : 'Disciplina';
        var dataFalta = data ? formatarData(data.value) : '—';
        var hoje = formatarData(dataISO());

        var item = document.createElement('div');
        item.className = 'item-justificativa';
        item.innerHTML =
            '<div class="icone-justificativa"><i class="fa-solid fa-hourglass-half"></i></div>' +
            '<div class="dados-justificativa">' +
            '<strong>' + nomeDisciplina + '</strong>' +
            '<small>Falta em ' + dataFalta + ' · Enviada em ' + hoje +
            ' · Protocolo 2026-' + PROTOCOLO_BASE + '</small>' +
            '</div>' +
            '<span class="etiqueta-status amarelo">Em análise</span>';

        var lista = qs(SEL.listaJustificativas);
        if (lista) {
            lista.insertBefore(item, lista.firstChild);
        }

        var totalPendentes = pendentes ? Math.max(0, inteiroDe(pendentes.textContent) - 1) : 0;
        atualizarPendentes(totalPendentes);

        var primeiroAlerta = qs(SEL.primeiroAlerta);
        if (primeiroAlerta && !primeiroAlerta.classList.contains('resolvido')) {
            primeiroAlerta.classList.add('resolvido');
            var texto = qs('p', primeiroAlerta);
            if (texto) {
                texto.textContent = 'Justificativa enviada — ' + texto.textContent;
            }
        }

        atualizarContadorJustificativas();
        fecharJustificativa();
        mostrarAviso('Justificativa enviada para análise em ' + hoje + ' às ' + horaAtual() + '.');
    }

    function atualizarContadorJustificativas() {
        var alvo = qs(SEL.contadorJustificativas);
        if (!alvo) {
            return;
        }

        var itens = qsa(SEL.listaJustificativas + ' .item-justificativa');
        var total = itens.length;

        var emAnalise = qsa(SEL.listaJustificativas + ' .etiqueta-status').filter(function (etiqueta) {
            return normalizar(etiqueta.textContent).indexOf('analise') !== -1;
        }).length;

        var textoTotal = total === 1 ? '1 justificativa enviada' : total + ' justificativas enviadas';
        var textoAnalise = emAnalise === 1 ? '1 em análise' : emAnalise + ' em análise';

        alvo.textContent = textoTotal + ' · ' + textoAnalise;
    }

    function construirModalDetalhes() {
        if (modalDetalhes) {
            return modalDetalhes;
        }

        var modal = document.createElement('dialog');
        modal.className = 'modal-detalhes';
        modal.id = 'modal-detalhes-disciplina';

        modal.innerHTML = [
            '<div class="conteudo-modal">',
            '  <header class="cabecalho-modal">',
            '    <div class="identificacao-modal">',
            '      <span class="etiqueta-status verde" data-campo="status">Regular</span>',
            '      <span class="codigo-atividade" data-campo="codigo">• BD401</span>',
            '    </div>',
            '    <button type="button" class="botao-fechar-modal" data-acao="fechar" aria-label="Fechar ficha">',
            '      <i class="fa-solid fa-xmark"></i>',
            '    </button>',
            '  </header>',
            '  <div class="corpo-modal">',
            '    <h2 data-campo="titulo">Disciplina</h2>',
            '    <div class="grade-detalhes">',
            '      <div class="campo-form"><label>Professor</label><strong data-campo="professor">—</strong></div>',
            '      <div class="campo-form"><label>Carga horária</label><strong data-campo="carga">—</strong></div>',
            '      <div class="campo-form"><label>Presenças</label><strong data-campo="presencas">—</strong></div>',
            '      <div class="campo-form"><label>Faltas</label><strong data-campo="faltas">—</strong></div>',
            '      <div class="campo-form"><label>Atrasos</label><strong data-campo="atrasos">—</strong></div>',
            '      <div class="campo-form"><label>Frequência</label><strong data-campo="frequencia">—</strong></div>',
            '    </div>',
            '  </div>',
            '  <footer class="rodape-modal">',
            '    <div class="resumo-chamada"><span data-campo="limite"></span></div>',
            '    <div class="acoes-modal">',
            '      <button type="button" class="botao-detalhes" data-acao="justificar">',
            '        <i class="fa-solid fa-file-circle-plus"></i> Justificar falta',
            '      </button>',
            '      <button type="button" class="botao-enviar" data-acao="fechar">',
            '        <i class="fa-solid fa-check"></i> Fechar',
            '      </button>',
            '    </div>',
            '  </footer>',
            '</div>'
        ].join('');

        modal.addEventListener('click', function (evento) {
            if (!(evento.target instanceof Element)) {
                return;
            }

            if (evento.target === modal || evento.target.closest('[data-acao="fechar"]')) {
                modal.close();
                return;
            }

            if (evento.target.closest('[data-acao="justificar"]')) {
                modal.close();
                abrirJustificativa();
            }
        });

        document.body.appendChild(modal);
        modalDetalhes = modal;

        return modal;
    }

    function preencherCampo(raiz, campo, valor) {
        var alvo = qs('[data-campo="' + campo + '"]', raiz);
        if (alvo) {
            alvo.textContent = valor || '—';
        }
    }

    function abrirDetalhes(linha) {
        if (!linha) {
            return;
        }

        var modal = construirModalDetalhes();

        var carga = inteiroDe(linha.dataset.carga);
        var faltas = inteiroDe(celulaTexto(linha, COLUNA.FALTAS));
        var limite = Math.floor(carga * 0.25);
        var restantes = Math.max(0, limite - faltas);

        var etiqueta = qs('.etiqueta-status', linha);
        var status = qs('[data-campo="status"]', modal);

        preencherCampo(modal, 'titulo', textoDe(linha, '.nome-disciplina'));
        preencherCampo(modal, 'codigo', '• ' + textoDe(linha, '.codigo-disciplina'));
        preencherCampo(modal, 'professor', celulaTexto(linha, COLUNA.PROFESSOR));
        preencherCampo(modal, 'carga', celulaTexto(linha, COLUNA.CARGA));
        preencherCampo(modal, 'presencas', celulaTexto(linha, COLUNA.PRESENCAS));
        preencherCampo(modal, 'faltas', celulaTexto(linha, COLUNA.FALTAS));
        preencherCampo(modal, 'atrasos', celulaTexto(linha, COLUNA.ATRASOS));
        preencherCampo(modal, 'frequencia', textoDe(linha, '.valor-frequencia'));
        preencherCampo(
            modal,
            'limite',
            'Limite de faltas: ' + limite + ' aulas (25% de ' + carga + 'h) · Restam ' + restantes
        );

        if (status && etiqueta) {
            status.classList.remove('verde', 'amarelo', 'vermelho', 'azul');

            ['verde', 'amarelo', 'vermelho', 'azul'].forEach(function (classe) {
                if (etiqueta.classList.contains(classe)) {
                    status.classList.add(classe);
                }
            });

            status.textContent = textoDe(linha, '.etiqueta-status');
        }

        if (typeof modal.showModal === 'function') {
            modal.showModal();
        } else {
            modal.setAttribute('open', 'open');
        }
    }

    function iniciarAcoesTabela() {
        var corpo = qs(SEL.corpoTabela);
        if (!corpo) {
            return;
        }

        corpo.addEventListener('click', function (evento) {
            if (!(evento.target instanceof Element)) {
                return;
            }

            var botao = evento.target.closest('.botao-detalhes');
            if (!botao) {
                return;
            }

            abrirDetalhes(botao.closest(SEL.linha));
        });
    }

    function iniciar() {
        prepararLinhas();
        lerFiltros();
        aplicarFiltros();
        iniciarAcoesTabela();

        var arquivo = qs(SEL.modalArquivo);
        var nome = qs(SEL.arquivoNome);

        if (arquivo && nome) {
            arquivo.addEventListener('change', function () {
                nome.textContent = arquivo.files && arquivo.files.length ? arquivo.files[0].name : '';
            });
        }

        var botaoExportar = qs(SEL.botaoExportar);
        if (botaoExportar) {
            botaoExportar.addEventListener('click', exportarFrequencia);
        }

        atualizarContadorJustificativas();
    }

    window.filtrarFrequencia = filtrarFrequencia;
    window.limparFiltros = limparFiltros;
    window.abrirJustificativa = abrirJustificativa;
    window.fecharJustificativa = fecharJustificativa;
    window.fecharAoClicarFora = fecharAoClicarFora;
    window.enviarJustificativa = enviarJustificativa;
    window.abrirDetalhes = abrirDetalhes;

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', iniciar);
    } else {
        iniciar();
    }
})();