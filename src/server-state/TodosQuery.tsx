import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { addTodo, listTodos, toggleTodo, type Todo } from '@/api/todos'

/**
 * VERSÃO BOA — dado de servidor tratado como cache, por uma biblioteca de cache.
 *
 * As oito responsabilidades listadas no anti-exemplo (dedupe, retry, cache,
 * revalidação, cancelamento, invalidação, otimismo, rollback) vêm de graça. O
 * código abaixo trata só do que é específico deste domínio.
 */

const TODOS_KEY = ['todos'] as const

export function TodosQuery() {
  const queryClient = useQueryClient()

  const todos = useQuery({
    queryKey: TODOS_KEY,
    queryFn: listTodos,
    // Por quanto tempo o dado é considerado fresco. Enquanto fresco, nenhuma
    // requisição é feita — nem ao montar outro componente, nem ao focar a janela.
    // Este é o parâmetro que mais impacta o número de requisições da aplicação,
    // e o que quase ninguém configura conscientemente.
    staleTime: 30_000,
  })

  /**
   * ATUALIZAÇÃO OTIMISTA COM ROLLBACK.
   *
   * O fluxo, e cada passo importa:
   *   onMutate  -> cancela requisições em voo (senão elas sobrescrevem o
   *                otimismo ao chegar), guarda o estado anterior, aplica o
   *                resultado esperado imediatamente
   *   onError   -> restaura o snapshot. Sem isso, a UI mente quando falha
   *   onSettled -> revalida, para convergir com a verdade do servidor
   *
   * O item "t3" da API falha de propósito. Marque e desmarque ele: você vê a
   * mudança acontecer e voltar. É o comportamento correto, e é o que quase
   * nenhuma implementação manual tem.
   */
  const toggle = useMutation({
    mutationFn: toggleTodo,
    async onMutate(id: string) {
      await queryClient.cancelQueries({ queryKey: TODOS_KEY })
      const previous = queryClient.getQueryData<Todo[]>(TODOS_KEY)

      queryClient.setQueryData<Todo[]>(TODOS_KEY, (current) =>
        current?.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo)),
      )

      return { previous }
    },
    onError(_error, _id, context) {
      if (context?.previous) queryClient.setQueryData(TODOS_KEY, context.previous)
    },
    onSettled() {
      void queryClient.invalidateQueries({ queryKey: TODOS_KEY })
    },
  })

  const create = useMutation({
    mutationFn: addTodo,
    onSuccess() {
      // Invalidação é a forma mais simples e mais correta de manter consistência
      // depois de escrever. Atualizar o cache à mão é otimização — faça só onde
      // a revalidação for perceptivelmente lenta.
      void queryClient.invalidateQueries({ queryKey: TODOS_KEY })
    },
  })

  if (todos.isPending) return <p>Carregando...</p>
  if (todos.isError) return <p role="alert">Falha ao carregar.</p>

  return (
    <div>
      <ul>
        {todos.data.map((todo) => (
          <li key={todo.id}>
            <label className="row">
              <input
                type="checkbox"
                checked={todo.done}
                onChange={() => toggle.mutate(todo.id)}
              />
              {todo.title}
            </label>
          </li>
        ))}
      </ul>

      <form
        className="row"
        onSubmit={(event) => {
          event.preventDefault()
          const input = event.currentTarget.elements.namedItem('title')
          if (input instanceof HTMLInputElement && input.value.trim()) {
            create.mutate(input.value.trim())
            input.value = ''
          }
        }}
      >
        <input name="title" placeholder="Nova tarefa" aria-label="Nova tarefa" />
        <button disabled={create.isPending}>{create.isPending ? 'Salvando...' : 'Adicionar'}</button>
      </form>

      <p className="muted">
        {todos.isFetching ? 'revalidando em segundo plano...' : 'dado fresco'} — marque
        &quot;Comparar o número de requisições&quot; para ver o rollback do otimismo.
      </p>
    </div>
  )
}
