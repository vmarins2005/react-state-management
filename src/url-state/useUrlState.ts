import { useCallback, useEffect, useState } from 'react'

/**
 * ESTADO DE URL — o tipo mais esquecido, e o que mais gera reclamação de usuário.
 *
 * Filtro, busca, ordenação, página, aba ativa, item selecionado. Se está em
 * `useState`, você acabou de quebrar:
 *
 *   - **compartilhar** — o link enviado no Slack abre a tela vazia
 *   - **voltar** — o botão do navegador sai da página em vez de desfazer o filtro
 *   - **recarregar** — F5 perde tudo o que a pessoa configurou
 *   - **abrir em nova aba** — Ctrl+clique perde o contexto
 *   - **favoritar** — impossível
 *   - **testar** — o E2E precisa clicar até chegar no estado, em vez de navegar
 *     direto para ele
 *
 * A pergunta que decide: **se o usuário mandasse este link para alguém, essa
 * pessoa deveria ver a mesma tela?** Se sim, o estado é da URL.
 *
 * Em Next.js isto se resolve com `useSearchParams` + `router.replace`, ou com a
 * biblioteca `nuqs`, que dá tipagem e serialização. Aqui está implementado à mão,
 * sem roteador, porque entender o mecanismo importa mais que a API.
 */
export function useUrlState<T extends string>(
  key: string,
  defaultValue: T,
): [T, (value: T) => void] {
  const read = useCallback((): T => {
    const params = new URLSearchParams(window.location.search)
    return (params.get(key) as T | null) ?? defaultValue
  }, [key, defaultValue])

  const [value, setValue] = useState<T>(read)

  const write = useCallback(
    (next: T) => {
      const params = new URLSearchParams(window.location.search)

      if (next === defaultValue) {
        // Não poluir a URL com o valor padrão. Detalhe pequeno que muda muito a
        // aparência de um link compartilhado.
        params.delete(key)
      } else {
        params.set(key, next)
      }

      const query = params.toString()
      const url = query ? `${window.location.pathname}?${query}` : window.location.pathname

      // `replaceState` para filtro que muda a cada tecla (não empilha histórico);
      // `pushState` para mudança que o usuário espera desfazer com "voltar",
      // como trocar de aba ou de página. Escolher errado aqui é a diferença
      // entre "voltar funciona" e "preciso apertar voltar 40 vezes".
      window.history.replaceState(null, '', url)
      setValue(next)
    },
    [key, defaultValue],
  )

  // Sincroniza quando o usuário usa voltar/avançar do navegador. Sem isto, o
  // histórico muda a URL e a tela não acompanha.
  useEffect(() => {
    const onPopState = () => setValue(read())
    window.addEventListener('popstate', onPopState)
    return () => window.removeEventListener('popstate', onPopState)
  }, [read])

  return [value, write]
}
