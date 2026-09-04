import { useEffect, useState } from 'react'
import { listTodos, toggleTodo, type Todo } from '@/api/todos'

/**
 * ANTI-EXEMPLO — `useEffect` + `useState` para buscar dado de servidor.
 *
 * É o padrão mais escrito do ecossistema React e o mais errado. A razão é
 * conceitual, não de ferramenta:
 *
 *   **Dado de servidor não é estado da sua aplicação. É CACHE.**
 *
 * Você não é dono dele. Ele pode mudar sem você saber, pode estar desatualizado,
 * pode ser compartilhado por várias telas, e precisa ser revalidado. Nada disso
 * é responsabilidade que `useState` saiba carregar.
 *
 * Tudo o que falta abaixo, e que você teria que escrever à mão:
 *
 *   [ ] deduplicação — dois componentes pedindo a mesma lista disparam 2 fetchs
 *   [ ] cache entre montagens — sair da tela e voltar refaz tudo do zero
 *   [ ] revalidação ao focar a janela / reconectar
 *   [ ] retry com backoff exponencial
 *   [ ] cancelamento e race condition (a resposta lenta chega depois da rápida
 *       e sobrescreve o dado novo com o antigo)
 *   [ ] invalidação após mutação
 *   [ ] atualização otimista com rollback
 *   [ ] estado "revalidando com dado antigo na tela" (stale-while-revalidate)
 *
 * Repare que o `alive` abaixo resolve o vazamento de setState após unmount, mas
 * NÃO resolve a race condition entre duas requisições da mesma tela. Esse bug é
 * invisível em desenvolvimento e aparece em produção, em rede ruim, como "o
 * filtro voltou sozinho".
 */
export function TodosManualRuim() {
  const [todos, setTodos] = useState<Todo[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [savingId, setSavingId] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    setLoading(true)
    listTodos()
      .then((data) => {
        if (alive) setTodos(data)
      })
      .catch(() => {
        if (alive) setError('Falha ao carregar')
      })
      .finally(() => {
        if (alive) setLoading(false)
      })
    return () => {
      alive = false
    }
  }, [])

  async function handleToggle(id: string) {
    setSavingId(id)
    try {
      const updated = await toggleTodo(id)
      setTodos((current) => current.map((todo) => (todo.id === id ? updated : todo)))
    } catch {
      setError('Falha ao salvar')
    } finally {
      setSavingId(null)
    }
  }

  if (loading) return <p>Carregando...</p>

  return (
    <div>
      {error ? <p role="alert">{error}</p> : null}
      <ul>
        {todos.map((todo) => (
          <li key={todo.id}>
            <label className="row">
              <input
                type="checkbox"
                checked={todo.done}
                disabled={savingId === todo.id}
                onChange={() => void handleToggle(todo.id)}
              />
              {todo.title}
            </label>
          </li>
        ))}
      </ul>
      <p className="muted">
        Recarregue a página e volte: tudo é buscado de novo. Abra esta tela em duas
        instâncias e conte as requisições.
      </p>
    </div>
  )
}
