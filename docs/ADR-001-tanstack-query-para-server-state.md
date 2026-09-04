# ADR-001 — Adotar TanStack Query como camada de dado de servidor

- **Status:** Aceito
- **Data:** 2026-09-04

## Contexto

O padrão dominante na base era `useEffect` + `useState` para buscar dado. Ele
funciona no caminho feliz e falha em tudo o que está em volta. Cada tela
reimplementa — e reimplementa **diferente** — o mesmo conjunto de
responsabilidades:

- estados de carregamento e erro
- cancelamento ao desmontar
- deduplicação de requisições concorrentes
- revalidação ao focar a janela ou reconectar
- retry com backoff
- invalidação depois de escrever
- atualização otimista e rollback

Duas consequências mensuráveis:

1. **Requisições redundantes.** Dois componentes que precisam da mesma lista
   disparam duas chamadas. Navegar para fora e voltar refaz tudo.
2. **Race conditions.** Sem cancelamento correlacionado, a resposta lenta chega
   depois da rápida e sobrescreve o dado novo com o antigo. É o bug que não
   aparece em desenvolvimento e vira ticket de "o filtro voltou sozinho".

A causa raiz é conceitual: dado de servidor está sendo tratado como estado da
aplicação, quando ele é **cache de um estado que pertence a outro sistema**.

## Decisão

Adotar **TanStack Query** como camada única de acesso a dado de servidor.

Regras de uso:
- toda leitura de servidor passa por `useQuery`; nenhuma por `useEffect`
- `queryKey` derivada dos parâmetros da requisição, tipada
- `staleTime` **definido explicitamente** por tipo de dado — o padrão zero gera
  refetch em toda montagem, e a maioria dos dados tolera 30s
- mutação que altera dado listado invalida a query correspondente
- atualização otimista apenas onde a latência percebida importa, e **sempre** com
  rollback em `onError`

Proibido copiar `data` da query para um `useState` paralelo.

## Alternativas consideradas

| Alternativa | Prós | Contras | Por que não |
|---|---|---|---|
| `useEffect` + `useState` | Zero dependência | Reimplementa 8 responsabilidades por tela, com bugs diferentes em cada uma | É o problema |
| Hook próprio (`useFetch`) | Controle total; sem dependência | Vira uma reimplementação pior e não testada de uma biblioteca madura; alguém do time precisa mantê-la | Não é onde queremos gastar tempo de engenharia |
| SWR | Leve; API mínima | Menos recursos para mutação, paginação e cache granular | Boa escolha; perde em app com escrita complexa |
| RTK Query | Ótimo se já houver Redux | Traz Redux junto | Não temos Redux e não queremos introduzir |
| RSC + `fetch` do Next | Zero JS no cliente | Só resolve leitura no servidor; interação continua precisando de cache no cliente | Complementar, não substituto — ver o projeto [react-entendendo-o-cache-do-next](https://github.com/vmarins2005/react-entendendo-o-cache-do-next) |
| TanStack Query | Resolve as 8 responsabilidades; devtools excelentes; padrão de mercado | ~13kB gzip; conceitos novos (staleTime vs gcTime) | **Escolhido** |

## Consequências

**Positivas**
- Queda expressiva de requisições redundantes, sem otimização manual.
- Race conditions desaparecem por construção.
- Estados de carregamento e erro ficam uniformes na aplicação inteira.
- As devtools tornam o cache **visível** — o que muda a qualidade do debate sobre
  performance de dado.
- Código de tela encolhe: some o boilerplate e sobra o domínio.

**Negativas**
- Curva de aprendizado real em dois pontos: a diferença entre `staleTime` e
  `gcTime`, e o desenho de `queryKey`. Chave mal desenhada gera cache que não
  invalida — e esse bug é confuso de diagnosticar.
- Mais uma dependência no bundle.
- Atualização otimista é fácil de fazer pela metade: sem `cancelQueries`, a
  requisição em voo sobrescreve o otimismo ao chegar.

**Mitigações**
- Chaves centralizadas por feature (`todoKeys.all`, `todoKeys.detail(id)`) em vez
  de literais espalhados.
- `staleTime` padrão definido no `QueryClient`, sobrescrito conscientemente.
- Revisão de PR presta atenção específica em `onError` de mutação otimista.

**Monitorar**
- Ocorrências de `useEffect` com `fetch` — devem tender a zero. Vale uma regra de
  lint quando a migração terminar.

## Nota transferível

A frase que resolve a discussão em qualquer time:

> **Dado de servidor não é estado da sua aplicação. É cache.**

Uma vez que essa distinção é aceita, a escolha da ferramenta deixa de ser
preferência e vira consequência: você precisa de uma biblioteca de cache, e
gerenciadores de estado global não são isso.
