# 💻 Guia do Ambiente de Desenvolvimento (The Halls)

Bem-vindo(a)! Se o seu computador está "zerado" ou se você nunca programou em Python na sua máquina, siga este tutorial passo a passo antes de tentar rodar o **SafeView**.

Nós precisamos instalar a "Tríade do Desenvolvedor": o Editor de Texto (VS Code), a Linguagem (Python) e o Gerenciador de Versões (Git).

---

## 🛠️ Passo 1: Instalando o Visual Studio Code (VS Code)
Este é o programa onde vamos ler e editar o código do projeto.

1. Acesse o site oficial: [code.visualstudio.com](https://code.visualstudio.com/)
2. Clique no botão azul gigante **"Download for Windows"**.
3. Abra o arquivo baixado e instale normalmente (pode ir clicando em "Avançar" e aceitar os termos).
4. **Dica:** Na tela de "Tarefas Adicionais", marque as opções que dizem *"Adicionar a ação Abrir com Code"*.

---

## 🐍 Passo 2: Instalando o Python (O Motor do Sistema)
O Python é o que faz o nosso servidor (Backend) funcionar. **Muita atenção nesta etapa!**

1. Acesse o site oficial: [python.org/downloads](https://www.python.org/downloads/)
2. Clique no botão amarelo **"Download Python 3.x.x"**.
3. Abra o instalador que você acabou de baixar.
4. 🛑 **ATENÇÃO:** Na primeira tela do instalador, lá embaixo, existe uma caixinha desmarcada chamada **`Add Python to PATH`** (ou *Add python.exe to PATH*). **VOCÊ PRECISA MARCAR ESSA CAIXA!** Se esquecer isso, o VS Code não vai reconhecer os comandos depois.
5. Após marcar a caixa, clique em **"Install Now"** e espere terminar.

---

## 🐙 Passo 3: Instalando o Git (A Máquina do Tempo)
O Git é a ferramenta que nos permite baixar o código do GitHub e trabalhar em equipe sem um apagar o trabalho do outro.

1. Acesse o site oficial: [git-scm.com/download/win](https://git-scm.com/download/win)
2. Clique na opção **"64-bit Git for Windows Setup"** para baixar.
3. Abra o instalador. O Git tem muitas telas de configuração, mas você não precisa mudar nada. Pode clicar em **"Next"** em absolutamente todas as telas até chegar no botão **"Install"**.

---

## ✅ Passo 4: Testando se deu tudo certo!
Vamos conferir se as instalações funcionaram.

1. Abra o seu **VS Code**.
2. No menu superior, clique em **Terminal** > **Novo Terminal** (ou aperte `` Ctrl + ` ``).
3. Na tela preta que abrir embaixo, digite `python --version` e dê Enter. Tem que aparecer a versão do Python (ex: *Python 3.12.2*).
4. Em seguida, digite `git --version` e dê Enter. Tem que aparecer a versão do Git (ex: *git version 2.44.0.windows.1*).

Se os dois comandos responderam com as versões, seu PC está pronto para programar. 

👉 Agora você já pode voltar para o arquivo principal **`README.md`** e seguir as instruções da seção **"Como baixar e rodar o projeto"**.