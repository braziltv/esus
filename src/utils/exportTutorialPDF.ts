import jsPDF from 'jspdf';

export const exportTutorialPDF = () => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 20;
  const lineHeight = 6;
  const maxWidth = pageWidth - margin * 2;
  let y = margin;

  const addPage = () => {
    doc.addPage();
    y = margin;
  };

  const checkPageBreak = (height: number = lineHeight * 2) => {
    if (y + height > pageHeight - margin) {
      addPage();
    }
  };

  const addTitle = (text: string, size: number = 18) => {
    checkPageBreak(size + 10);
    doc.setFontSize(size);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(220, 38, 38);
    doc.text(text, margin, y);
    y += size / 2 + 5;
  };

  const addSubtitle = (text: string) => {
    checkPageBreak(16);
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(37, 99, 235);
    doc.text(text, margin, y);
    y += 10;
  };

  const addText = (text: string, indent: number = 0) => {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const lines = doc.splitTextToSize(text, maxWidth - indent);
    lines.forEach((line: string) => {
      checkPageBreak();
      doc.text(line, margin + indent, y);
      y += lineHeight;
    });
  };

  const addBullet = (text: string) => {
    checkPageBreak();
    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text('•', margin + 5, y);
    const lines = doc.splitTextToSize(text, maxWidth - 15);
    lines.forEach((line: string, index: number) => {
      if (index > 0) checkPageBreak();
      doc.text(line, margin + 12, y);
      y += lineHeight;
    });
  };

  const addSpacer = (size: number = 5) => {
    y += size;
  };

  const addTableRow = (col1: string, col2: string, isHeader: boolean = false) => {
    checkPageBreak(10);
    doc.setFontSize(9);
    doc.setFont('helvetica', isHeader ? 'bold' : 'normal');
    doc.setTextColor(isHeader ? 255 : 0, isHeader ? 255 : 0, isHeader ? 255 : 0);
    
    if (isHeader) {
      doc.setFillColor(59, 130, 246);
      doc.rect(margin, y - 5, maxWidth, 8, 'F');
    } else {
      doc.setDrawColor(200, 200, 200);
      doc.line(margin, y + 2, margin + maxWidth, y + 2);
    }
    
    doc.text(col1, margin + 2, y);
    doc.text(col2, margin + 60, y);
    y += 8;
  };

  // CAPA
  doc.setFillColor(220, 38, 38);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('TUTORIAL COMPLETO', pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(16);
  doc.text('CHAMADA DE PACIENTES POR VOZ', pageWidth / 2, 45, { align: 'center' });
  
  y = 80;
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(12);
  doc.text('Sistema de Gerenciamento de Filas', pageWidth / 2, y, { align: 'center' });
  doc.text('para Unidades de Saude', pageWidth / 2, y + 8, { align: 'center' });
  
  y = 120;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('Este manual apresenta todas as funcionalidades do sistema,', pageWidth / 2, y, { align: 'center' });
  doc.text('desde o login ate as configuracoes avancadas.', pageWidth / 2, y + 7, { align: 'center' });
  
  y = pageHeight - 40;
  doc.setFontSize(9);
  doc.setTextColor(100, 100, 100);
  doc.text('Solucao criada e cedida gratuitamente por Kalebe Gomes', pageWidth / 2, y, { align: 'center' });
  doc.text(`Versao 1.0 - Dezembro 2024`, pageWidth / 2, y + 7, { align: 'center' });

  // ÍNDICE
  addPage();
  addTitle('INDICE', 16);
  addSpacer(5);
  
  const indice = [
    '1. Visao Geral',
    '2. Acesso ao Sistema',
    '3. Modulo Cadastro',
    '4. Modulo Triagem',
    '5. Modulo Medico',
    '6. Modulo Administrativo',
    '7. Modo TV (Display Publico)',
    '8. Chat Interno',
    '9. Configuracoes de Audio',
    '10. Dicas e Boas Praticas',
  ];
  
  indice.forEach(item => {
    addBullet(item);
  });

  // VISÃO GERAL
  addPage();
  addTitle('1. VISAO GERAL');
  addSpacer(3);
  
  addText('O CHAMADA DE PACIENTES POR VOZ e um sistema completo para gerenciamento de filas em unidades de saude.');
  addSpacer(5);
  
  addSubtitle('Funcionalidades Principais');
  addBullet('Cadastro de pacientes com niveis de prioridade');
  addBullet('Triagem e encaminhamento para procedimentos');
  addBullet('Chamada de pacientes pelo medico');
  addBullet('Anuncio por voz em TV de sala de espera');
  addBullet('Estatisticas e relatorios em PDF');
  addBullet('Chat interno entre setores');
  addBullet('Backup e restauracao de dados');
  
  addSpacer(5);
  addSubtitle('Unidades Suportadas');
  addBullet('Pronto Atendimento Pedro Jose de Menezes');
  addBullet('PSF Aguinalda Angelica');
  addBullet('UBS Maria Alves de Mendonca');
  
  addSpacer(5);
  doc.setFillColor(255, 243, 205);
  doc.rect(margin, y, maxWidth, 20, 'F');
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(133, 77, 14);
  doc.text('IMPORTANTE:', margin + 3, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.text('Todos os dispositivos (computadores e TVs) devem estar', margin + 3, y + 12);
  doc.text('logados na MESMA UNIDADE para sincronizacao funcionar.', margin + 3, y + 18);
  y += 25;

  // ACESSO AO SISTEMA
  addPage();
  addTitle('2. ACESSO AO SISTEMA');
  addSpacer(3);
  
  addSubtitle('Login Padrao (Funcionarios)');
  addSpacer(3);
  
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, maxWidth, 20, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text('Usuario: saude', margin + 10, y + 8);
  doc.text('Senha: saude@1', margin + 10, y + 16);
  y += 25;
  
  addText('Passos:');
  addBullet('Selecione a Unidade de Saude no dropdown');
  addBullet('Digite o usuario: saude');
  addBullet('Digite a senha: saude@1');
  addBullet('Clique em Entrar');
  
  addSpacer(8);
  addSubtitle('Login Modo TV (Display Publico)');
  addSpacer(3);
  
  doc.setFillColor(240, 240, 240);
  doc.rect(margin, y, maxWidth, 20, 'F');
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('Usuario: tv', margin + 10, y + 8);
  doc.text('Senha: tv', margin + 10, y + 16);
  y += 25;
  
  addText('Passos:');
  addBullet('Digite o usuario: tv');
  addBullet('Digite a senha: tv');
  addBullet('Selecione a Unidade de Saude a ser exibida na TV');
  addBullet('Clique em Confirmar');
  addBullet('Clique na tela para ATIVAR O AUDIO');
  
  addSpacer(5);
  addText('O modo TV entra automaticamente em tela cheia e esconde o cursor do mouse.');

  // MÓDULO CADASTRO
  addPage();
  addTitle('3. MODULO CADASTRO');
  addSpacer(3);
  
  addText('O modulo Cadastro e responsavel pelo registro inicial dos pacientes.');
  addSpacer(5);
  
  addSubtitle('Funcionalidades');
  addSpacer(3);
  addTableRow('Funcao', 'Descricao', true);
  addTableRow('Registrar Paciente', 'Adiciona novo paciente a fila');
  addTableRow('Definir Prioridade', 'Emergencia (vermelho), Prioridade (amarelo), Normal (verde)');
  addTableRow('Encaminhar', 'Envia paciente para triagem ou procedimento');
  addTableRow('Observacoes', 'Adiciona notas internas sobre o paciente');
  addTableRow('Finalizar', 'Conclui atendimento sem anuncio');
  
  addSpacer(8);
  addSubtitle('Como Cadastrar um Paciente');
  addBullet('Digite o nome do paciente no campo de texto');
  addBullet('Selecione a prioridade: Emergencia, Prioridade ou Normal');
  addBullet('Escolha o encaminhamento: Triagem, Sala de ECG, Curativos, Raio X, etc.');
  addBullet('Clique em "Registrar"');
  
  addSpacer(5);
  addSubtitle('Niveis de Prioridade');
  addBullet('EMERGENCIA (vermelho) - Atendimento imediato');
  addBullet('PRIORIDADE (amarelo) - Idosos, gestantes, deficientes');
  addBullet('NORMAL (verde) - Ordem de chegada');
  
  addSpacer(5);
  addSubtitle('Encaminhamento Silencioso');
  addText('Marque "Encaminhar para triagem (sem audio)" para nao anunciar na TV.');
  addText('Util quando o paciente ja esta na sala de espera.');
  
  addSpacer(5);
  addSubtitle('Indicador de Tempo de Espera');
  addBullet('Badge vermelho mostra tempo de espera');
  addBullet('Badge pisca apos 20 minutos de espera');

  // MÓDULO TRIAGEM
  addPage();
  addTitle('4. MODULO TRIAGEM');
  addSpacer(3);
  
  addText('O modulo Triagem e usado pela equipe de enfermagem para classificar e encaminhar pacientes.');
  addSpacer(5);
  
  addSubtitle('Acoes Disponiveis');
  addSpacer(3);
  addTableRow('Botao', 'Funcao', true);
  addTableRow('Chamar', 'Chama paciente e anuncia na TV');
  addTableRow('Rechamar', 'Repete o chamado do paciente atual');
  addTableRow('Finalizar Triagem', 'Conclui triagem (conta como atendimento)');
  addTableRow('Desistencia', 'Paciente nao compareceu');
  addTableRow('Encaminhar', 'Envia para medico ou procedimento');
  addTableRow('Observacoes', 'Adiciona/edita notas internas');
  
  addSpacer(8);
  addSubtitle('Encaminhamentos Disponiveis');
  addBullet('Consultorio Medico 1');
  addBullet('Consultorio Medico 2');
  addBullet('Sala de Eletrocardiograma');
  addBullet('Sala de Curativos');
  addBullet('Sala do Raio X');
  addBullet('Enfermaria');
  
  addSpacer(8);
  addSubtitle('Notificacoes de Novos Pacientes');
  addText('Quando um novo paciente chega, o sistema:');
  addBullet('Toca um som especifico por prioridade');
  addBullet('Mostra alerta visual pulsante na tela');
  addText('Duracao do alerta:');
  addBullet('Emergencia: 5 segundos');
  addBullet('Prioridade: 3 segundos');
  addBullet('Normal: 2 segundos');

  // MÓDULO MÉDICO
  addPage();
  addTitle('5. MODULO MEDICO');
  addSpacer(3);
  
  addText('O modulo Medico e utilizado pelos medicos para chamar pacientes para consulta.');
  addSpacer(5);
  
  addSubtitle('Selecao de Consultorio');
  addText('IMPORTANTE: Selecione seu consultorio antes de iniciar:');
  addBullet('Consultorio Medico 1');
  addBullet('Consultorio Medico 2');
  addText('O sistema lembra sua ultima selecao.');
  
  addSpacer(5);
  addSubtitle('Filas Separadas');
  addText('Cada consultorio possui sua propria fila independente:');
  addBullet('Consultorio 1: Ve apenas pacientes encaminhados para Consultorio 1');
  addBullet('Consultorio 2: Ve apenas pacientes encaminhados para Consultorio 2');
  
  addSpacer(5);
  addSubtitle('Fluxo de Atendimento');
  addBullet('1. Paciente na fila');
  addBullet('2. Medico clica "Chamar"');
  addBullet('3. TV anuncia o nome do paciente e destino');
  addBullet('4. Paciente aparece em "Chamada Atual"');
  addBullet('5. Medico clica "Concluir Consulta" ou "Desistencia"');
  
  addSpacer(5);
  addSubtitle('Acoes do Medico');
  addTableRow('Acao', 'Descricao', true);
  addTableRow('Chamar', 'Anuncia paciente na TV');
  addTableRow('Rechamar', 'Repete chamado do paciente atual');
  addTableRow('Concluir Consulta', 'Finaliza atendimento com sucesso');
  addTableRow('Desistencia', 'Paciente nao compareceu');
  addTableRow('Observacoes', 'Ver/adicionar notas da triagem');

  // MÓDULO ADMINISTRATIVO
  addPage();
  addTitle('6. MODULO ADMINISTRATIVO');
  addSpacer(3);
  
  addText('O modulo Administrativo oferece estatisticas, backup e gerenciamento do sistema.');
  addSpacer(5);
  
  addSubtitle('Dashboard de Estatisticas');
  addBullet('Total de Chamadas do dia');
  addBullet('Chamadas de Triagem e Medico');
  addBullet('Tempo Medio de Espera');
  addBullet('Status atual dos pacientes');
  
  addSpacer(5);
  addSubtitle('Estatisticas de Procedimentos');
  addBullet('Eletrocardiograma - Contagem de ECGs');
  addBullet('Curativos - Procedimentos de curativo');
  addBullet('Raio X - Exames de raio X');
  addBullet('Enfermaria - Encaminhamentos para leito');
  
  addSpacer(5);
  addSubtitle('Graficos Disponiveis');
  addBullet('Chamadas por Dia - Linha temporal dos ultimos 30 dias');
  addBullet('Chamadas por Hora - Distribuicao horaria do dia');
  addBullet('Tipos de Atendimento - Pizza com triagem vs medico');
  
  addSpacer(5);
  addSubtitle('Funcoes Administrativas');
  addText('Senha para funcoes administrativas: Paineiras@1');
  addSpacer(3);
  addBullet('Exportar PDF - Gera relatorio completo');
  addBullet('Backup - Exporta dados em JSON');
  addBullet('Restaurar - Importa backup anterior');
  addBullet('Limpar Estatisticas - Remove registros');
  addBullet('Comparacao de Unidades - Compara desempenho');

  // MODO TV
  addPage();
  addTitle('7. MODO TV (DISPLAY PUBLICO)');
  addSpacer(3);
  
  addText('O Modo TV e projetado para exibicao em televisores na sala de espera.');
  addSpacer(5);
  
  addSubtitle('Caracteristicas');
  addBullet('Tela cheia automatica');
  addBullet('Cursor oculto (aparece ao mover mouse)');
  addBullet('Anuncios por voz com nome e destino');
  addBullet('Videos do Google Drive/YouTube');
  addBullet('Ticker de noticias na parte inferior');
  addBullet('Previsao do tempo rotativa (30 cidades de MG)');
  addBullet('Relogio digital grande');
  
  addSpacer(5);
  addSubtitle('Anuncios por Voz');
  addText('Quando um paciente e chamado:');
  addBullet('1. Som de notificacao (1up.mp3)');
  addBullet('2. Voz anuncia: "Joao Silva, por favor dirija-se a Triagem"');
  addBullet('3. Repete o anuncio uma segunda vez');
  addBullet('4. Flash visual na tela (azul para triagem, verde para medico)');
  
  addSpacer(5);
  addSubtitle('Anuncios de Hora');
  addBullet('Ocorrem 3x por hora em intervalos aleatorios');
  addBullet('Silenciados entre 22h e 6h');
  addBullet('Exemplo: "Bom dia! Sao 14 horas e 35 minutos"');
  
  addSpacer(5);
  addSubtitle('Sair do Modo TV');
  addBullet('Mova o mouse para ver o cursor');
  addBullet('Clique no botao X discreto (canto inferior direito)');
  addBullet('Confirme na caixa de dialogo');

  // CHAT INTERNO
  addPage();
  addTitle('8. CHAT INTERNO');
  addSpacer(3);
  
  addText('Sistema de comunicacao em tempo real entre os setores.');
  addSpacer(5);
  
  addSubtitle('Setores');
  addTableRow('Setor', 'Cor', true);
  addTableRow('Cadastro', 'Azul');
  addTableRow('Triagem', 'Amarelo');
  addTableRow('Medico', 'Verde');
  
  addSpacer(5);
  addSubtitle('Funcionalidades');
  addBullet('Enviar mensagem para setor especifico ou todos');
  addBullet('Indicador de digitacao em tempo real');
  addBullet('Emojis rapidos');
  addBullet('Sons distintos por setor remetente');
  addBullet('Badge de mensagens nao lidas');
  addBullet('Limpar chat (so do seu setor)');
  
  addSpacer(5);
  addSubtitle('Como Usar');
  addBullet('Selecione o destinatario (ou "Todos")');
  addBullet('Digite sua mensagem');
  addBullet('Pressione Enter ou clique em enviar');
  addText('Mensagens sao excluidas automaticamente apos 24 horas.');

  // CONFIGURAÇÕES DE ÁUDIO
  addPage();
  addTitle('9. CONFIGURACOES DE AUDIO');
  addSpacer(3);
  
  addText('Acesse pelo icone de engrenagem no cabecalho.');
  addSpacer(5);
  
  addSubtitle('Volumes Ajustaveis');
  addTableRow('Configuracao', 'Descricao', true);
  addTableRow('Notificacao de Chamada', 'Som antes do anuncio');
  addTableRow('Voz TTS (Chamada)', 'Volume da voz do paciente');
  addTableRow('Notificacao de Hora', 'Som antes do anuncio de hora');
  addTableRow('Voz de Hora', 'Volume da voz do horario');
  
  addSpacer(8);
  addSubtitle('Configurar Vozes');
  addText('No modulo Administrativo, clique em "Configurar Vozes".');
  addSpacer(3);
  addText('Vozes Femininas: Alice, Aria, Domi, Elli, Bella, Rachel');
  addText('Vozes Masculinas: Antonio, Arnold, Adam, Sam, Josh, Clyde');
  addSpacer(3);
  addText('Clique em "Testar" para ouvir cada voz.');
  addText('Preferencias sao salvas por unidade de saude.');

  // DICAS E BOAS PRÁTICAS
  addPage();
  addTitle('10. DICAS E BOAS PRATICAS');
  addSpacer(3);
  
  addSubtitle('Configuracao Inicial');
  addBullet('Todos os PCs devem estar na mesma rede');
  addBullet('Todos logados na mesma unidade de saude');
  addBullet('TV configurada com usuario tv/tv');
  addBullet('Clicar na tela da TV para ativar audio');
  
  addSpacer(5);
  addSubtitle('Prioridades');
  addBullet('EMERGENCIA: Use apenas para casos graves');
  addBullet('PRIORIDADE: Idosos 60+, gestantes, lactantes, deficientes');
  addBullet('NORMAL: Demais pacientes');
  
  addSpacer(5);
  addSubtitle('Solucao de Problemas');
  addTableRow('Problema', 'Solucao', true);
  addTableRow('Paciente nao aparece', 'Verificar se todos estao na mesma unidade');
  addTableRow('Audio nao funciona', 'Clicar na tela para ativar');
  addTableRow('Dados nao sincronizam', 'Verificar conexao de internet');
  addTableRow('Tela travada', 'Aguardar 10min (auto-reload) ou F5');
  
  addSpacer(8);
  addSubtitle('Backup Regular');
  addBullet('Faca backup SEMANAL dos dados');
  addBullet('Guarde em local seguro');
  addBullet('Anote a data do backup');
  
  addSpacer(8);
  addSubtitle('Senhas do Sistema');
  addTableRow('Funcao', 'Senha', true);
  addTableRow('Login funcionario', 'saude@1');
  addTableRow('Login TV', 'tv');
  addTableRow('Funcoes administrativas', 'Paineiras@1');

  // RODAPÉ EM TODAS AS PÁGINAS
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text(`Pagina ${i} de ${totalPages}`, pageWidth / 2, pageHeight - 10, { align: 'center' });
    if (i > 1) {
      doc.text('Solucao criada e cedida gratuitamente por Kalebe Gomes', pageWidth / 2, pageHeight - 5, { align: 'center' });
    }
  }

  // Salvar
  doc.save('Tutorial_Chamada_Pacientes.pdf');
};
