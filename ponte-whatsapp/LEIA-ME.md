# Ponte WhatsApp (pywhatkit) - envio automatico ao criar ocorrencia

Quando uma ocorrencia e aberta, o app envia a mensagem (igual a do "Copiar p/Whats",
com a linha do tempo) para o **telefone do "Responsavel Apoio"** daquela ocorrencia,
usando o WhatsApp Web logado na maquina.

## O que a ponte faz ao iniciar

1. Abre o **WhatsApp Web** (para login/QR). Se nao estiver logado, leia o QR Code.
2. Pede para voce teclar **ENTER** confirmando que esta logado.
3. Abre o **painel publicado**: https://danielmvr.github.io/relOcorrenciasWhat/
4. Fica **ativa** ouvindo em `http://127.0.0.1:5005` (so aceita a propria maquina).

## Para quem vai o envio

- Destino = telefone do **Responsavel Apoio** cadastrado na ocorrencia
  (Cadastros > Responsavel Apoio, campo Telefone).
- **Sem telefone cadastrado naquele responsavel, o envio e ABORTADO** e a janela da
  ponte mostra: `>>> ENVIO ABORTADO <<< Responsavel Apoio 'Fulano' NAO tem telefone...`.
- O numero pode estar em qualquer formato (ex.: `(21) 99866-0063`); a ponte normaliza
  e assume Brasil (+55) quando nao houver codigo do pais.

## Passo a passo (maquina de teste)

1. Instale o **Python 3** (marque "Add Python to PATH").
2. Deixe o **WhatsApp Web logado** no navegador padrao.
3. Cadastre o **telefone** de cada Responsavel Apoio em Cadastros > Responsavel Apoio.
4. Duplo clique em `start.bat` (instala o pywhatkit e inicia a ponte). Siga os passos 1-3 acima.
   - Manual: `pip install --no-cache-dir pywhatkit` e depois `python ponte.py`.
5. Crie uma ocorrencia no painel. A mensagem vai para o telefone do Responsavel Apoio.

## Gerar o executavel (PonteWhats.exe na pasta raiz)

O `.exe` precisa ser gerado **na propria maquina Windows** (nao da para gerar em outro
sistema operacional). Basta dar **duplo clique em `build-exe.bat`** (aqui na pasta
ponte-whatsapp): ele instala o PyInstaller e cria o **`PonteWhats.exe` na pasta raiz**
do projeto (AppFluxoOcorrencias). Depois e so dar duplo clique no `PonteWhats.exe`.

Comando equivalente (manual, de dentro de ponte-whatsapp):

    py -m pip install --no-cache-dir pyinstaller pywhatkit
    py -m PyInstaller --onefile --console --name PonteWhats --distpath .. --workpath build --specpath build --hidden-import pywhatkit --hidden-import pyautogui ponte.py

Observacoes:
- O `--console` mantem a janela aberta (necessaria para o login/QR e para ver os avisos
  de envio/abortado).
- Se ao rodar o .exe faltar algum modulo, gere de novo acrescentando, por ex.,
  `--hidden-import <modulo>`.
- A pasta `build` pode ser apagada depois de gerar o .exe.
- O `PonteWhats.exe` faz tudo: abre o WhatsApp Web (login/QR), abre o painel publicado
  e mantem a ponte ativa.

## Importante

- **O pywhatkit assume teclado/mouse por ~15-20s a cada envio** (abre uma aba do WhatsApp
  Web e envia). Nao use a maquina nesse intervalo e mantenha-a destravada.
- **Nao oficial**: automatizar o WhatsApp Web e contra os termos do WhatsApp (risco de
  bloqueio). Use um numero dedicado.
- Envia apenas a maquina que **cria** a ocorrencia e que esta rodando a ponte.
- Desligar o envio: em `assets/whatsapp-config.js`, troque `ativo: true` por `false`.

## Erro de instalacao (Permission denied / cache do pip)

Se aparecer `Permission denied: '...pip\cache\wheels...'`, instale ignorando o cache
(o start.bat ja faz): `py -m pip install --no-cache-dir pywhatkit`. Se persistir por
permissao, use tambem `--user`.

## Observacao sobre escala

Isto e uma prova de conceito. Para producao (varios envios, grupos, alertas por tempo/status
sem ocupar a maquina), o caminho e a API oficial / provedor, que conversamos.
