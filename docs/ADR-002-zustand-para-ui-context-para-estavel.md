# ADR-002 — Zustand para UI state global; Context apenas para o que é estável

- **Status:** Aceito
- **Data:** 2026-09-04

## Contexto

Depois de mover dado de servidor para TanStack Query (ADR-001), sobra pouco
estado global — e é justamente esse resto que gera confusão sobre qual ferramenta
usar.

O Context da própria React parece a resposta óbvia: é nativo, não adiciona
dependência, todo mundo conhece. O problema é específico e mensurável:

> **Todo consumidor de um Context re-renderiza quando QUALQUER parte do `value`
> muda.**

Um contexto com `{ sidebarOpen, density, activeModal }` faz a tabela de 500
linhas re-renderizar quando alguém abre a sidebar. As mitigações conhecidas —
memoizar o `value`, fatiar em vários contextos, `useMemo` no consumidor —
funcionam parcialmente e transformam o Context num quebra-cabeça de performance
que precisa ser re-resolvido a cada campo novo.

A raiz do mal-entendido: **Context não é gerenciador de estado. É um mecanismo
de transporte** — injeção de dependência. Ele foi desenhado para valores que
mudam raramente.

## Decisão

Separar por **frequência de mudança**, não por natureza do dado:

| O que | Ferramenta |
|---|---|
| Dependências, tema, sessão, configuração, feature flags — muda uma vez ou nunca | **Context** |
| UI global que muda com frequência e é lido por muitos componentes | **Zustand** |
| Estado local de um componente ou de uma subárvore rasa | **`useState`** / `useReducer` |

Regras de uso do Zustand:
- consumo **sempre** por seletor (`useUiStore((s) => s.sidebarOpen)`), nunca a
  store inteira
- seletores nomeados exportados junto da store, para evitar seletor inline que
  devolve objeto novo a cada render
- uma store por domínio de UI; não uma store única global

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| Context para tudo | Nativo; zero dependência | Re-render de todos os consumidores; fatiar vira quebra-cabeça permanente | É o problema que originou o ADR |
| Redux Toolkit | Devtools maduras; time-travel; middleware de auditoria; padrão consolidado | Boilerplate alto para o volume de estado que sobrou; conceitos demais para o benefício | Desproporcional depois que o server state saiu |
| Jotai | Atômico; granularidade máxima; ótimo para estado derivado complexo | Modelo mental de átomos exige adaptação; muitos átomos pequenos ficam difíceis de rastrear | Excelente opção; perdeu por familiaridade do time |
| Valtio | Proxy, escrita mutável e natural | "Mágica" implícita dificulta depurar o que causou o render | Menos previsível |
| Zustand | API mínima; seletores resolvem o re-render; sem provider; testável | Menos convenções que Redux — times grandes precisam combinar padrões | **Escolhido** |

## Consequências

**Positivas**
- Componente re-renderiza apenas quando a fatia que ele lê muda.
- Sem `Provider` obrigatório, o que simplifica testes e Storybook.
- Store é um objeto comum: dá para ler e escrever fora do React (em um
  interceptor, num handler de atalho de teclado).
- A migração é incremental: dá para mover um pedaço de Context por vez.

**Negativas**
- Store global é acessível de qualquer lugar, e isso **convida** a virar depósito
  de coisas que deveriam ser locais. Precisa de disciplina e de revisão em PR.
- Sem provider significa sem escopo: dois "carrinhos" independentes na mesma tela
  exigem `createStore` manual, que é mais verboso.
- Menos convenções que Redux: em time grande, dois desenvolvedores estruturam a
  store de formas diferentes se nada for combinado.
- Devtools existem, mas são mais simples que as do Redux.

**Monitorar**
- Tamanho da store. Se ela passar de ~10 campos, provavelmente há dado local ou
  de servidor escondido ali dentro.
- Componentes consumindo a store sem seletor: anula todo o benefício, e é o erro
  mais comum de quem está começando.

## Nota transferível

A hierarquia de decisão, do mais barato para o mais caro:

```
useState  →  lift up  →  useReducer  →  Context (se estável)
          →  Zustand (se muda muito)  →  Redux (se precisa de time-travel/auditoria)
```

Suba um degrau apenas quando sentir a dor do anterior. Começar no topo é o mesmo
erro de antecipação discutido no projeto [quando-abstrair](https://github.com/vmarins2005/quando-abstrair) — e a
sintomatologia é idêntica: muito código para pouco problema.
