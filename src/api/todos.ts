export type Todo = { id: string; title: string; done: boolean }

let db: Todo[] = [
  { id: 't1', title: 'Ler o README deste projeto', done: true },
  { id: 't2', title: 'Rodar os dois painéis de server state', done: false },
  { id: 't3', title: 'Comparar o número de requisições no DevTools', done: false },
]

const latency = () => new Promise((resolve) => setTimeout(resolve, 600))

export async function listTodos(): Promise<Todo[]> {
  await latency()
  return structuredClone(db)
}

export async function toggleTodo(id: string): Promise<Todo> {
  await latency()
  // Falha proposital em um item específico, para exercitar o rollback de
  // atualização otimista. Sem um caminho de falha reproduzível, ninguém testa
  // rollback — e é sempre ele que quebra em produção.
  if (id === 't3') throw new Error('Falha simulada ao salvar')

  db = db.map((todo) => (todo.id === id ? { ...todo, done: !todo.done } : todo))
  const updated = db.find((todo) => todo.id === id)
  if (!updated) throw new Error('Todo não encontrado')
  return structuredClone(updated)
}

export async function addTodo(title: string): Promise<Todo> {
  await latency()
  const todo: Todo = { id: crypto.randomUUID(), title, done: false }
  db = [...db, todo]
  return structuredClone(todo)
}
