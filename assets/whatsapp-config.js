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
  ponteUrl: "http://127.0.0.1:5005/enviar"
};
