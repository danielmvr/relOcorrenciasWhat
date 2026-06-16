# -*- coding: utf-8 -*-
# =====================================================================
# Ponte WhatsApp - Fluxo de Ocorrencias
# Ao iniciar:
#   1) abre o WhatsApp Web (para login/QR) e pede confirmacao;
#   2) abre o painel publicado (relOcorrenciasWhat);
#   3) fica ativa ouvindo o app.
# Ao receber um POST do app (ao criar uma ocorrencia):
#   - envia a mensagem para o telefone do "Responsavel Apoio" (vem no POST);
#   - se nao houver telefone cadastrado, ABORTA e avisa nesta janela.
#
# Requisitos: Python 3, pip install pywhatkit, WhatsApp Web logado.
# Rodar: python ponte.py  (ou start.bat). Para .exe: veja LEIA-ME.md.
# =====================================================================
import re
import json
import webbrowser
from http.server import BaseHTTPRequestHandler, HTTPServer

import pywhatkit

PORTA = 5005
ESPERA_SEG = 15
URL_WHATSAPP = "https://web.whatsapp.com"
URL_APP = "https://danielmvr.github.io/relOcorrenciasWhat/"


def normalizar_numero(bruto):
    """Mantem so digitos; sem codigo do pais (<=11 digitos) assume Brasil (+55)."""
    d = re.sub(r"\D", "", bruto or "")
    if not d:
        return ""
    if len(d) <= 11:
        d = "55" + d
    return "+" + d


def enviar_whatsapp(numero, mensagem):
    pywhatkit.sendwhatmsg_instantly(numero, mensagem, wait_time=ESPERA_SEG, tab_close=True, close_time=3)


class Handler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.send_header("Access-Control-Allow-Private-Network", "true")

    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()

    def do_GET(self):
        body = json.dumps({"ok": True, "status": "Ponte WhatsApp ativa. Use POST /enviar."}).encode("utf-8")
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(body)

    def do_POST(self):
        resp = {"ok": False}
        try:
            tamanho = int(self.headers.get("Content-Length", 0) or 0)
            corpo = self.rfile.read(tamanho).decode("utf-8") if tamanho else ""
            dados = json.loads(corpo) if corpo else {}
            mensagem = dados.get("mensagem") or ""
            destinos = dados.get("destinos")
            if not destinos:  # compatibilidade com o formato antigo (1 destino)
                destinos = [{"numero": dados.get("numero", ""), "nome": dados.get("responsavel", "")}]
            if not mensagem.strip():
                print("[ponte] ABORTADO: mensagem vazia.")
                resp = {"ok": False, "abortado": True, "motivo": "mensagem vazia"}
            else:
                total = len(destinos)
                enviados = 0
                print("")
                print("[ponte] Recebido: %d destinatario(s). Enviando UM POR VEZ..." % total)
                for i, d in enumerate(destinos, 1):
                    nome = (d.get("nome") or "(sem nome)").strip()
                    numero = normalizar_numero(d.get("numero") or "")
                    if not numero:
                        print("[ponte] (%d/%d) >>> ABORTADO <<< '%s' sem telefone cadastrado." % (i, total, nome))
                        continue
                    print("[ponte] (%d/%d) Enviando para %s (%s)..." % (i, total, nome, numero))
                    enviar_whatsapp(numero, mensagem)
                    enviados += 1
                    print("[ponte] (%d/%d) Enviado para %s." % (i, total, nome))
                print("[ponte] Concluido: %d de %d enviados." % (enviados, total))
                resp = {"ok": enviados > 0, "enviados": enviados, "total": total}
        except Exception as e:
            print("[ponte] ERRO:", e)
            resp = {"ok": False, "erro": str(e)}
        saida = json.dumps(resp).encode("utf-8")
        self.send_response(200)
        self._cors()
        self.send_header("Content-Type", "application/json")
        self.end_headers()
        self.wfile.write(saida)

    def log_message(self, *args):
        pass


def iniciar():
    print("============================================")
    print(" Ponte WhatsApp - Fluxo de Ocorrencias")
    print("============================================")
    print("1) Abrindo o WhatsApp Web...")
    print("   Se NAO estiver logado, leia o QR Code no navegador.")
    try:
        webbrowser.open(URL_WHATSAPP)
    except Exception as e:
        print("   (nao consegui abrir o navegador: %s)" % e)
    try:
        input("\n   Quando o WhatsApp Web estiver ABERTO e LOGADO, tecle ENTER para continuar...")
    except EOFError:
        pass
    print("2) Abrindo o painel (relOcorrenciasWhat)...")
    try:
        webbrowser.open(URL_APP)
    except Exception as e:
        print("   (nao consegui abrir o painel: %s)" % e)
    print("3) Ponte ATIVA em http://127.0.0.1:%d/enviar" % PORTA)
    print("   Deixe esta janela aberta. Ctrl+C para encerrar.")
    print("--------------------------------------------")
    HTTPServer(("127.0.0.1", PORTA), Handler).serve_forever()


if __name__ == "__main__":
    iniciar()
