# Taxonomia de estado

> **Stack:** React 19 + Vite + TanStack Query + Zustand + React Hook Form + Zod
> **Conceito:** classificar o estado **antes** de escolher a ferramenta

---

## O problema que este projeto ataca

"Redux ou Context?" é a pergunta errada, e é a que domina metade das discussões
de arquitetura front. Ela pressupõe que exista **um** estado a ser gerenciado.

Não existe. Existem seis tipos, com donos, ciclos de vida e problemas
completamente diferentes. Quando você separa os seis, descobre que **a maior
parte do que estava sendo discutida é cache de servidor** — e nem Redux nem
Context são a resposta para cache.

O salto de senioridade aqui não é aprender uma biblioteca nova. É desenvolver o
reflexo de perguntar **"que tipo de estado é este?"** antes de escrever
`useState`.

---

## A tabela que resolve 90% das decisões

| Tipo | Quem é o dono | Ferramenta | Erro clássico |
|---|---|---|---|
| **Server state** | o servidor | TanStack Query / SWR / RSC | jogar resposta de API no Redux |
| **UI state global** | você | Zustand / Jotai | colocar em Context e re-renderizar tudo |
| **Form state** | o formulário | React Hook Form + Zod | um `useState` por campo |
| **URL state** | a URL | `searchParams` / `nuqs` | guardar filtro em memória e perder no F5 |
| **Persistente** | o navegador | cookie / localStorage | ler `localStorage` no render |
| **Derivado** | ninguém — não é estado | cálculo no render | `useState` + `useEffect` para sincronizar |

---

## Rodando

```bash
npm install
npm run dev
```

Abra o DevTools na aba Network antes de mexer. Boa parte do que este projeto
ensina só é visível ali.

---

## O que ler, em ordem

1. **`server-state/TodosManual.ruim.tsx`** — a lista das oito responsabilidades
   que `useEffect` + `useState` não cobrem. Leia o comentário sobre race
   condition: é o bug invisível em desenvolvimento que aparece em produção.

2. **`server-state/TodosQuery.tsx`** — o mesmo comportamento com cache de
   verdade, incluindo atualização otimista com rollback. O terceiro item da lista
   falha de propósito: marque e desmarque para ver a UI reverter.

3. **`ui-state/uiStore.ts`** — a regra que encerra o debate Context vs. store, e
   por que ela é sobre *frequência de mudança*, não sobre performance genérica.

4. **`form-state/SignupForm.tsx`** — schema Zod como fonte única (`z.infer`), e
   por que validação de cliente é conveniência, nunca proteção.

5. **`url-state/useUrlState.ts`** — a lista de seis coisas que você quebra ao
   guardar filtro em `useState`, e a diferença entre `pushState` e `replaceState`.

6. **`persistent-state/useTheme.ts`** — hydration mismatch e as três causas de
   `localStorage` falhar (incluindo a que **lança exceção** em vez de devolver
   `null`).

7. **`derived-state/derived.tsx`** — o checklist final de "isto deveria mesmo ser
   estado?".

---

## As frases para levar

> **Dado de servidor não é estado. É cache.**
> Você não é dono dele, ele pode mudar sem você saber, e precisa ser revalidado.

> **Se o usuário mandasse este link para alguém, essa pessoa deveria ver a mesma
> tela?** Se sim, o estado é da URL.

> **Context é injeção de dependência, não gerenciador de estado.**
> Use para o que é estável; use store para o que muda.

> **`useEffect` sincroniza com sistemas externos.**
> Se as duas pontas são React, é cálculo, não efeito.

---

## Decisões documentadas

- [ADR-001 — TanStack Query como camada de dado de servidor](./docs/ADR-001-tanstack-query-para-server-state.md)
- [ADR-002 — Zustand para UI global; Context apenas para o estável](./docs/ADR-002-zustand-para-ui-context-para-estavel.md)

---

## Exercícios

1. **Conte as requisições.** Abra o DevTools e recarregue. Compare o número de
   requisições dos dois painéis de server state. Depois abra a aba, saia dela e
   volte. O painel da direita não refaz nada dentro do `staleTime`.

2. **Veja o rollback.** Marque o terceiro item (&quot;Comparar o número de
   requisições&quot;) nos dois painéis. À esquerda nada acontece até a resposta
   chegar, e o erro aparece sem contexto. À direita a mudança aplica na hora e
   **reverte** quando falha. Agora tente implementar esse comportamento à mão no
   painel da esquerda — e cronometre.

3. **Provoque a race condition.** No painel manual, mude a API para ter latência
   aleatória entre 100ms e 2s. Dispare vários toggles rápidos. Observe a resposta
   antiga sobrescrevendo a nova.

4. **Sinta o custo do Context.** Substitua a store Zustand por um Context com
   `{ sidebarOpen, density }`. Coloque `console.log` em cada componente que
   consome. Abra a sidebar e conte quantos re-renderizam. Depois volte.

5. **URL state de verdade.** Adicione um campo de busca por texto ao painel de
   URL state, sincronizado com `?q=`. Decida entre `pushState` e `replaceState` e
   justifique: o usuário deveria conseguir desfazer cada letra com o botão
   voltar?

6. **Quebre a hidratação.** Em `useTheme.ts`, troque a inicialização por
   `useState(() => localStorage.getItem('lab:theme'))`. Abra em janela anônima
   com cookies bloqueados. Observe a exceção — e note que ela derruba a árvore
   inteira, não só o tema.

7. **O exercício de tech lead.** Pegue uma tela do seu trabalho e classifique
   **cada** `useState` dela nas seis categorias. Conte quantos são de fato UI
   state local. Na maioria das telas, a resposta fica entre 10% e 30% — e o resto
   está na ferramenta errada.

---

## Armadilha comum

Adotar TanStack Query e continuar guardando a resposta em `useState`:

```tsx
const { data } = useQuery(...)
const [items, setItems] = useState([])
useEffect(() => { if (data) setItems(data) }, [data])   // ← desfaz tudo
```

Isso reintroduz cada um dos problemas que a biblioteca resolvia, mais o custo
dela. Se você precisa "mexer" no dado antes de mostrar, **derive** no render ou
use `select` na própria query — nunca copie para um estado paralelo.


---

## Faz parte de uma série

16 projetos independentes, um por conceito, sobre o que separa um dev pleno de um
senior/tech lead em React e Next.js. Cada um tem README, ADRs documentando as
decisões, e exercícios.

| Projeto | Conceito |
|---|---|
| [react-solid-principles](https://github.com/vmarins2005/react-solid-principles) | Os 5 principios SOLID traduzidos para componentes React, com anti-exemplo e versao boa lado a lado |
| [react-when-to-abstract](https://github.com/vmarins2005/react-when-to-abstract) | A mesma feature em 3 versoes: duplicada, abstraida cedo demais, e abstraida na hora certa |
| [react-component-patterns](https://github.com/vmarins2005/react-component-patterns) | Compound, headless, slots, state reducer e estado controlavel: como absorver variacao sem explodir em props |
| [react-feature-architecture](https://github.com/vmarins2005/react-feature-architecture) | Organizacao por feature em Next.js, com fronteiras garantidas por ESLint em vez de disciplina |
| [react-clean-architecture](https://github.com/vmarins2005/react-clean-architecture) | Clean Architecture no front: dominio puro, portas e adaptadores, sem uma linha de React no nucleo |
| `react-state-management` **(você está aqui)** | Os 6 tipos de estado em React e a ferramenta certa para cada um |
| [react-state-machines](https://github.com/vmarins2005/react-state-machines) | Da sopa de booleanos ao XState: tornar estados invalidos inexprimiveis |
| [react-typescript-safety](https://github.com/vmarins2005/react-typescript-safety) | Tipo nao existe em runtime: validacao com Zod, branded types e verificacao de exaustividade |
| [react-testing-strategy](https://github.com/vmarins2005/react-testing-strategy) | Testing Trophy com Vitest, Testing Library, MSW, Playwright e axe |
| [react-nextjs-performance](https://github.com/vmarins2005/react-nextjs-performance) | Waterfalls de requisicao, streaming com Suspense e o que RSC realmente economiza de bundle |
| [react-nextjs-caching](https://github.com/vmarins2005/react-nextjs-caching) | As 4 camadas de cache do App Router e como diagnosticar dado velho na tela |
| [react-accessibility](https://github.com/vmarins2005/react-accessibility) | WCAG 2.2 AA em React: foco, teclado, live regions e os requisitos invisiveis em code review |
| [react-nextjs-security](https://github.com/vmarins2005/react-nextjs-security) | Server Action e endpoint publico: autorizacao, validacao, rate limit e CSP com nonce |
| [react-nextjs-observability](https://github.com/vmarins2005/react-nextjs-observability) | Taxonomia de erros, error boundaries, log estruturado e feature flags com kill switch |
| [react-design-system-monorepo](https://github.com/vmarins2005/react-design-system-monorepo) | Design system como pacote versionado: Turborepo, design tokens e changesets |
| [react-git-workflow](https://github.com/vmarins2005/react-git-workflow) | Commit atomico e Conventional Commits, com historico curado e um bug para achar via git bisect |

---

## Licença

[MIT](./LICENSE) — use, copie e adapte à vontade, inclusive em projeto comercial.
Se este material ajudou, uma estrela no repositório é o suficiente.
