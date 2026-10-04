# 🌿 Jornada: O Guardião dos Bosques

Um jogo de ação e aventura top-down 2D épico construído com padrões modernos de desenvolvimento web (HTML5 Canvas, Vanilla JavaScript ES6+ e Web Audio API nativo).

Desenvolvido para ser leve, responsivo, funcionar nativamente em navegadores no PC ou celular, e pronto para publicação gratuita e instantânea no **GitHub Pages**.

---

## 🎮 Como Jogar no seu PC

Você tem duas formas super simples de testar o jogo na sua máquina:

### Opção 1: Inicializador Automático (Recomendado)
1. Dê um duplo-clique no arquivo **`iniciar_jogo.bat`**.
2. Um mini-servidor local será iniciado e o navegador abrirá automaticamente em `http://localhost:8080`.

### Opção 2: Abertura Direta
- Basta dar um duplo clique no arquivo **`index.html`** no seu navegador preferido (Google Chrome, Microsoft Edge, Firefox, Brave, etc.). Como todos os gráficos e músicas são gerados proceduralmente via Canvas e Web Audio, o jogo roda 100% sem erros de CORS!

---

## 🕹️ Controles

| Ação | Teclado | Touch (Celular) |
| :--- | :--- | :--- |
| **Mover o Guardião** | `W, A, S, D` ou `Setas` | D-Pad virtual |
| **Correr (Sprint contínuo)** | Segurar `Shift` (consome barra de vigor) | Botão 🏃 |
| **Esquiva Rápida (Dash)** | `Q` ou `K` (com rastro e recarga) | Botão 💨 |
| **⚡ Super Poder Sísmico** | `R` (Pós-Boss 1 - Pisão Sísmico em área) | Botão ⚡ |
| **🔄 Trocar Arma (Feitiço / Espada)** | `F` ou `Tab` (após o 2º Boss) | Botão 🔄 ou botão no HUD |
| **🏹 Raio Astral de Longo Alcance** | `C` ou `X` (após o 3º Boss - Feixe Perfurante) | Botão 🏹 |
| **Atacar (Arma Ativa)** | `Espaço` ou `J` ou Clique | Botão ⚔️ |
| **Interagir / Ativar Checkpoint** | `E` | Botão 💬 |
| **Som & Música** | Botão 🔊 no canto superior |

---

## 🛡️ Dificuldade Elevada, Vidas Limitadas & Sistema de Checkpoints

- **Economia Rigorosa de Vidas (🛡️):** O jogador inicia com **3 vidas** (máximo de 5). A taxa de drop de corações de monstros foi reduzida para apenas 20%.
- **Menos Vidas:** Enigmas decifrados e transições de portais concedem **Cura Plena de HP**, mas **NÃO concedem vidas extras**. Vidas extras são conquistadas **exclusivamente ao derrotar os 4 Grandes Chefes**.
- **🚩 Sistema de Checkpoints com Registro Físico:** Cada fase contém um monólito ancestral com cristal flutuante. Ao aproximar-se e pressionar `[E]`, o ponto de renascimento é ativado e registrado no topo da tela (`🚩 Checkpoint: [Nome do Local]`). Se a barra de vida esgotar (vidas > 0) ou ao dar "Tentar Novamente", o herói ressurge no checkpoint ativo registrado!

---

## 🗺️ As 14 Fases da Campanha, Enigmas Lógicos & 7 Chefes Divinos Alternados

Todas as fases de quebra-cabeça e exploração agora conduzem diretamente a uma arena de chefe dedicada!

```
[1. Bosque dos Ecos] ➔ Falar com Sylva, coletar as 5 Sementes e ativar o Totem da Seiva
       ⬇
[2. Caverna dos Cristais] ➔ 🧩 ENIGMA 1: HARMONIA MUSICAL RÚNICA
       │ Toque os 3 Cristais Harmônicos na ordem melódica: Safira (Dó) ➔ Topázio (Mi) ➔ Ametista (Sol).
       │ Obtenha a Gema da Aurora no Baú para habilitar os feitiços do Cajado.
       ⬇
[3. Santuário da Árvore Mãe] ➔ 👑 1º CHEFE: MALAKAR, O COLOSSO SOMBRIO (36 HP)
       │ Pisotões sísmicos duplos, estacas sombrias telegrafadas e lacaios.
       ⬇ ⚡ RECOMPENSA: Ganha o PODER SÍSMICO [R] + Disparo Triplo Celestial!
[4. Palácio dos Ventos] ➔ 🧩 ENIGMA 2: ROSA DOS VENTOS / LÓGICA VETORIAL
       │ Gire os 4 cataventos com [E] até que todas as correntes apontem para o centro do templo!
       ⬇
[5. Trono do Trovão] ➔ 👑 2º CHEFE: VALDOR, O ARCONTE DO TROVÃO (48 HP)
       │ Relâmpagos telegrafados quádruplos, tempestade de choque e furacão.
       ⬇ ⚔️ RECOMPENSA: Ganha a ESPADA DO TROVÃO + Troca Livre com [F] / [Tab]!
[6. Abismo da Forja de Magma] ➔ 🧩 ENIGMA 3: CALDEIRAS TÉRMICAS E ARITMÉTICA DA FORJA
       │ Regule as 4 caldeiras (+4, +6, +7, -3) para somar exatamente 10 ºC no cadinho.
       │ Forje a Espada de Fogo Estelar em 10 ºC para abrir o portal!
       ⬇
[7. Núcleo do Eclipse Cósmico] ➔ 👑 3º CHEFE: KHARON, O SOBERANO DO ECLIPSE (65 HP)
       │ Vórtice gravitacional cósmico, chuva de meteoros e nova do vácuo!
       ⬇ 🔥 RECOMPENSA: Conquista a INCINERAÇÃO CÓSMICA (DoT) e o RAIO ASTRAL [C] / [X]!
[8. Geleira de Niflheim] ➔ 🧩 ENIGMA 4: REFRAÇÃO GLACIAL EM 90 GRAUS E HARMONIZAÇÃO SOLAR
       │ Ajuste a rotação dos 3 Prismas Glaciais de quartzo [E].
       │ O Raio Astral [C] viaja sem limite de tempo até atingir bordas ou alvos.
       │ Ao atravessar os 3 direcionadores, o tiro MUDA DE COR para Dourado Solar!
       │ Tiros diretos na Runa sem passar pelos 3 prismas são repelidos pelo escudo rúnico!
       ⬇
[9. Arena Glacial] ➔ 👑 4º CHEFE: TRINIT, A TRÍADE GLACIAL (65 HP)
       │ Divide-se em 3 clones autônomos com HP compartilhado e ataques em triângulo convergente!
       ⬇ 🛡️ RECOMPENSA: +1 Vida Extra, Coração Máximo e Cura Plena!
[10. Templo de Cronos] ➔ 🧩 ENIGMA 5: SINCRONIA TEMPORAL DE LONGA DISTÂNCIA
       │ Dispare o Raio Astral [C] para ativar os 3 Totens distantes isolados em ilhotas sobre fossos.
       │ Cada totem ressoa por 6s: mantenha os 3 totens acesos SIMULTANEAMENTE!
       ⬇
[11. Nexus de Cronos] ➔ 👑 5º CHEFE: MIRAGE, O SENHOR DOS REFLEXOS (70 HP)
       │ Conjura 2 clones fantasmas idênticos e invulneráveis a ataques.
       │ DICA: O Mirage real emite partículas douradas da Relíquia de Cronos em seu peito!
       │ A cada 8 segundos, o tempo desacelera e ele embaralha posições para confundir o herói!
       ⬇ 🛡️ RECOMPENSA: +1 Vida Extra, Coração Máximo e Cura Plena!
[12. Labirinto das Sombras] ➔ 🧩 ENIGMA 6: MATRIZ BOOLEANA DE ORBES ESPECTRAIS
       │ Interagir com um orbe com [E] ou Raio Astral [C] inverte o seu estado e o dos orbes vizinhos conectados.
       │ Harmonize a rede lógica para que TODOS OS 4 ORBES fiquem acesos simultaneamente!
       ⬇
[13. Santuário do Abismo] ➔ 👑 6º CHEFE: NOCTURNUS, O SOBERANO DO ABISMO (80 HP)
       │ Arremessa foices bumerangues giratórias, conjura poços de vazio desacelerantes e teletransporta nas sombras!
       ⬇ 🛡️ RECOMPENSA: +1 Vida Extra, Coração Máximo e Cura Plena!
[14. Cidadela do Éter] ➔ 👑 7º MEGA-CHEFE FINAL: AETHON, O ARQUITETO DAS DIMENSÕES (85 HP)
       │ Protegido por um Escudo Dimensional intransponível contra ataques normais.
       │ Use o Raio Astral [C] para estilhaçar o escudo por 5.5s e desferir golpes mortais de Espada e Feitiço!
       ⬇
✨ VITÓRIA SUPREMA DAS 14 FASES E 7 CHEFES DIVINOS!
```

---

### ⚔️ Arsenal Completo & Habilidades

1. **🪄 Cajado da Aurora (Modo Feitiço à Distância):**
   - Dispara projéteis arcanos luminosos.
   - Pós-Boss 1: Ganha **Disparo Triplo Celestial** cobrindo uma área em leque.
2. **⚡ Pisão Sísmico Sagrado (Super Poder do 1º Boss [R]):**
   - Onda expansiva dourada de 185px de raio que anula projéteis e causa **3 de dano em área**.
3. **⚔️ Espada Celestial do Trovão (Nível 1 - Conquistada no 2º Boss):**
   - Cortes velozes com **2 de dano físico** e arco elétrico. Alternância com [F] ou [Tab].
4. **🔥 Espada do Fogo Estelar (Nível 2 - Forjada no Magma):**
   - Dano 3 devastador com partículas incandescentes.
5. **🔥 Incineração Cósmica (DoT - Desbloqueada no 3º Boss Kharon):**
   - Todos os golpes do herói queimam inimigos por 4 segundos com dano contínuo.
6. **🏹 Raio Astral Harmonizado (Desbloqueado no 3º Boss Kharon - Teclas [C] / [X]):**
   - Feixe de longo alcance que só é eliminado ao atingir as bordas da tela ou um alvo válido.
   - Cruza abismos e fendas intransponíveis, perfura múltiplos inimigos, reflete a 90º em prismas de quartzo (mudando para Dourado Solar ao harmonizar os 3) e estilhaça o escudo dimensional do Mega-Chefe Aethon!
