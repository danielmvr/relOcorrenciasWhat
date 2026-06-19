/* =====================================================================
   Envio automatico para WhatsApp via ponte local (pywhatkit).
   - ativo: liga/desliga o envio ao criar uma ocorrencia.
   - ponteUrl: endereco do servico ponte.py rodando na maquina.
   O DESTINO e o telefone do "Responsavel Apoio" cadastrado na ocorrencia
   (Cadastros > Responsavel Apoio). Sem telefone cadastrado, o envio e
   abortado e a ponte avisa na janela (cmd). Requer ponte.py rodando.
   ===================================================================== */
window.WHATSAPP_CONFIG = {
  ativo: true,
  ponteUrl: "http://127.0.0.1:5005/enviar",
  // Grupo do WhatsApp que tambem recebe os avisos (alem dos envios individuais).
  // grupoId = codigo do link de convite (a parte depois de chat.whatsapp.com/).
  // Link atual: https://chat.whatsapp.com/K9mSQf62hQE7cL73zR4ReM
  // Deixe grupoId vazio ("") para desligar o envio ao grupo.
  grupoId: "K9mSQf62hQE7cL73zR4ReM",
  grupoNome: "Grupo Plantao"
};
