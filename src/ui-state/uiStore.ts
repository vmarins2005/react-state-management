import { create } from 'zustand'

/**
 * ESTADO DE UI GLOBAL — Zustand.
 *
 * Este é estado que **você** é dono: um drawer aberto, um filtro de visualização,
 * o modo compacto da tabela. Não vem de servidor, não precisa de cache, não
 * precisa de revalidação.
 *
 * Por que Zustand e não Context aqui: o problema do Context não é performance
 * "em geral", é específico e mensurável — **todo consumidor re-renderiza quando
 * qualquer parte do `value` muda**. Um contexto com `{ sidebar, theme, filters }`
 * faz a tabela inteira re-renderizar quando alguém abre a sidebar.
 *
 * Zustand resolve isso com seletor: o componente se inscreve numa FATIA e só
 * re-renderiza quando aquela fatia muda.
 *
 *     const isOpen = useUiStore((s) => s.sidebarOpen)   // só reage à sidebar
 *
 * A regra de bolso que fecha a discussão Context vs. store:
 *
 *   Context  -> para o que é ESTÁVEL: dependências, tema, sessão, configuração.
 *               Muda uma vez ou nunca. É injeção de dependência.
 *   Store    -> para o que MUDA com frequência e é lido por muitos componentes.
 *
 * Se você precisa memoizar o `value` do Context e ainda assim vê re-render
 * demais, a resposta é uma store — não é mais `useMemo`.
 */

type UiState = {
  sidebarOpen: boolean
  density: 'confortavel' | 'compacta'
  toggleSidebar: () => void
  setDensity: (density: UiState['density']) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: false,
  density: 'confortavel',
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setDensity: (density) => set({ density }),
}))

/**
 * Seletores nomeados, exportados junto da store.
 *
 * Padrão que vale adotar em projeto real: evita que cada componente escreva o
 * próprio seletor inline (que é fácil de escrever errado, retornando um objeto
 * novo a cada render e anulando a otimização) e concentra num lugar só o que a
 * store expõe.
 */
export const selectSidebarOpen = (state: UiState) => state.sidebarOpen
export const selectDensity = (state: UiState) => state.density
