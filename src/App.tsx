import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import type { ReactNode } from 'react'
import { BuscaBoa, BuscaRuim } from './derived-state/derived'
import { SignupForm } from './form-state/SignupForm'
import { useTheme } from './persistent-state/useTheme'
import { TodosQuery } from './server-state/TodosQuery'
import { TodosManualRuim } from './server-state/TodosManual.ruim'
import { selectDensity, selectSidebarOpen, useUiStore } from './ui-state/uiStore'
import { useUrlState } from './url-state/useUrlState'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Padrões conscientes valem mais que qualquer otimização pontual.
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
})

function Kind(props: { n: string; title: string; tool: string; lead: string; children: ReactNode }) {
  return (
    <section>
      <h2>
        {props.n}. {props.title} <span className="tag">{props.tool}</span>
      </h2>
      <p>{props.lead}</p>
      {props.children}
    </section>
  )
}

function UiStateDemo() {
  // Seletores: cada componente se inscreve numa fatia, não na store inteira.
  const sidebarOpen = useUiStore(selectSidebarOpen)
  const density = useUiStore(selectDensity)
  const toggleSidebar = useUiStore((state) => state.toggleSidebar)
  const setDensity = useUiStore((state) => state.setDensity)

  return (
    <div className="panel">
      <div className="row">
        <button onClick={toggleSidebar}>
          {sidebarOpen ? 'Fechar' : 'Abrir'} sidebar
        </button>
        <select value={density} onChange={(e) => setDensity(e.target.value as typeof density)}>
          <option value="confortavel">Confortável</option>
          <option value="compacta">Compacta</option>
        </select>
      </div>
      <p className="muted">
        sidebar: <code>{String(sidebarOpen)}</code> — densidade: <code>{density}</code>
      </p>
    </div>
  )
}

function UrlStateDemo() {
  const [status, setStatus] = useUrlState<'todos' | 'ativos' | 'concluidos'>('status', 'todos')
  const [ordem, setOrdem] = useUrlState<'asc' | 'desc'>('ordem', 'asc')

  return (
    <div className="panel">
      <div className="row">
        {(['todos', 'ativos', 'concluidos'] as const).map((value) => (
          <button key={value} onClick={() => setStatus(value)} disabled={status === value}>
            {value}
          </button>
        ))}
        <button onClick={() => setOrdem(ordem === 'asc' ? 'desc' : 'asc')}>
          ordem: {ordem}
        </button>
      </div>
      <p className="muted">
        Olhe a barra de endereço. Recarregue a página, copie o link, abra numa aba nova —
        o estado vai junto. Repare também que o valor padrão não polui a URL.
      </p>
    </div>
  )
}

function PersistentStateDemo() {
  const { theme, setTheme, hydrated } = useTheme()

  return (
    <div className="panel">
      <div className="row">
        {(['claro', 'escuro', 'sistema'] as const).map((value) => (
          <button key={value} onClick={() => setTheme(value)} disabled={theme === value}>
            {value}
          </button>
        ))}
      </div>
      <p className="muted">
        {hydrated
          ? `preferência lida do localStorage: ${theme}`
          : 'ainda não hidratado — mostrando o padrão, como o servidor faria'}
      </p>
    </div>
  )
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <main>
        <h1>Taxonomia de estado</h1>
        <p>
          Antes de escolher a ferramenta, <strong>classifique o estado</strong>. Quase todo
          debate de &quot;Redux ou Context?&quot; some quando se percebe que 80% do que
          estava sendo discutido é cache de servidor, e nenhum dos dois é a resposta.
        </p>

        <Kind
          n="1"
          title="Server state"
          tool="TanStack Query"
          lead="Dado de servidor não é estado — é cache. Você não é dono dele. À esquerda, a versão manual com useEffect; à direita, a mesma tela tratada como cache. Marque o terceiro item para ver o rollback do otimismo."
        >
          <div className="grid cols-2">
            <div className="panel">
              <h3>
                <span className="tag bad">useEffect + useState</span>
              </h3>
              <TodosManualRuim />
            </div>
            <div className="panel">
              <h3>
                <span className="tag good">useQuery + useMutation</span>
              </h3>
              <TodosQuery />
            </div>
          </div>
        </Kind>

        <Kind
          n="2"
          title="UI state global"
          tool="Zustand"
          lead="Estado do qual você é dono e que muda com frequência. Context re-renderiza todo consumidor a cada mudança; store com seletor re-renderiza só quem lê a fatia alterada."
        >
          <UiStateDemo />
        </Kind>

        <Kind
          n="3"
          title="Form state"
          tool="React Hook Form + Zod"
          lead="Cada tecla é uma mudança de estado. RHF usa campos não controlados, então digitar não re-renderiza o formulário. O schema Zod é fonte única: valida em runtime e tipa em compilação."
        >
          <div className="panel">
            <SignupForm />
          </div>
        </Kind>

        <Kind
          n="4"
          title="URL state"
          tool="URLSearchParams"
          lead="A pergunta que decide: se o usuário mandasse este link para alguém, essa pessoa deveria ver a mesma tela? Se sim, o estado é da URL — e não de useState."
        >
          <UrlStateDemo />
        </Kind>

        <Kind
          n="5"
          title="Estado persistente"
          tool="localStorage"
          lead="Sobrevive ao refresh e vive no navegador. É onde mora o hydration mismatch: nunca leia o storage durante o render."
        >
          <PersistentStateDemo />
        </Kind>

        <Kind
          n="6"
          title="Estado derivado"
          tool="não é estado"
          lead="O tipo que não deveria existir. Se dá para calcular, calcule no render. Digite nos dois campos abaixo e compare o código de cada um."
        >
          <div className="grid cols-2">
            <div className="panel">
              <h3>
                <span className="tag bad">useState + useEffect</span>
              </h3>
              <BuscaRuim />
            </div>
            <div className="panel">
              <h3>
                <span className="tag good">calculado no render</span>
              </h3>
              <BuscaBoa />
            </div>
          </div>
        </Kind>
      </main>
    </QueryClientProvider>
  )
}
